from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load from backend/.env
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    if not DATABASE_URL:
        print("DATABASE_URL not found in environment.")
        return
        
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print(f"Connected to {DATABASE_URL.split('@')[-1]}")
        print("Checking for 'reasoning' column in 'optimized_prompts'...")
        try:
            conn.execute(text("ALTER TABLE optimized_prompts ADD COLUMN reasoning TEXT;"))
            conn.commit()
            print("Successfully added 'reasoning' column to 'optimized_prompts'.")
        except Exception as e:
            if "already exists" in str(e):
                print("Column 'reasoning' already exists in 'optimized_prompts'.")
            else:
                print(f"Error adding column: {e}")
                
if __name__ == "__main__":
    migrate()
