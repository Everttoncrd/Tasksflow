import os
import re
import secrets

from datetime import datetime, timedelta, timezone
from functools import wraps

import psycopg

from dotenv import load_dotenv
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import (
    check_password_hash,
    generate_password_hash,
)


# =========================================================
# VARIÁVEIS DE AMBIENTE
# =========================================================

load_dotenv()


from database import (
    claim_legacy_data_for_first_user,
    create_database,
    get_connection,
    seed_default_categories,
)


# =========================================================
# CONFIGURAÇÃO
# =========================================================

app = Flask(__name__)


IS_PRODUCTION = (
    os.getenv(
        "FLASK_ENV",
        "development",
    ).lower()
    == "production"
)


SECRET_KEY = os.getenv("SECRET_KEY")


if not SECRET_KEY:
    if IS_PRODUCTION:
        raise RuntimeError(
            "SECRET_KEY não configurada."
        )

    SECRET_KEY = (
        "taskflow-dev-only-change-me"
    )


FRONTEND_ORIGIN = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:5173",
)


app.config.update(
    SECRET_KEY=SECRET_KEY,

    SESSION_COOKIE_HTTPONLY=True,

    SESSION_COOKIE_SECURE=IS_PRODUCTION,

    # Local:
    # frontend e backend usam localhost.
    #
    # Produção:
    # frontend e API poderão estar em domínios
    # diferentes, exigindo SameSite=None.
    SESSION_COOKIE_SAMESITE=(
        "None"
        if IS_PRODUCTION
        else "Lax"
    ),

    PERMANENT_SESSION_LIFETIME=timedelta(
        hours=8
    ),
)


CORS(
    app,

    resources={
        r"/*": {
            "origins": [
                FRONTEND_ORIGIN
            ]
        }
    },

    supports_credentials=True,

    allow_headers=[
        "Content-Type",
        "X-CSRF-Token",
    ],
)


# =========================================================
# RATE LIMITING
# =========================================================

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=[],

    # Desenvolvimento.
    #
    # Antes do deploy definitivo vamos trocar
    # por armazenamento compartilhado.
    storage_uri="memory://",
)


# =========================================================
# BANCO
# =========================================================

create_database()


# =========================================================
# CONSTANTES
# =========================================================

STATUS_VALIDOS = [
    "Pendente",
    "Em andamento",
    "Concluída",
]


PRIORIDADES_VALIDAS = [
    "Baixa",
    "Média",
    "Alta",
]


MAX_LOGIN_ATTEMPTS = 5

LOCK_MINUTES = 15


EMAIL_REGEX = re.compile(
    r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
)


SAFE_METHODS = {
    "GET",
    "HEAD",
    "OPTIONS",
}


# =========================================================
# FUNÇÕES AUXILIARES
# =========================================================

def normalize_text(value):
    if not isinstance(value, str):
        return ""

    return value.strip()


def utc_now():
    return datetime.now(
        timezone.utc
    )


def parse_datetime(value):
    if not value:
        return None

    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(
                tzinfo=timezone.utc
            )

        return value.astimezone(
            timezone.utc
        )

    try:
        result = datetime.fromisoformat(
            str(value)
        )

        if result.tzinfo is None:
            result = result.replace(
                tzinfo=timezone.utc
            )

        return result.astimezone(
            timezone.utc
        )

    except (
        TypeError,
        ValueError,
    ):
        return None


def public_user(user):
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "created_at": user["created_at"],
    }


def validate_password(password):
    if not isinstance(
        password,
        str,
    ):
        return (
            "A senha é obrigatória."
        )

    if len(password) < 8:
        return (
            "A senha deve ter pelo menos "
            "8 caracteres."
        )

    if len(password) > 128:
        return (
            "A senha deve ter no máximo "
            "128 caracteres."
        )

    if not re.search(
        r"[A-Za-z]",
        password,
    ):
        return (
            "A senha deve possuir "
            "pelo menos uma letra."
        )

    if not re.search(
        r"\d",
        password,
    ):
        return (
            "A senha deve possuir "
            "pelo menos um número."
        )

    return None


def current_user_id():
    return session.get(
        "user_id"
    )


# =========================================================
# AUTENTICAÇÃO DAS ROTAS
# =========================================================

def login_required(view):

    @wraps(view)
    def wrapped(
        *args,
        **kwargs,
    ):
        user_id = current_user_id()

        if not user_id:
            return jsonify({
                "error":
                    "Autenticação necessária."
            }), 401

        conn = get_connection()

        try:
            user = conn.execute(
                """
                SELECT
                    id,
                    name,
                    email,
                    created_at

                FROM users

                WHERE id = %s
                """,
                (
                    user_id,
                ),
            ).fetchone()

        finally:
            conn.close()

        if user is None:
            session.clear()

            return jsonify({
                "error":
                    "Sessão inválida."
            }), 401

        return view(
            *args,
            **kwargs,
        )

    return wrapped


# =========================================================
# CSRF
# =========================================================

def generate_csrf_token():

    token = session.get(
        "csrf_token"
    )

    if not token:
        token = secrets.token_urlsafe(
            32
        )

        session[
            "csrf_token"
        ] = token

    return token


def rotate_csrf_token():

    token = secrets.token_urlsafe(
        32
    )

    session[
        "csrf_token"
    ] = token

    return token


@app.before_request
def csrf_protection():

    if request.method in SAFE_METHODS:
        return None

    # Login e cadastro ainda não possuem
    # uma sessão autenticada.
    if request.path in {
        "/auth/login",
        "/auth/register",
    }:
        return None

    if not current_user_id():
        return None

    session_token = session.get(
        "csrf_token"
    )

    request_token = (
        request.headers.get(
            "X-CSRF-Token"
        )
    )

    if (
        not session_token
        or not request_token
        or not secrets.compare_digest(
            session_token,
            request_token,
        )
    ):
        return jsonify({
            "error":
                "Token CSRF inválido ou ausente."
        }), 403

    return None


@app.route(
    "/auth/csrf",
    methods=["GET"],
)
@login_required
def csrf_token():

    return jsonify({
        "csrf_token":
            generate_csrf_token()
    })


# =========================================================
# FUNÇÕES DE TAREFAS / CATEGORIAS
# =========================================================

def category_exists(
    conn,
    user_id,
    category_name,
):

    category_name = normalize_text(
        category_name
    )

    if not category_name:
        return False

    category = conn.execute(
        """
        SELECT id

        FROM categories

        WHERE user_id = %s
          AND LOWER(name) = LOWER(%s)
        """,
        (
            user_id,
            category_name,
        ),
    ).fetchone()

    return category is not None


def get_owned_task(
    conn,
    task_id,
    user_id,
):

    return conn.execute(
        """
        SELECT
            id,
            user_id,
            title,
            description,
            category,
            priority,
            status,
            due_date::text AS due_date,
            created_at

        FROM tasks

        WHERE id = %s
          AND user_id = %s
        """,
        (
            task_id,
            user_id,
        ),
    ).fetchone()


# =========================================================
# HEADERS DE SEGURANÇA
# =========================================================

@app.after_request
def security_headers(response):

    response.headers[
        "X-Content-Type-Options"
    ] = "nosniff"

    response.headers[
        "X-Frame-Options"
    ] = "DENY"

    response.headers[
        "Referrer-Policy"
    ] = (
        "strict-origin-when-cross-origin"
    )

    response.headers[
        "Permissions-Policy"
    ] = (
        "camera=(), "
        "microphone=(), "
        "geolocation=()"
    )

    response.headers[
        "Cache-Control"
    ] = "no-store"

    return response


# =========================================================
# HOME
# =========================================================

@app.route(
    "/",
    methods=["GET"],
)
def home():

    return jsonify({
        "message":
            "TaskFlow API funcionando!"
    })


# =========================================================
# CADASTRO
# =========================================================

@app.route(
    "/auth/register",
    methods=["POST"],
)
@limiter.limit(
    "5 per minute"
)
def register():

    data = request.get_json(
        silent=True
    ) or {}

    name = normalize_text(
        data.get("name")
    )

    email = normalize_text(
        data.get("email")
    ).lower()

    password = data.get(
        "password",
        "",
    )

    if (
        len(name) < 2
        or len(name) > 80
    ):
        return jsonify({
            "error":
                "Informe um nome entre "
                "2 e 80 caracteres."
        }), 400

    if (
        not EMAIL_REGEX.match(email)
        or len(email) > 254
    ):
        return jsonify({
            "error":
                "Informe um e-mail válido."
        }), 400

    password_error = (
        validate_password(
            password
        )
    )

    if password_error:
        return jsonify({
            "error":
                password_error
        }), 400

    conn = get_connection()

    try:
        existing = conn.execute(
            """
            SELECT id

            FROM users

            WHERE LOWER(email)
                = LOWER(%s)
            """,
            (
                email,
            ),
        ).fetchone()

        if existing:
            return jsonify({
                "error":
                    "Não foi possível criar "
                    "a conta com esses dados."
            }), 409

        password_hash = (
            generate_password_hash(
                password,
                method="scrypt",
            )
        )

        user = conn.execute(
            """
            INSERT INTO users (
                name,
                email,
                password_hash
            )

            VALUES (
                %s,
                %s,
                %s
            )

            RETURNING
                id,
                name,
                email,
                created_at
            """,
            (
                name,
                email,
                password_hash,
            ),
        ).fetchone()

        user_id = user["id"]

        claim_legacy_data_for_first_user(
            conn,
            user_id,
        )

        seed_default_categories(
            conn,
            user_id,
        )

        conn.commit()

        session.clear()
        session.permanent = True

        session[
            "user_id"
        ] = user_id

        rotate_csrf_token()

        return jsonify({
            "message":
                "Conta criada com sucesso.",

            "user":
                public_user(user),
        }), 201

    except psycopg.IntegrityError:
        conn.rollback()

        return jsonify({
            "error":
                "Não foi possível criar "
                "a conta com esses dados."
        }), 409

    finally:
        conn.close()


# =========================================================
# LOGIN
# =========================================================

@app.route(
    "/auth/login",
    methods=["POST"],
)
@limiter.limit(
    "10 per minute"
)
def login():

    data = request.get_json(
        silent=True
    ) or {}

    email = normalize_text(
        data.get("email")
    ).lower()

    password = data.get(
        "password",
        "",
    )

    generic_error = {
        "error":
            "E-mail ou senha inválidos."
    }

    if (
        not email
        or not isinstance(
            password,
            str,
        )
    ):
        return jsonify(
            generic_error
        ), 401

    conn = get_connection()

    try:
        user = conn.execute(
            """
            SELECT *

            FROM users

            WHERE LOWER(email)
                = LOWER(%s)
            """,
            (
                email,
            ),
        ).fetchone()

        if user is None:
            return jsonify(
                generic_error
            ), 401

        locked_until = parse_datetime(
            user["locked_until"]
        )

        if (
            locked_until
            and locked_until
            > utc_now()
        ):
            seconds = int(
                (
                    locked_until
                    - utc_now()
                ).total_seconds()
            )

            return jsonify({
                "error":
                    "Muitas tentativas "
                    "incorretas. Tente "
                    "novamente mais tarde.",

                "retry_after_seconds":
                    max(
                        seconds,
                        1,
                    ),
            }), 429

        if not check_password_hash(
            user["password_hash"],
            password,
        ):

            attempts = (
                int(
                    user[
                        "failed_login_attempts"
                    ]
                    or 0
                )
                + 1
            )

            if (
                attempts
                >= MAX_LOGIN_ATTEMPTS
            ):

                lock_until = (
                    utc_now()
                    + timedelta(
                        minutes=LOCK_MINUTES
                    )
                )

                conn.execute(
                    """
                    UPDATE users

                    SET
                        failed_login_attempts = 0,
                        locked_until = %s,
                        updated_at =
                            CURRENT_TIMESTAMP

                    WHERE id = %s
                    """,
                    (
                        lock_until,
                        user["id"],
                    ),
                )

                conn.commit()

                return jsonify({
                    "error":
                        "Muitas tentativas "
                        "incorretas. A conta "
                        "foi temporariamente "
                        "bloqueada.",

                    "retry_after_seconds":
                        LOCK_MINUTES * 60,
                }), 429

            conn.execute(
                """
                UPDATE users

                SET
                    failed_login_attempts = %s,
                    locked_until = NULL,
                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE id = %s
                """,
                (
                    attempts,
                    user["id"],
                ),
            )

            conn.commit()

            return jsonify(
                generic_error
            ), 401

        conn.execute(
            """
            UPDATE users

            SET
                failed_login_attempts = 0,
                locked_until = NULL,
                updated_at =
                    CURRENT_TIMESTAMP

            WHERE id = %s
            """,
            (
                user["id"],
            ),
        )

        conn.commit()

        session.clear()
        session.permanent = True

        session[
            "user_id"
        ] = user["id"]

        rotate_csrf_token()

        return jsonify({
            "message":
                "Login realizado com sucesso.",

            "user":
                public_user(user),
        })

    finally:
        conn.close()


# =========================================================
# USUÁRIO ATUAL
# =========================================================

@app.route(
    "/auth/me",
    methods=["GET"],
)
@login_required
def me():

    conn = get_connection()

    try:
        user = conn.execute(
            """
            SELECT
                id,
                name,
                email,
                created_at

            FROM users

            WHERE id = %s
            """,
            (
                current_user_id(),
            ),
        ).fetchone()

        return jsonify({
            "user":
                public_user(user)
        })

    finally:
        conn.close()


# =========================================================
# LOGOUT
# =========================================================

@app.route(
    "/auth/logout",
    methods=["POST"],
)
@login_required
def logout():

    session.clear()

    return jsonify({
        "message":
            "Logout realizado com sucesso."
    })


# =========================================================
# ALTERAR SENHA
# =========================================================

@app.route(
    "/auth/change-password",
    methods=["PUT"],
)
@login_required
@limiter.limit(
    "5 per minute"
)
def change_password():

    data = request.get_json(
        silent=True
    ) or {}

    current_password = data.get(
        "current_password",
        "",
    )

    new_password = data.get(
        "new_password",
        "",
    )

    password_error = (
        validate_password(
            new_password
        )
    )

    if password_error:
        return jsonify({
            "error":
                password_error
        }), 400

    if (
        current_password
        == new_password
    ):
        return jsonify({
            "error":
                "A nova senha deve ser "
                "diferente da senha atual."
        }), 400

    conn = get_connection()

    try:
        user = conn.execute(
            """
            SELECT
                id,
                password_hash

            FROM users

            WHERE id = %s
            """,
            (
                current_user_id(),
            ),
        ).fetchone()

        if (
            user is None
            or not check_password_hash(
                user["password_hash"],
                current_password,
            )
        ):
            return jsonify({
                "error":
                    "Senha atual incorreta."
            }), 401

        password_hash = (
            generate_password_hash(
                new_password,
                method="scrypt",
            )
        )

        conn.execute(
            """
            UPDATE users

            SET
                password_hash = %s,
                updated_at =
                    CURRENT_TIMESTAMP

            WHERE id = %s
            """,
            (
                password_hash,
                current_user_id(),
            ),
        )

        conn.commit()

        rotate_csrf_token()

        return jsonify({
            "message":
                "Senha alterada com sucesso."
        })

    finally:
        conn.close()


# =========================================================
# LISTAR TAREFAS
# =========================================================

@app.route(
    "/tasks",
    methods=["GET"],
)
@login_required
def get_tasks():

    user_id = current_user_id()

    conn = get_connection()

    try:
        tasks = conn.execute(
            """
            SELECT
                id,
                title,
                description,
                category,
                priority,
                status,
                due_date::text AS due_date,
                created_at

            FROM tasks

            WHERE user_id = %s

            ORDER BY id DESC
            """,
            (
                user_id,
            ),
        ).fetchall()

        return jsonify(
            tasks
        )

    finally:
        conn.close()


# =========================================================
# CRIAR TAREFA
# =========================================================

@app.route(
    "/tasks",
    methods=["POST"],
)
@login_required
def create_task():

    data = request.get_json(
        silent=True
    ) or {}

    title = normalize_text(
        data.get("title")
    )

    description = normalize_text(
        data.get("description")
    )

    category = normalize_text(
        data.get("category")
    )

    priority = data.get(
        "priority",
        "Média",
    )

    status = data.get(
        "status",
        "Pendente",
    )

    due_date = data.get(
        "due_date"
    ) or None

    if not title:
        return jsonify({
            "error":
                "O título é obrigatório."
        }), 400

    if len(title) > 150:
        return jsonify({
            "error":
                "O título deve ter no máximo "
                "150 caracteres."
        }), 400

    if len(description) > 5000:
        return jsonify({
            "error":
                "A descrição deve ter no máximo "
                "5000 caracteres."
        }), 400

    if status not in STATUS_VALIDOS:
        return jsonify({
            "error":
                "Status inválido."
        }), 400

    if (
        priority
        not in PRIORIDADES_VALIDAS
    ):
        return jsonify({
            "error":
                "Prioridade inválida."
        }), 400

    if not category:
        return jsonify({
            "error":
                "A categoria é obrigatória."
        }), 400

    user_id = current_user_id()

    conn = get_connection()

    try:
        if not category_exists(
            conn,
            user_id,
            category,
        ):
            return jsonify({
                "error":
                    "Categoria não encontrada."
            }), 400

        row = conn.execute(
            """
            INSERT INTO tasks (
                user_id,
                title,
                description,
                category,
                priority,
                status,
                due_date
            )

            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )

            RETURNING id
            """,
            (
                user_id,
                title,
                description,
                category,
                priority,
                status,
                due_date,
            ),
        ).fetchone()

        conn.commit()

        task = get_owned_task(
            conn,
            row["id"],
            user_id,
        )

        return jsonify(
            task
        ), 201

    finally:
        conn.close()


# =========================================================
# ATUALIZAR TAREFA
# =========================================================

@app.route(
    "/tasks/<int:id>",
    methods=["PUT"],
)
@login_required
def update_task(id):

    data = request.get_json(
        silent=True
    ) or {}

    user_id = current_user_id()

    conn = get_connection()

    try:
        task = get_owned_task(
            conn,
            id,
            user_id,
        )

        if task is None:
            return jsonify({
                "error":
                    "Tarefa não encontrada."
            }), 404

        title = normalize_text(
            data.get(
                "title",
                task["title"],
            )
        )

        description = normalize_text(
            data.get(
                "description",
                task["description"]
                or "",
            )
        )

        category = normalize_text(
            data.get(
                "category",
                task["category"],
            )
        )

        priority = data.get(
            "priority",
            task["priority"],
        )

        status = data.get(
            "status",
            task["status"],
        )

        due_date = data.get(
            "due_date",
            task["due_date"],
        ) or None

        if not title:
            return jsonify({
                "error":
                    "O título é obrigatório."
            }), 400

        if len(title) > 150:
            return jsonify({
                "error":
                    "O título deve ter no máximo "
                    "150 caracteres."
            }), 400

        if len(description) > 5000:
            return jsonify({
                "error":
                    "A descrição deve ter no máximo "
                    "5000 caracteres."
            }), 400

        if status not in STATUS_VALIDOS:
            return jsonify({
                "error":
                    "Status inválido."
            }), 400

        if (
            priority
            not in PRIORIDADES_VALIDAS
        ):
            return jsonify({
                "error":
                    "Prioridade inválida."
            }), 400

        if not category_exists(
            conn,
            user_id,
            category,
        ):
            return jsonify({
                "error":
                    "Categoria não encontrada."
            }), 400

        conn.execute(
            """
            UPDATE tasks

            SET
                title = %s,
                description = %s,
                category = %s,
                priority = %s,
                status = %s,
                due_date = %s

            WHERE id = %s
              AND user_id = %s
            """,
            (
                title,
                description,
                category,
                priority,
                status,
                due_date,
                id,
                user_id,
            ),
        )

        conn.commit()

        updated_task = (
            get_owned_task(
                conn,
                id,
                user_id,
            )
        )

        return jsonify(
            updated_task
        )

    finally:
        conn.close()


# =========================================================
# ALTERAR STATUS
# =========================================================

@app.route(
    "/tasks/<int:id>/status",
    methods=["PUT"],
)
@login_required
def update_task_status(id):

    data = request.get_json(
        silent=True
    ) or {}

    new_status = data.get(
        "status"
    )

    if (
        new_status
        not in STATUS_VALIDOS
    ):
        return jsonify({
            "error":
                "Status inválido."
        }), 400

    user_id = current_user_id()

    conn = get_connection()

    try:
        task = get_owned_task(
            conn,
            id,
            user_id,
        )

        if task is None:
            return jsonify({
                "error":
                    "Tarefa não encontrada."
            }), 404

        conn.execute(
            """
            UPDATE tasks

            SET status = %s

            WHERE id = %s
              AND user_id = %s
            """,
            (
                new_status,
                id,
                user_id,
            ),
        )

        conn.commit()

        updated_task = (
            get_owned_task(
                conn,
                id,
                user_id,
            )
        )

        return jsonify(
            updated_task
        )

    finally:
        conn.close()


# =========================================================
# EXCLUIR TAREFA
# =========================================================

@app.route(
    "/tasks/<int:id>",
    methods=["DELETE"],
)
@login_required
def delete_task(id):

    user_id = current_user_id()

    conn = get_connection()

    try:
        task = get_owned_task(
            conn,
            id,
            user_id,
        )

        if task is None:
            return jsonify({
                "error":
                    "Tarefa não encontrada."
            }), 404

        conn.execute(
            """
            DELETE FROM tasks

            WHERE id = %s
              AND user_id = %s
            """,
            (
                id,
                user_id,
            ),
        )

        conn.commit()

        return jsonify({
            "message":
                "Tarefa excluída com sucesso."
        })

    finally:
        conn.close()


# =========================================================
# LISTAR CATEGORIAS
# =========================================================

@app.route(
    "/categories",
    methods=["GET"],
)
@login_required
def get_categories():

    user_id = current_user_id()

    conn = get_connection()

    try:
        categories = conn.execute(
            """
            SELECT
                c.id,
                c.name,
                c.created_at,
                COUNT(t.id) AS task_count

            FROM categories c

            LEFT JOIN tasks t
                ON t.user_id = c.user_id
               AND LOWER(t.category)
                    = LOWER(c.name)

            WHERE c.user_id = %s

            GROUP BY
                c.id,
                c.name,
                c.created_at

            ORDER BY
                LOWER(c.name) ASC
            """,
            (
                user_id,
            ),
        ).fetchall()

        return jsonify(
            categories
        )

    finally:
        conn.close()


# =========================================================
# CRIAR CATEGORIA
# =========================================================

@app.route(
    "/categories",
    methods=["POST"],
)
@login_required
def create_category():

    data = request.get_json(
        silent=True
    ) or {}

    name = normalize_text(
        data.get("name")
    )

    if not name:
        return jsonify({
            "error":
                "O nome da categoria "
                "é obrigatório."
        }), 400

    if len(name) > 50:
        return jsonify({
            "error":
                "O nome da categoria deve "
                "ter no máximo 50 caracteres."
        }), 400

    user_id = current_user_id()

    conn = get_connection()

    try:
        existing = conn.execute(
            """
            SELECT id

            FROM categories

            WHERE user_id = %s
              AND LOWER(name)
                    = LOWER(%s)
            """,
            (
                user_id,
                name,
            ),
        ).fetchone()

        if existing:
            return jsonify({
                "error":
                    "Essa categoria já existe."
            }), 409

        category = conn.execute(
            """
            INSERT INTO categories (
                user_id,
                name
            )

            VALUES (
                %s,
                %s
            )

            RETURNING
                id,
                name,
                created_at
            """,
            (
                user_id,
                name,
            ),
        ).fetchone()

        conn.commit()

        result = dict(
            category
        )

        result[
            "task_count"
        ] = 0

        return jsonify(
            result
        ), 201

    except psycopg.IntegrityError:
        conn.rollback()

        return jsonify({
            "error":
                "Essa categoria já existe."
        }), 409

    finally:
        conn.close()


# =========================================================
# EDITAR CATEGORIA
# =========================================================

@app.route(
    "/categories/<int:id>",
    methods=["PUT"],
)
@login_required
def update_category(id):

    data = request.get_json(
        silent=True
    ) or {}

    new_name = normalize_text(
        data.get("name")
    )

    if not new_name:
        return jsonify({
            "error":
                "O nome da categoria "
                "é obrigatório."
        }), 400

    if len(new_name) > 50:
        return jsonify({
            "error":
                "O nome da categoria deve "
                "ter no máximo 50 caracteres."
        }), 400

    user_id = current_user_id()

    conn = get_connection()

    try:
        category = conn.execute(
            """
            SELECT *

            FROM categories

            WHERE id = %s
              AND user_id = %s
            """,
            (
                id,
                user_id,
            ),
        ).fetchone()

        if category is None:
            return jsonify({
                "error":
                    "Categoria não encontrada."
            }), 404

        duplicate = conn.execute(
            """
            SELECT id

            FROM categories

            WHERE user_id = %s
              AND LOWER(name)
                    = LOWER(%s)
              AND id != %s
            """,
            (
                user_id,
                new_name,
                id,
            ),
        ).fetchone()

        if duplicate:
            return jsonify({
                "error":
                    "Essa categoria já existe."
            }), 409

        old_name = (
            category["name"]
        )

        conn.execute(
            """
            UPDATE categories

            SET name = %s

            WHERE id = %s
              AND user_id = %s
            """,
            (
                new_name,
                id,
                user_id,
            ),
        )

        conn.execute(
            """
            UPDATE tasks

            SET category = %s

            WHERE user_id = %s
              AND LOWER(category)
                    = LOWER(%s)
            """,
            (
                new_name,
                user_id,
                old_name,
            ),
        )

        conn.commit()

        updated_category = (
            conn.execute(
                """
                SELECT
                    c.id,
                    c.name,
                    c.created_at,
                    COUNT(t.id)
                        AS task_count

                FROM categories c

                LEFT JOIN tasks t
                    ON t.user_id
                        = c.user_id
                   AND LOWER(t.category)
                        = LOWER(c.name)

                WHERE c.id = %s
                  AND c.user_id = %s

                GROUP BY
                    c.id,
                    c.name,
                    c.created_at
                """,
                (
                    id,
                    user_id,
                ),
            ).fetchone()
        )

        return jsonify(
            updated_category
        )

    except psycopg.IntegrityError:
        conn.rollback()

        return jsonify({
            "error":
                "Essa categoria já existe."
        }), 409

    finally:
        conn.close()


# =========================================================
# EXCLUIR CATEGORIA
# =========================================================

@app.route(
    "/categories/<int:id>",
    methods=["DELETE"],
)
@login_required
def delete_category(id):

    user_id = current_user_id()

    conn = get_connection()

    try:
        category = conn.execute(
            """
            SELECT *

            FROM categories

            WHERE id = %s
              AND user_id = %s
            """,
            (
                id,
                user_id,
            ),
        ).fetchone()

        if category is None:
            return jsonify({
                "error":
                    "Categoria não encontrada."
            }), 404

        task_count_row = (
            conn.execute(
                """
                SELECT
                    COUNT(*) AS total

                FROM tasks

                WHERE user_id = %s
                  AND LOWER(category)
                        = LOWER(%s)
                """,
                (
                    user_id,
                    category["name"],
                ),
            ).fetchone()
        )

        task_count = (
            task_count_row["total"]
        )

        if task_count > 0:
            return jsonify({
                "error":
                    "Não é possível excluir "
                    "esta categoria porque "
                    "existem tarefas "
                    "vinculadas a ela.",

                "task_count":
                    task_count,
            }), 409

        conn.execute(
            """
            DELETE FROM categories

            WHERE id = %s
              AND user_id = %s
            """,
            (
                id,
                user_id,
            ),
        )

        conn.commit()

        return jsonify({
            "message":
                "Categoria excluída "
                "com sucesso."
        })

    finally:
        conn.close()


# =========================================================
# DASHBOARD
# =========================================================

@app.route(
    "/dashboard",
    methods=["GET"],
)
@login_required
def dashboard():

    user_id = current_user_id()

    conn = get_connection()

    try:
        result = conn.execute(
            """
            SELECT
                COUNT(*) AS total,

                COUNT(*) FILTER (
                    WHERE status = 'Pendente'
                ) AS pending,

                COUNT(*) FILTER (
                    WHERE status = 'Em andamento'
                ) AS progress,

                COUNT(*) FILTER (
                    WHERE status = 'Concluída'
                ) AS completed

            FROM tasks

            WHERE user_id = %s
            """,
            (
                user_id,
            ),
        ).fetchone()

    finally:
        conn.close()

    total = (
        result["total"]
        or 0
    )

    pending = (
        result["pending"]
        or 0
    )

    progress = (
        result["progress"]
        or 0
    )

    completed = (
        result["completed"]
        or 0
    )

    percentage = 0

    if total > 0:
        percentage = round(
            (
                completed
                / total
            )
            * 100
        )

    return jsonify({
        "total":
            total,

        "pending":
            pending,

        "progress":
            progress,

        "completed":
            completed,

        "percentage":
            percentage,
    })


# =========================================================
# ERROS
# =========================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "error":
            "Rota não encontrada."
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):

    return jsonify({
        "error":
            "Método não permitido."
    }), 405


@app.errorhandler(429)
def rate_limit_exceeded(error):

    return jsonify({
        "error":
            "Muitas requisições. "
            "Aguarde um momento "
            "e tente novamente."
    }), 429


@app.errorhandler(500)
def internal_error(error):

    return jsonify({
        "error":
            "Erro interno do servidor."
    }), 500


# =========================================================
# SERVIDOR LOCAL
# =========================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=not IS_PRODUCTION,
    )