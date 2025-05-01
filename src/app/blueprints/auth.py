from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required
from app import db
from app.models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login")
def login_page():
    return render_template("login.html")


@auth_bp.route("/register")
def register_page():
    return render_template("register.html")


@auth_bp.route("/register-user", methods=["POST"])
def register_user():
    username = request.form["username"]
    password = request.form["password"]
    confirm = request.form["confirm_password"]
    if password != confirm:
        flash("Passwords do not match", "error")
        return redirect(url_for("auth.register_page"))
    if User.query.filter_by(username=username).first():
        flash("Username exists", "error")
        return redirect(url_for("auth.register_page"))
    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    login_user(user)
    return redirect(url_for("main.dashboard"))


@auth_bp.route("/login-user", methods=["POST"])
def login_user_route():
    username = request.form["username"]
    password = request.form["password"]
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user)
        flash("Logged in", "success")
        return redirect(url_for("main.dashboard"))
    flash("Invalid credentials", "error")
    return redirect(url_for("auth.login_page"))


@auth_bp.route("/logout")
@login_required
def logout_route():
    logout_user()
    return redirect(url_for("main.landing"))
