import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/totem"
    )
    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FRONTEND_URLS: str = os.getenv("FRONTEND_URLS", "")

    class Config:
        env_file = ".env"


settings = Settings()
