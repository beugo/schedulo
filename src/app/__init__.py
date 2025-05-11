import os
from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager

from .config import Config

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "info"

    from app.blueprints.auth import auth_bp
    from app.blueprints.main import main_bp
    from app.blueprints.units import units_bp
    from app.blueprints.plans import plans_bp
    from app.blueprints.friends import friends_bp
    from app.blueprints.posts import post_bp
    from app.blueprints.friendrequests import friend_req_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(main_bp) 
    app.register_blueprint(units_bp, url_prefix="/units")
    app.register_blueprint(plans_bp, url_prefix="/plans")
    app.register_blueprint(friends_bp, url_prefix="/friend")
    app.register_blueprint(post_bp, url_prefix="/share")
    app.register_blueprint(friend_req_bp, url_prefix="/friend_requests")

    return app


@login_manager.user_loader
def load_user(user_id):
    from .models import User
    return User.query.get(int(user_id))
