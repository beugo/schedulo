from flask import (
    Blueprint,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    jsonify,
)
from flask_login import login_user, logout_user, login_required
from app import db
from app.models import User, Unit
from . import login_manager

main = Blueprint("main", __name__)


### Pages


@main.route("/")
def nav_landingpage():
    """Render the landing page."""
    return render_template("index.html")


@main.route("/dashboard")
@login_required
def nav_dashboard():
    """Render the user dashboard"""
    return render_template("dashboard.html")


@main.route("/login")
def nav_login():
    """Render the login page."""
    return render_template("login.html")


@main.route("/register")
def nav_register():
    """Render the registration page."""
    return render_template("register.html")


@main.route("/unitplans")
@login_required
def nav_unitplans():
    """Render the unit plan page."""
    return render_template("unitplans.html")


@main.route("/create")
@login_required
def nav_create():
    """Render the unit plan creation page."""
    return render_template("create.html")

### API


@main.route("/register-user", methods=["POST"])
def register_user():
    """Handle user registration form submission."""
    username = request.form["username"]
    password = request.form["password"]
    confirm_password = request.form["confirm_password"]

    if password != confirm_password:
        flash("Passwords do not match", "error")
        return redirect(url_for("main.nav_register"))

    existing_user = User.query.filter(User.username == username).first()
    if existing_user:
        flash("Username already exists", "error")
        return redirect(url_for("main.nav_register"))

    new_user = User(username=username)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    login_user(new_user)
    return redirect(url_for("main.nav_dashboard"))


@main.route("/login-user", methods=["POST"])
def login():
    """Handle user login form submission."""
    username = request.form["username"]
    password = request.form["password"]

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user)
        flash("Login successful!", "success")
        return redirect(url_for("main.nav_dashboard"))

    flash("Invalid username or password", "error")
    return redirect(url_for("main.nav_login"))


@main.route("/logout")
def logout():
    """Log the user out and redirect to home."""
    logout_user()
    return redirect(url_for("main.nav_landingpage"))


@login_manager.user_loader
def load_user(user_id):
    """Load user for Flask-Login session management."""
    return User.query.get(int(user_id))


@main.route("/search_units")
def search_units():
    """Search unit data by name or code."""
    query = request.args.get("q", "")
    search_type = request.args.get("type", "")

    if search_type == "code":
        results = Unit.query.filter(Unit.unit_code.ilike(f"%{query}%")).limit(10).all()
    else:
        results = Unit.query.filter(Unit.unit_name.ilike(f"%{query}%")).limit(10).all()

    return jsonify(
        [{"unit_name": u.unit_name, "unit_code": u.unit_code} for u in results]
    )
