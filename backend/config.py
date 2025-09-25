from _pytest.stash import T
from dotenv import load_dotenv
from datetime import timedelta
import os

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'

    MONGODB_URI = os.environ.get('MONGODB_URI')
    MONGODB_DB = os.environ.get('MONGODB_DB')

    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    JWT_ALGORITHM = 'HS256'

    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    MAX_AUDIO_SIZE = int(os.environ.get('MAX_AUDIO_SIZE', 16 * 1024 * 1024))  # 16MB for audio files

    CORS_ORIGINS = os.environ.get('CORS_ORIGINS')
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    # @staticmethod
    def init_app(app):
        pass

class DevelopmentConfig(Config):
    DEBUG=True
    TESTING=False

    MONGODB_URI = os.environ.get('MONGODB_URI')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=60)


class ProductionConfig(Config):
    DEBUG=False
    TESTING=False

    def init_app(app):
        Config.init_app(app)

        import logging 
        from logging import StreamHandler
        file_handler = StreamHandler()
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)


class TestingConfig(Config):
    DEBUG=True
    TESTING=True

    
config = {
    'development':DevelopmentConfig,
    'production':ProductionConfig,
    'testing':TestingConfig,
    'default':DevelopmentConfig,
}