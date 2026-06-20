from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PORT: int = 3000
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_EXPIRES_IN: str = "1 weeks"
    ADMIN_PASSWORD: str
    TEACHER_URL: str

    # Bump to instantly revoke all existing admin tokens.
    ADMIN_TOKEN_VERSION: int = 1


settings = Settings()
