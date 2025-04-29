import json
from flask import Blueprint, render_template, jsonify
from flask_login import login_required, current_user
from app.models import User,  Unit, UnitPlan, UserFriend

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def landing():
    return render_template("landing.html")

@main_bp.route('/info')
def info():
    return render_template("info.html")

@main_bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@main_bp.route('/unitplans')
@login_required
def unitplans_page():
    return render_template('unitplans.html')

@main_bp.route('/create')
@login_required
def create_page():
    return render_template('create.html')

@main_bp.route('/friends')
@login_required
def friends_page():
    return render_template('friends.html')