from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from . import db


class User(UserMixin, db.Model):
    """User model for authentication and account data."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_deleted = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        """Hash and set the user's password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check the hashed password against the given input."""
        return check_password_hash(self.password_hash, password)


class Unit(db.Model):
    """Unit model representing academic unit metadata."""

    __tablename__ = "units"

    id = db.Column(db.Integer, primary_key=True)
    unit_name = db.Column(db.String(64), nullable=False)
    unit_code = db.Column(db.String(256), nullable=True)
    exam = db.Column(db.Boolean, nullable=True)
    url = db.Column(db.String(256), nullable=True)
    unit_coordinator = db.Column(db.String(256), nullable=True)
    contact_hours = db.Column(db.Text, nullable=True)
    prerequisites = db.Column(db.String(256), nullable=True)
    description = db.Column(db.String(256), nullable=True)
    is_deleted = db.Column(db.Boolean, default=False)
