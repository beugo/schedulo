import csv
import json
import ast
import random
from itertools import combinations

from .models import (
    Unit, User, UnitPlan, UnitPlanToUnit,
    UserFriend, Post
)


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
    Seed users & plans for testing:
      - hugo, joel, prashan: mutual friends, 2 plans each, each plan has 3–4 units
        joel & prashan’s plans are “shared” via Post entries
      - nathan: no friends, no plans
    """
    # 1) create/fetch users
    names = ["hugo", "joel", "prashan", "nathan"]
    users = {}
    for name in names:
        u = db_session.query(User).filter_by(username=name).first()
        if not u:
            u = User(username=name)
            u.set_password("password")
            db_session.add(u)
            db_session.flush()
        users[name] = u

    db_session.commit()

    # 2) mutual‐friends among hugo, joel, prashan (one record per pair)
    trio = ["hugo", "joel", "prashan"]
    # clear out any old friendships in test DB
    db_session.query(UserFriend).delete()
    db_session.flush()

    for a, b in combinations(trio, 2):
        db_session.add(UserFriend(
            user_id=users[a].id,
            friend_id=users[b].id
        ))
        # if your model requires the reverse direction too, uncomment:
        # db_session.add(UserFriend(
        #     user_id=users[b].id,
        #     friend_id=users[a].id
        # ))
    db_session.commit()

    # 3) create 2 plans each, and seed each plan with 3–4 units
    all_units = db_session.query(Unit).all()
    # wipe old plans/links
    db_session.query(UnitPlanToUnit).delete()
    db_session.query(UnitPlan).delete()
    db_session.flush()

    for name in trio:
        user = users[name]
        for idx in (1, 2):
            plan = UnitPlan(
                user_id=user.id,
                name=f"{name.title()}'s Plan {idx}"
            )
            db_session.add(plan)
            db_session.flush()

            # pick 3–4 distinct units at random
            sample_units = random.sample(all_units, min(4, len(all_units)))
            for i, unit in enumerate(sample_units):
                row = (i // 2) + 1    # rows 1,1,2,2
                col = (i % 2) + 1     # cols 1,2,1,2
                db_session.add(UnitPlanToUnit(
                    unit_plan_id=plan.id,
                    unit_id=unit.id,
                    row=row,
                    col=col
                ))

    db_session.commit()

    # 4) “Share” (Post) each of joel’s & prashan’s plans
    db_session.query(Post).delete()
    db_session.flush()

    for name in ("joel", "prashan"):
        user = users[name]
        for plan in db_session.query(UnitPlan).filter_by(user_id=user.id):
            db_session.add(Post(
                user_id=user.id,
                unit_plan_id=plan.id
            ))

    db_session.commit()