import csv
import json
import ast
import random

from .models import Unit, User, UnitPlan, UnitPlanToUnit


def import_units(db_session, csv_path):
    """
    Load or update units from a CSV into the given session.
    Skips entries without a unit code and updates existing records if present.
    """
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Required field
            unit_code = row.get("Unit Code", "").strip()
            if not unit_code:
                continue

            # Attempt to find existing unit
            unit = db_session.query(Unit).filter_by(unit_code=unit_code).first()

            # Parse semesters
            sems_raw = row.get("Semesters", "")
            sems = [s.strip() for s in sems_raw.split(",") if s.strip()]

            # Parse exam flag
            exam = row.get("Exam", "").strip().lower() == "yes"

            # Optional fields
            url = row.get("URL", "").strip() or None
            unit_coordinator = row.get("Unit Coordinator", "").strip() or None
            prerequisites = row.get("Prerequisites", "").strip() or None
            description = row.get("Description", "").strip() or None

            ch_raw = row.get("Contact Hours", "").strip()
            try:
                ch_list = ast.literal_eval(ch_raw)
                contact_hours = json.dumps(ch_list)
            except (ValueError, SyntaxError):
                try:
                    contact_hours = json.dumps(json.loads(ch_raw))
                except (ValueError, json.JSONDecodeError):
                    contact_hours = ch_raw

            data = {
                "unit_name": row.get("Unit Name", "").strip(),
                "unit_code": unit_code,
                "exam": exam,
                "url": url,
                "unit_coordinator": unit_coordinator,
                "prerequisites": prerequisites,
                "description": description,
                "contact_hours": contact_hours,
                "semester1": "Semester 1" in sems,
                "semester2": "Semester 2" in sems,
            }

            if unit:
                # Update existing record
                for field, value in data.items():
                    setattr(unit, field, value)
            else:
                # Create new unit
                unit = Unit(**data)
                db_session.add(unit)

        db_session.commit()


def create_users_and_plans(db_session):
    """
    Create 8 default users (user1..user8) and 0-2 random unit plans per user.
    Existing users or plans are skipped to avoid duplicates.
    """
    # Seed users
    users = []
    for i in range(1, 9):
        username = f"user{i}"
        user = db_session.query(User).filter_by(username=username).first()
        if not user:
            user = User(username=username)
            user.set_password("password")
            db_session.add(user)
            db_session.flush() 
        users.append(user)
    db_session.commit()

    # Fetch all units for plan linking
    units = db_session.query(Unit).all()

    # Seed unit plans and links
    for user in users:
        # If user already has plans, skip
        existing = db_session.query(UnitPlan).filter_by(user_id=user.id).first()
        if existing:
            continue

        num_plans = random.randint(0, 2)
        for idx in range(1, num_plans + 1):
            plan = UnitPlan(user_id=user.id, name=f"{user.username}'s Plan {idx}")
            db_session.add(plan)
            db_session.flush() 

            # Pick 1-4 random units
            chosen_units = random.sample(units, k=random.randint(1, min(4, len(units))))
            used_positions = set()
            for unit in chosen_units:
                # Ensure unique grid position
                while True:
                    row = random.randint(0, 7)
                    col = random.randint(0, 3)
                    if (row, col) not in used_positions:
                        used_positions.add((row, col))
                        break
                link = UnitPlanToUnit(
                    unit_plan_id=plan.id,
                    unit_id=unit.id,
                    row=row,
                    col=col
                )
                db_session.add(link)
    db_session.commit()
