from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_wtf import CSRFProtect

from .config import DeploymentConfig

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
csrf = CSRFProtect()
login_manager = LoginManager()

from app.blueprints import (
    auth_bp,
    main_bp,
    units_bp,
    plans_bp,
    friends_bp,
    post_bp,
    friend_req_bp,
    chart_bp,
)

def create_app(config_class=DeploymentConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # extensions
    db.init_app(app)
    csrf.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    login_manager.login_view = "auth.login_page"
    login_manager.login_message_category = "info"

    blueprints = [
        (auth_bp,         "/auth"),
        (main_bp,         None),
        (units_bp,        "/units"),
        (plans_bp,        "/plans"),
        (friends_bp,      "/friend"),
        (post_bp,         "/share"),
        (friend_req_bp,   "/friend_requests"),
        (chart_bp,        "/chart"),
    ]

    for bp, prefix in blueprints:
        kwargs = {"url_prefix": prefix} if prefix else {}
        app.register_blueprint(bp, **kwargs)

    return app


@login_manager.user_loader
def load_user(user_id):
    from .models import User

    return User.query.get(int(user_id))
