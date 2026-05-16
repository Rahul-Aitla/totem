from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))
DATABASE_URL = os.getenv("DATABASE_URL")

def inspect_table():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'optimized_prompts';
        """))
        print("Columns in 'optimized_prompts':")
        for row in result:
            print(f"- {row[0]} ({row[1]})")

if __name__ == "__main__":
    inspect_table()
