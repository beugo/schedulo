import random
from app import create_app, db
from app.models import User, UnitPlan, UnitPlanToUnit, Unit

app = create_app()

def create_users_and_plans():
    # Create 8 users
    users = []
    for i in range(1, 9):
        user = User(username=f"user{i}")
        user.set_password("password")
        db.session.add(user)
        users.append(user)

    db.session.commit()
    print("Users created.")

    # Fetch all units to choose from
    units = Unit.query.all()
    if not units:
        print("No units found. Make sure you've run the unit seeder first.")
        return

    for user in users:
        num_plans = random.randint(0, 2)
        for p in range(num_plans):
            plan = UnitPlan(user_id=user.id, name=f"{user.username}'s Plan {p+1}")
            db.session.add(plan)
            db.session.commit()

            num_units = random.randint(1, min(4, len(units)))
            selected_units = random.sample(units, num_units)

            used_positions = set()
            for unit in selected_units:
                while True:
                    row, col = random.randint(0, 7), random.randint(0, 3)
                    if (row, col) not in used_positions:
                        used_positions.add((row, col))
                        break
                link = UnitPlanToUnit(
                    unit_plan_id=plan.id,
                    unit_id=unit.id,
                    row=row,
                    col=col
                )
                db.session.add(link)

            db.session.commit()
    print("Unit plans assigned.")

if __name__ == "__main__":
    with app.app_context():
        create_users_and_plans()
