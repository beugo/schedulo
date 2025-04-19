from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from flask_login import login_user, current_user, logout_user, login_required
from app import db
from app.models import User, Unit
from . import login_manager


main = Blueprint('main', __name__)

### Pages

@main.route('/')
def nav_landingpage():
    return render_template('index.html')

@main.route('/home')
@login_required
def nav_home():
    return render_template('home.html')

@main.route('/login')
def nav_login():
    return render_template('login.html')

@main.route('/register')
def nav_register():
    return render_template('register.html')

@main.route('/visualise')
@login_required
def nav_visualise():
    return render_template('visualise.html')

@main.route('/share')
@login_required
def nav_share():
    return render_template('share.html')

### API


## Login

@main.route('/register-user', methods=['POST'])
def register_user():
    username = request.form['username']
    password = request.form['password']
    confirm_password = request.form['confirm_password']

    if password != confirm_password:
        flash('Passwords do not match', 'error')
        return redirect(url_for('main.nav_register'))

    existing_user = User.query.filter(User.username == username).first()
    if existing_user:
        flash('Username already exists', 'error')
        return redirect(url_for('main.nav_register'))

    new_user = User(username=username)
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()

    login_user(new_user)
    return redirect(url_for('main.nav_homepage'))


@main.route('/login-user', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user)
        flash('Login successful!', 'success')
        return redirect(url_for('main.nav_homepage'))  
    else:
        flash('Invalid username or password', 'error')
        return redirect(url_for('main.nav_login'))  

@main.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('main.nav_landingpage'))

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@main.route('/search_units')
def search_units():
    query = request.args.get('q', '')
    search_type = request.args.get('type', '')
    if search_type == 'code':
        results = Unit.query.filter(Unit.unit_code.ilike(f'%{query}%')).limit(10).all()
    else:
        results = Unit.query.filter(Unit.unit_name.ilike(f'%{query}%')).limit(10).all()
    return jsonify([{'unit_name': u.unit_name, 'unit_code': u.unit_code} for u in results])