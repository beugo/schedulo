import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') 
    
    db.init_app(app)
    login_manager.init_app(app)
    
    login_manager.login_view = 'main.login'  
    login_manager.login_message_category = 'info'  

    from .routes import main
    app.register_blueprint(main)

    with app.app_context():
        db.create_all()

    return app