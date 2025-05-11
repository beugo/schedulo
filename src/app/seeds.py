# src/app/seeds.py
import csv, json, ast, random
from .models import Unit, User, UnitPlan, UnitPlanToUnit

def import_units(db_session, csv_path):
    """Load units from CSV into whatever session you pass in."""
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            sems = [s.strip() for s in row["Semesters"].split(",")]

            u = Unit(
                unit_name=row["Unit Name"].strip(),
                unit_code=row["Unit Code"].strip(),
                exam=row["Exam"].strip().lower() == "yes",
                url=row["URL"].strip(),
                unit_coordinator=row["Unit Coordinator"].strip(),
                prerequisites=row["Prerequisites"].strip(),
                semester1       = "Semester 1" in sems,
                semester2       = "Semester 2" in sems,
            )
            db_session.add(u)
    db_session.commit()


def create_users_and_plans(db_session):
    """Create 8 users and random plans/links."""
    users = []
    for i in range(1,9):
        u = User(username=f"user{i}")
        u.set_password("password")
        db_session.add(u)
        users.append(u)
    db_session.commit()

    units = db_session.query(Unit).all()
    for u in users:
        for pidx in range(random.randint(0,2)):
            plan = UnitPlan(user_id=u.id, name=f"{u.username}'s Plan {pidx+1}")
            db_session.add(plan)
            db_session.commit()
            chosen = random.sample(units, random.randint(1, min(4,len(units))))
            used = set()
            for unit in chosen:
                # pick unique row/col
                while True:
                    r, c = random.randint(0,7), random.randint(0,3)
                    if (r,c) not in used:
                        used.add((r,c)); break
                link = UnitPlanToUnit(unit_plan_id=plan.id, unit_id=unit.id, row=r, col=c)
                db_session.add(link)
            db_session.commit()
