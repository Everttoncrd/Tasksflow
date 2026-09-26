import os

import psycopg
from psycopg.rows import dict_row


DEFAULT_CATEGORIES = [
    "Trabalho",
    "Estudos",
    "Pessoal",
    "Projetos",
]


# =========================================================
# CONEXÃO
# =========================================================

def get_database_url():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError(
            "DATABASE_URL não configurada."
        )

    return database_url


def get_connection():
    return psycopg.connect(
        get_database_url(),
        row_factory=dict_row,
        connect_timeout=10,
    )


# =========================================================
# CRIAÇÃO DAS TABELAS
# =========================================================

def create_database():
    conn = get_connection()

    try:
        # -------------------------------------------------
        # USUÁRIOS
        # -------------------------------------------------

        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id BIGSERIAL PRIMARY KEY,

                name VARCHAR(80) NOT NULL,

                email VARCHAR(254) NOT NULL,

                password_hash TEXT NOT NULL,

                failed_login_attempts INTEGER
                    NOT NULL
                    DEFAULT 0,

                locked_until TIMESTAMPTZ,

                created_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # E-mail único ignorando maiúsculas/minúsculas.
        conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS
            idx_users_email_lower
            ON users (LOWER(email))
        """)

        # -------------------------------------------------
        # TAREFAS
        # -------------------------------------------------

        conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id BIGSERIAL PRIMARY KEY,

                user_id BIGINT NOT NULL,

                title VARCHAR(150) NOT NULL,

                description TEXT,

                category VARCHAR(50) NOT NULL,

                priority VARCHAR(20)
                    NOT NULL
                    DEFAULT 'Média',

                status VARCHAR(30)
                    NOT NULL
                    DEFAULT 'Pendente',

                due_date DATE,

                created_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_tasks_user
                    FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE
            )
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_tasks_user_id
            ON tasks(user_id)
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_tasks_user_status
            ON tasks(user_id, status)
        """)

        # -------------------------------------------------
        # CATEGORIAS
        # -------------------------------------------------

        conn.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id BIGSERIAL PRIMARY KEY,

                user_id BIGINT NOT NULL,

                name VARCHAR(50) NOT NULL,

                created_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_categories_user
                    FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE
            )
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_categories_user_id
            ON categories(user_id)
        """)

        # Categoria única por usuário, ignorando
        # maiúsculas/minúsculas.
        conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS
            idx_categories_user_name_lower
            ON categories (
                user_id,
                LOWER(name)
            )
        """)

        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


# =========================================================
# CATEGORIAS PADRÃO
# =========================================================

def seed_default_categories(
    conn,
    user_id,
):
    for category in DEFAULT_CATEGORIES:
        conn.execute(
            """
            INSERT INTO categories (
                user_id,
                name
            )
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            """,
            (
                user_id,
                category,
            ),
        )


# =========================================================
# COMPATIBILIDADE COM A VERSÃO ANTIGA
# =========================================================

def claim_legacy_data_for_first_user(
    conn,
    user_id,
):
    """
    Mantida por compatibilidade com o fluxo atual.

    O banco PostgreSQL começa limpo, portanto não existem
    registros antigos sem user_id para reivindicar.

    O SQLite antigo permanece como backup.
    """
    return