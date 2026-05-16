from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load from backend/.env
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

def check_decision_logs():
    if not DATABASE_URL:
        print("DATABASE_URL not found in environment.")
        return
        
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Checking for 'reasoning' column in 'decision_logs'...")
        try:
            # Check if it exists by trying to select it
            conn.execute(text("SELECT reasoning FROM decision_logs LIMIT 1;"))
            print("'reasoning' column exists in 'decision_logs'.")
        except Exception as e:
            print(f"'reasoning' column might be missing in 'decision_logs': {e}")
            try:
                print("Attempting to add 'reasoning' (JSONB) to 'decision_logs'...")
                conn.execute(text("ALTER TABLE decision_logs ADD COLUMN reasoning JSONB;"))
                conn.commit()
                print("Successfully added 'reasoning' column to 'decision_logs'.")
            except Exception as e2:
                print(f"Failed to add column: {e2}")

if __name__ == "__main__":
    check_decision_logs()
