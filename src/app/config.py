import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "skibidi-toilet")
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DeploymentConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///site.db"


class TestConfig(Config):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"

