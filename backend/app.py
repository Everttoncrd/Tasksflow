from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

from database import get_connection, create_database


app = Flask(__name__)
CORS(app)

create_database()


# =========================================================
# FUNÇÕES AUXILIARES
# =========================================================

STATUS_VALIDOS = [
    "Pendente",
    "Em andamento",
    "Concluída"
]

PRIORIDADES_VALIDAS = [
    "Baixa",
    "Média",
    "Alta"
]


def normalize_text(value):
    if not isinstance(value, str):
        return ""

    return value.strip()


def category_exists(conn, category_name):
    category_name = normalize_text(category_name)

    if not category_name:
        return False

    category = conn.execute("""
        SELECT id
        FROM categories
        WHERE name = ? COLLATE NOCASE
    """, (category_name,)).fetchone()

    return category is not None


# =========================================================
# ROTA INICIAL
# =========================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "TaskFlow API funcionando!"
    })


# =========================================================
# LISTAR TAREFAS
# =========================================================

@app.route("/tasks", methods=["GET"])
def get_tasks():

    conn = get_connection()

    tasks = conn.execute("""
        SELECT *
        FROM tasks
        ORDER BY id DESC
    """).fetchall()

    conn.close()

    return jsonify([
        dict(task)
        for task in tasks
    ])


# =========================================================
# CRIAR TAREFA
# =========================================================

@app.route("/tasks", methods=["POST"])
def create_task():

    data = request.get_json() or {}

    title = normalize_text(
        data.get("title")
    )

    description = data.get(
        "description"
    )

    category = normalize_text(
        data.get("category")
    )

    priority = data.get(
        "priority",
        "Média"
    )

    status = data.get(
        "status",
        "Pendente"
    )

    due_date = data.get(
        "due_date"
    )

    # ---------------------------------------------------------
    # VALIDAÇÕES
    # ---------------------------------------------------------

    if not title:
        return jsonify({
            "error":
                "O título é obrigatório."
        }), 400

    if status not in STATUS_VALIDOS:
        return jsonify({
            "error":
                "Status inválido."
        }), 400

    if priority not in PRIORIDADES_VALIDAS:
        return jsonify({
            "error":
                "Prioridade inválida."
        }), 400

    if not category:
        return jsonify({
            "error":
                "A categoria é obrigatória."
        }), 400

    conn = get_connection()

    if not category_exists(
        conn,
        category
    ):
        conn.close()

        return jsonify({
            "error":
                "Categoria não encontrada."
        }), 400

    # ---------------------------------------------------------
    # CRIAR
    # ---------------------------------------------------------

    cursor = conn.execute("""
        INSERT INTO tasks
        (
            title,
            description,
            category,
            priority,
            status,
            due_date
        )
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        title,
        description,
        category,
        priority,
        status,
        due_date
    ))

    conn.commit()

    task_id = cursor.lastrowid

    task = conn.execute("""
        SELECT *
        FROM tasks
        WHERE id = ?
    """, (
        task_id,
    )).fetchone()

    conn.close()

    return jsonify(
        dict(task)
    ), 201


# =========================================================
# ATUALIZAR TAREFA COMPLETA
# =========================================================

@app.route(
    "/tasks/<int:id>",
    methods=["PUT"]
)
def update_task(id):

    data = request.get_json() or {}

    conn = get_connection()

    task = conn.execute("""
        SELECT *
        FROM tasks
        WHERE id = ?
    """, (
        id,
    )).fetchone()

    if task is None:
        conn.close()

        return jsonify({
            "error":
                "Tarefa não encontrada."
        }), 404

    title = normalize_text(
        data.get(
            "title",
            task["title"]
        )
    )

    category = normalize_text(
        data.get(
            "category",
            task["category"]
        )
    )

    priority = data.get(
        "priority",
        task["priority"]
    )

    novo_status = data.get(
        "status",
        task["status"]
    )

    # ---------------------------------------------------------
    # VALIDAÇÕES
    # ---------------------------------------------------------

    if not title:
        conn.close()

        return jsonify({
            "error":
                "O título é obrigatório."
        }), 400

    if (
        novo_status
        not in STATUS_VALIDOS
    ):
        conn.close()

        return jsonify({
            "error":
                "Status inválido."
        }), 400

    if (
        priority
        not in PRIORIDADES_VALIDAS
    ):
        conn.close()

        return jsonify({
            "error":
                "Prioridade inválida."
        }), 400

    if not category:
        conn.close()

        return jsonify({
            "error":
                "A categoria é obrigatória."
        }), 400

    if not category_exists(
        conn,
        category
    ):
        conn.close()

        return jsonify({
            "error":
                "Categoria não encontrada."
        }), 400

    # ---------------------------------------------------------
    # ATUALIZAR
    # ---------------------------------------------------------

    conn.execute("""
        UPDATE tasks
        SET
            title = ?,
            description = ?,
            category = ?,
            priority = ?,
            status = ?,
            due_date = ?
        WHERE id = ?
    """, (
        title,

        data.get(
            "description",
            task["description"]
        ),

        category,

        priority,

        novo_status,

        data.get(
            "due_date",
            task["due_date"]
        ),

        id
    ))

    conn.commit()

    updated_task = conn.execute("""
        SELECT *
        FROM tasks
        WHERE id = ?
    """, (
        id,
    )).fetchone()

    conn.close()

    return jsonify(
        dict(updated_task)
    )


# =========================================================
# ALTERAR SOMENTE STATUS
# =========================================================

@app.route(
    "/tasks/<int:id>/status",
    methods=["PUT"]
)
def update_task_status(id):

    data = request.get_json() or {}

    novo_status = data.get(
        "status"
    )

    if not novo_status:
        return jsonify({
            "error":
                "O status é obrigatório."
        }), 400

    if (
        novo_status
        not in STATUS_VALIDOS
    ):
        return jsonify({
            "error":
                "Status inválido."
        }), 400

    conn = get_connection()

    task = conn.execute("""
        SELECT *
        FROM tasks
        WHERE id = ?
    """, (
        id,
    )).fetchone()

    if task is None:
        conn.close()

        return jsonify({
            "error":
                "Tarefa não encontrada."
        }), 404

    conn.execute("""
        UPDATE tasks
        SET status = ?
        WHERE id = ?
    """, (
        novo_status,
        id
    ))

    conn.commit()

    updated_task = conn.execute("""
        SELECT *
        FROM tasks
        WHERE id = ?
    """, (
        id,
    )).fetchone()

    conn.close()

    return jsonify(
        dict(updated_task)
    )


# =========================================================
# EXCLUIR TAREFA
# =========================================================

@app.route(
    "/tasks/<int:id>",
    methods=["DELETE"]
)
def delete_task(id):

    conn = get_connection()

    task = conn.execute("""
        SELECT *
        FROM tasks
        WHERE id = ?
    """, (
        id,
    )).fetchone()

    if task is None:
        conn.close()

        return jsonify({
            "error":
                "Tarefa não encontrada."
        }), 404

    conn.execute("""
        DELETE FROM tasks
        WHERE id = ?
    """, (
        id,
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "message":
            "Tarefa excluída com sucesso."
    })


# =========================================================
# LISTAR CATEGORIAS
# =========================================================

@app.route(
    "/categories",
    methods=["GET"]
)
def get_categories():

    conn = get_connection()

    categories = conn.execute("""
        SELECT
            c.id,
            c.name,
            c.created_at,
            COUNT(t.id) AS task_count
        FROM categories c
        LEFT JOIN tasks t
            ON t.category = c.name COLLATE NOCASE
        GROUP BY
            c.id,
            c.name,
            c.created_at
        ORDER BY
            c.name COLLATE NOCASE ASC
    """).fetchall()

    conn.close()

    return jsonify([
        dict(category)
        for category in categories
    ])


# =========================================================
# CRIAR CATEGORIA
# =========================================================

@app.route(
    "/categories",
    methods=["POST"]
)
def create_category():

    data = request.get_json() or {}

    name = normalize_text(
        data.get("name")
    )

    if not name:
        return jsonify({
            "error":
                "O nome da categoria é obrigatório."
        }), 400

    if len(name) > 50:
        return jsonify({
            "error":
                "O nome da categoria deve ter no máximo 50 caracteres."
        }), 400

    conn = get_connection()

    existing = conn.execute("""
        SELECT *
        FROM categories
        WHERE name = ? COLLATE NOCASE
    """, (
        name,
    )).fetchone()

    if existing:
        conn.close()

        return jsonify({
            "error":
                "Essa categoria já existe."
        }), 409

    try:
        cursor = conn.execute("""
            INSERT INTO categories (name)
            VALUES (?)
        """, (
            name,
        ))

        conn.commit()

        category = conn.execute("""
            SELECT
                id,
                name,
                created_at
            FROM categories
            WHERE id = ?
        """, (
            cursor.lastrowid,
        )).fetchone()

        conn.close()

        result = dict(category)
        result["task_count"] = 0

        return jsonify(
            result
        ), 201

    except sqlite3.IntegrityError:
        conn.close()

        return jsonify({
            "error":
                "Essa categoria já existe."
        }), 409


# =========================================================
# EDITAR CATEGORIA
# =========================================================

@app.route(
    "/categories/<int:id>",
    methods=["PUT"]
)
def update_category(id):

    data = request.get_json() or {}

    new_name = normalize_text(
        data.get("name")
    )

    if not new_name:
        return jsonify({
            "error":
                "O nome da categoria é obrigatório."
        }), 400

    if len(new_name) > 50:
        return jsonify({
            "error":
                "O nome da categoria deve ter no máximo 50 caracteres."
        }), 400

    conn = get_connection()

    category = conn.execute("""
        SELECT *
        FROM categories
        WHERE id = ?
    """, (
        id,
    )).fetchone()

    if category is None:
        conn.close()

        return jsonify({
            "error":
                "Categoria não encontrada."
        }), 404

    duplicate = conn.execute("""
        SELECT id
        FROM categories
        WHERE name = ? COLLATE NOCASE
          AND id != ?
    """, (
        new_name,
        id
    )).fetchone()

    if duplicate:
        conn.close()

        return jsonify({
            "error":
                "Essa categoria já existe."
        }), 409

    old_name = category["name"]

    try:
        # -----------------------------------------------------
        # Atualiza a categoria
        # -----------------------------------------------------

        conn.execute("""
            UPDATE categories
            SET name = ?
            WHERE id = ?
        """, (
            new_name,
            id
        ))

        # -----------------------------------------------------
        # Atualiza automaticamente todas as tarefas
        # que utilizavam o nome antigo.
        # -----------------------------------------------------

        conn.execute("""
            UPDATE tasks
            SET category = ?
            WHERE category = ? COLLATE NOCASE
        """, (
            new_name,
            old_name
        ))

        conn.commit()

        updated_category = conn.execute("""
            SELECT
                c.id,
                c.name,
                c.created_at,
                COUNT(t.id) AS task_count
            FROM categories c
            LEFT JOIN tasks t
                ON t.category = c.name COLLATE NOCASE
            WHERE c.id = ?
            GROUP BY
                c.id,
                c.name,
                c.created_at
        """, (
            id,
        )).fetchone()

        conn.close()

        return jsonify(
            dict(updated_category)
        )

    except sqlite3.IntegrityError:
        conn.rollback()
        conn.close()

        return jsonify({
            "error":
                "Essa categoria já existe."
        }), 409


# =========================================================
# EXCLUIR CATEGORIA
# =========================================================

@app.route(
    "/categories/<int:id>",
    methods=["DELETE"]
)
def delete_category(id):

    conn = get_connection()

    category = conn.execute("""
        SELECT *
        FROM categories
        WHERE id = ?
    """, (
        id,
    )).fetchone()

    if category is None:
        conn.close()

        return jsonify({
            "error":
                "Categoria não encontrada."
        }), 404

    # ---------------------------------------------------------
    # VERIFICAR SE ESTÁ SENDO UTILIZADA
    # ---------------------------------------------------------

    task_count = conn.execute("""
        SELECT COUNT(*)
        FROM tasks
        WHERE category = ? COLLATE NOCASE
    """, (
        category["name"],
    )).fetchone()[0]

    if task_count > 0:
        conn.close()

        return jsonify({
            "error":
                "Não é possível excluir esta categoria porque existem tarefas vinculadas a ela.",
            "task_count":
                task_count
        }), 409

    # ---------------------------------------------------------
    # EXCLUIR
    # ---------------------------------------------------------

    conn.execute("""
        DELETE FROM categories
        WHERE id = ?
    """, (
        id,
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "message":
            "Categoria excluída com sucesso."
    })


# =========================================================
# DASHBOARD
# =========================================================

@app.route(
    "/dashboard",
    methods=["GET"]
)
def dashboard():

    conn = get_connection()

    total = conn.execute("""
        SELECT COUNT(*)
        FROM tasks
    """).fetchone()[0]

    pending = conn.execute("""
        SELECT COUNT(*)
        FROM tasks
        WHERE status = 'Pendente'
    """).fetchone()[0]

    progress = conn.execute("""
        SELECT COUNT(*)
        FROM tasks
        WHERE status = 'Em andamento'
    """).fetchone()[0]

    completed = conn.execute("""
        SELECT COUNT(*)
        FROM tasks
        WHERE status = 'Concluída'
    """).fetchone()[0]

    conn.close()

    percentual = 0

    if total > 0:
        percentual = round(
            (
                completed /
                total
            ) * 100
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
            percentual
    })


# =========================================================
# INICIAR SERVIDOR
# =========================================================

if __name__ == "__main__":
    app.run(
        debug=True
    )