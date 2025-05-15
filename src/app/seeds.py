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
                for field, value in data.items():
                    setattr(unit, field, value)
            else:
                unit = Unit(**data)
                db_session.add(unit)

        db_session.commit()

def create_users_and_plans(db_session):
    names = ["alice", "bob", "charlie", "dave", "eve", "frank", "grace", "hugo", "joel", "prashan", "nathan"]
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

    db_session.query(UserFriend).delete()
    db_session.flush()

    names_excluding_alice = names[1:]
    for a, b in combinations(names_excluding_alice, 2):
        db_session.add(UserFriend(
            user_id=users[a].id,
            friend_id=users[b].id
        ))
    db_session.commit()

    all_units = db_session.query(Unit).all()
    db_session.query(UnitPlanToUnit).delete()
    db_session.query(UnitPlan).delete()
    db_session.flush()
    
    prefillTemplates = {
        'cs': [
            { 'unit_code': 'CITS1401', 'row': 1, 'col': 1 },
            { 'unit_code': 'CITS1402', 'row': 1, 'col': 2 },
            { 'unit_code': 'CITS1003', 'row': 2, 'col': 1 },
            { 'unit_code': 'CITS2005', 'row': 3, 'col': 1 },
            { 'unit_code': 'CITS2200', 'row': 3, 'col': 2 },
            { 'unit_code': 'CITS2002', 'row': 4, 'col': 1 },
            { 'unit_code': 'CITS2211', 'row': 4, 'col': 2 },
            { 'unit_code': 'CITS3403', 'row': 5, 'col': 1 },
            { 'unit_code': 'CITS3002', 'row': 5, 'col': 2 },
            { 'unit_code': 'CITS3200', 'row': 6, 'col': 1 },
            { 'unit_code': 'CITS3001', 'row': 6, 'col': 2 }
        ],
        'cyber': [
            { 'unit_code': 'CITS1401', 'row': 1, 'col': 1 },
            { 'unit_code': 'PHIL1001', 'row': 1, 'col': 2 },
            { 'unit_code': 'CITS1003', 'row': 2, 'col': 1 },
            { 'unit_code': 'CITS2006', 'row': 3, 'col': 1 },
            { 'unit_code': 'CITS2002', 'row': 4, 'col': 1 },
            { 'unit_code': 'CITS3002', 'row': 5, 'col': 1 },
            { 'unit_code': 'CITS3403', 'row': 5, 'col': 2 },
            { 'unit_code': 'CITS3007', 'row': 5, 'col': 3 },
            { 'unit_code': 'CITS3200', 'row': 6, 'col': 1 },
            { 'unit_code': 'CITS3006', 'row': 6, 'col': 2 }
        ],
        'data_science': [
            { 'unit_code': 'CITS1401', 'row': 1, 'col': 1 },
            { 'unit_code': 'PHIL1001', 'row': 1, 'col': 2 },
            { 'unit_code': 'CITS1402', 'row': 2, 'col': 1 },
            { 'unit_code': 'STAT1400', 'row': 2, 'col': 2 },
            { 'unit_code': 'STAT2401', 'row': 3, 'col': 1 },
            { 'unit_code': 'STAT2402', 'row': 4, 'col': 1 },
            { 'unit_code': 'CITS2402', 'row': 4, 'col': 2 },
            { 'unit_code': 'CITS3403', 'row': 5, 'col': 1 },
            { 'unit_code': 'CITS3401', 'row': 5, 'col': 2 },
            { 'unit_code': 'CITS3200', 'row': 6, 'col': 1 },
            { 'unit_code': 'STAT3064', 'row': 6, 'col': 2 },
            { 'unit_code': 'STAT3405', 'row': 6, 'col': 3 }
        ]
    }

    remaining_spots = {
        'cs': [2, 3, 2, 2, 2, 2],
        'cyber': [2, 3, 3, 3, 1, 2],
        'data_science': [2, 2, 3, 2, 2, 1]
    }

    remaining_spots = {
        'cs': [
            (1, 3), (1, 4), 
            (2, 2), (2, 3), (2, 4),
            (3, 3), (3, 4),
            (4, 3), (4, 4),
            (5, 3), (5, 4),
            (6, 3), (6, 4),
        ],
        'cyber': [
            (1, 3), (1, 4),
            (2, 2), (2, 3), (2, 4),
            (3, 2), (3, 3), (3, 4),
            (4, 2), (4, 3), (4, 4),
            (5, 1),
            (6, 3), (6, 4),
        ],
        'data_science': [
            (1, 3), (1, 4),
            (2, 3), (2, 4),
            (3, 2), (3, 3), (3, 4),
            (4, 3), (4, 4),
            (5, 3), (5, 4),
            (6, 4),
        ]
    }


    for name in names:
        user = users[name]

        chosen_template_key = random.choice(['cs', 'cyber', 'data_science'])
        chosen_template = prefillTemplates[chosen_template_key]

        for idx in (1, 2):
            plan = UnitPlan(
                user_id=user.id,
                name=f"{name.title()}'s Plan {idx}"
            )
            db_session.add(plan)
            db_session.flush()

            for unit in chosen_template:
                db_session.add(UnitPlanToUnit(
                    unit_plan_id=plan.id,
                    unit_id=db_session.query(Unit).filter_by(unit_code=unit['unit_code']).first().id,
                    row=unit['row'],
                    col=unit['col']
                ))

            total_remaining_spots = len(remaining_spots[chosen_template_key])
            
            electives = [unit for unit in all_units if not any(x in unit.unit_code for x in ["CITS", "PHIL", "STAT"])]
            sample_electives = random.sample(electives, total_remaining_spots)  
            
            for r, c in remaining_spots[chosen_template_key]:
                db_session.add(UnitPlanToUnit(
                    unit_plan_id=plan.id,
                    unit_id=sample_electives.pop().id,
                    row=r,
                    col=c
                ))

    db_session.commit()

    db_session.query(Post).delete()
    db_session.flush()
    for name in names:
        user = users[name]
        for plan in db_session.query(UnitPlan).filter_by(user_id=user.id):
            db_session.add(Post(
                user_id=user.id,
                unit_plan_id=plan.id
            ))

    db_session.commit()

