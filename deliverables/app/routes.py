from flask import Blueprint, render_template

main = Blueprint('main', __name__)

@main.route('/')
def home():
    return render_template('index.html')

@main.route('/login')
def login():
    return render_template('login.html')

@main.route('/visualise')
def visualise():
    return render_template('visualise.html')

@main.route('/share')
def share():
    return render_template('share.html')