from app import create_app, db
from app.seeds import create_users_and_plans

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        create_users_and_plans(db.session)
        print("Users & plans created.")
