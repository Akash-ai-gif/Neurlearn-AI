import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "app", "data", "assets", "neurolearn_practice.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create Tables
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'student'
    );

    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL,
        category_id INTEGER,
        FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        order_date TEXT,
        status TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        price_at_purchase REAL,
        PRIMARY KEY(order_id, product_id),
        FOREIGN KEY(order_id) REFERENCES orders(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    );

    -- Insert Sample Data
    INSERT OR IGNORE INTO categories (id, name) VALUES (1, 'Electronics'), (2, 'Furniture'), (3, 'Books');
    
    INSERT OR IGNORE INTO users (id, name, email) VALUES 
    (1, 'John Doe', 'john@example.com'),
    (2, 'Jane Smith', 'jane@example.com'),
    (3, 'Bob Wilson', 'bob@example.com');

    INSERT OR IGNORE INTO products (id, name, price, category_id) VALUES 
    (1, 'Laptop', 1200.00, 1),
    (2, 'Smartphone', 800.00, 1),
    (3, 'Desk Chair', 150.00, 2),
    (4, 'Python Crash Course', 30.00, 3);

    INSERT OR IGNORE INTO orders (id, user_id, order_date, status) VALUES 
    (1, 1, '2024-01-10', 'Shipped'),
    (2, 2, '2024-01-12', 'Pending');

    INSERT OR IGNORE INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES 
    (1, 1, 1, 1200.00),
    (1, 3, 1, 150.00),
    (2, 2, 1, 800.00);
    """)

    conn.commit()
    conn.close()
    print(f"Practice database initialized at {DB_PATH}")

if __name__ == "__main__":
    init_db()
