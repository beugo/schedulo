import os
from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

from .config import Config

db = SQLAlchemy()
login_manager = LoginManager()
load_dotenv()


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)

    login_manager.login_view = "main.login"
    login_manager.login_message_category = "info"

    from .routes import main

    app.register_blueprint(main)

    with app.app_context():
        db.create_all()

    return app
