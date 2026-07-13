import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # JWT Settings
    JWT_SECRET: str = "plate_pulse_secure_jwt_local_secret_2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # SMTP Settings (for appreciation and OTP emails)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@platepulse.org"
    
    # Cloudinary Integration
    CLOUDINARY_CLOUD_NAME: str = "dummy"
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    # ZegoCloud Video KYC Integration
    ZEGO_APP_ID: int = 123456789
    ZEGO_SERVER_SECRET: str = "dummy_zegocloud_secret"

    # Firebase Settings
    FIREBASE_SERVICE_ACCOUNT_JSON: str = ""
    FIREBASE_CREDENTIALS_JSON: str = ""

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
