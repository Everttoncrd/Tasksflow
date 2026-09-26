import os
import sqlite3

DATABASE = os.getenv("DATABASE_PATH", "taskflow.db")

DEFAULT_CATEGORIES = [
    "Trabalho",
    "Estudos",
    "Pessoal",
    "Projetos"
]


def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def column_exists(conn, table, column):
    columns = conn.execute(
        f"PRAGMA table_info({table})"
    ).fetchall()

    return any(
        row["name"] == column
        for row in columns
    )


def create_users_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            email TEXT NOT NULL
                COLLATE NOCASE
                UNIQUE,

            password_hash TEXT NOT NULL,

            failed_login_attempts INTEGER
                NOT NULL
                DEFAULT 0,

            locked_until TEXT,

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP
        )
    """)


def migrate_tasks(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER,

            title TEXT NOT NULL,

            description TEXT,

            category TEXT,

            priority TEXT DEFAULT 'Média',

            status TEXT DEFAULT 'Pendente',

            due_date TEXT,

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        )
    """)

    if not column_exists(
        conn,
        "tasks",
        "user_id"
    ):
        conn.execute("""
            ALTER TABLE tasks
            ADD COLUMN user_id INTEGER
            REFERENCES users(id)
            ON DELETE CASCADE
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


def migrate_categories(conn):
    table_exists = conn.execute("""
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'categories'
    """).fetchone()

    if not table_exists:

        conn.execute("""
            CREATE TABLE categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                user_id INTEGER,

                name TEXT NOT NULL
                    COLLATE NOCASE,

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE,

                UNIQUE(user_id, name)
            )
        """)

    elif not column_exists(
        conn,
        "categories",
        "user_id"
    ):

        # -----------------------------------------
        # Salva a tabela antiga temporariamente
        # -----------------------------------------

        conn.execute("""
            ALTER TABLE categories
            RENAME TO categories_legacy
        """)

        # -----------------------------------------
        # Cria a nova tabela multiusuário
        # -----------------------------------------

        conn.execute("""
            CREATE TABLE categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                user_id INTEGER,

                name TEXT NOT NULL
                    COLLATE NOCASE,

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE,

                UNIQUE(user_id, name)
            )
        """)

        # -----------------------------------------
        # Copia as categorias existentes
        # -----------------------------------------

        conn.execute("""
            INSERT INTO categories (
                id,
                user_id,
                name,
                created_at
            )

            SELECT
                id,
                NULL,
                name,
                created_at

            FROM categories_legacy
        """)

        conn.execute("""
            DROP TABLE categories_legacy
        """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS
        idx_categories_user_id
        ON categories(user_id)
    """)


def create_database():
    conn = get_connection()

    try:

        create_users_table(conn)

        migrate_tasks(conn)

        migrate_categories(conn)

        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


def seed_default_categories(
    conn,
    user_id
):
    for category in DEFAULT_CATEGORIES:

        conn.execute("""
            INSERT OR IGNORE
            INTO categories (
                user_id,
                name
            )
            VALUES (?, ?)
        """, (
            user_id,
            category
        ))


def claim_legacy_data_for_first_user(
    conn,
    user_id
):
    """
    O primeiro usuário criado recebe os dados
    da versão antiga do TaskFlow.

    Isso serve para preservar as tarefas e
    categorias que já existiam antes da
    implementação do sistema de usuários.
    """

    user_count = conn.execute("""
        SELECT COUNT(*)
        FROM users
    """).fetchone()[0]

    if user_count != 1:
        return

    conn.execute("""
        UPDATE tasks
        SET user_id = ?
        WHERE user_id IS NULL
    """, (
        user_id,
    ))

    conn.execute("""
        UPDATE categories
        SET user_id = ?
        WHERE user_id IS NULL
    """, (
        user_id,
    ))

    seed_default_categories(
        conn,
        user_id
    )