import sqlite3

DATABASE = "taskflow.db"


def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def create_database():
    conn = get_connection()

    # =========================================================
    # TABELA DE TAREFAS
    # =========================================================

    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            priority TEXT DEFAULT 'Média',
            status TEXT DEFAULT 'Pendente',
            due_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # =========================================================
    # TABELA DE CATEGORIAS
    # =========================================================

    conn.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL COLLATE NOCASE UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # =========================================================
    # CATEGORIAS PADRÃO
    # =========================================================

    default_categories = [
        "Trabalho",
        "Estudos",
        "Pessoal",
        "Projetos"
    ]

    for category in default_categories:
        conn.execute("""
            INSERT OR IGNORE INTO categories (name)
            VALUES (?)
        """, (category,))

    # =========================================================
    # IMPORTAR CATEGORIAS JÁ USADAS NAS TAREFAS
    # =========================================================
    # Isso evita perder uma categoria que já exista em alguma
    # tarefa criada antes deste novo sistema de categorias.

    existing_categories = conn.execute("""
        SELECT DISTINCT category
        FROM tasks
        WHERE category IS NOT NULL
          AND TRIM(category) != ''
    """).fetchall()

    for row in existing_categories:
        conn.execute("""
            INSERT OR IGNORE INTO categories (name)
            VALUES (?)
        """, (row["category"].strip(),))

    conn.commit()
    conn.close()