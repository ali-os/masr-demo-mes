import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_ADMIN = "postgresql://postgres:admin@localhost:5432/postgres"
DB_TARGET = "postgresql://postgres:admin@localhost:5432/masr_mes"

def setup_db():
    try:
        # 1. Create Database
        conn = psycopg2.connect(DB_ADMIN)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname='masr_mes'")
        if not cur.fetchone():
            cur.execute("CREATE DATABASE masr_mes")
            print("Database 'masr_mes' created.")
        conn.close()

        # 2. Create Tables
        conn = psycopg2.connect(DB_TARGET)
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS production_facts (
                id SERIAL PRIMARY KEY,
                sku_code TEXT,
                brand TEXT,
                family TEXT,
                description TEXT,
                line TEXT,
                shift TEXT,
                date DATE,
                count INTEGER,
                rework INTEGER,
                source_tag TEXT DEFAULT 'IMPORTED',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS mps_plan (
                id SERIAL PRIMARY KEY,
                sku_code TEXT UNIQUE,
                brand TEXT,
                family TEXT,
                description TEXT,
                line TEXT,
                mps_qty INTEGER,
                bulk_qty FLOAT
            );
            
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                action TEXT,
                details TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        conn.close()
        print("Tables created successfully.")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    setup_db()
