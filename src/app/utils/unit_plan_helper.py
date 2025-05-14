# app/utils/unit_plan_helper.py
from app.models import UnitPlan, UnitPlanToUnit, Unit
from app import db

def get_plan_core_info(plan_id, user_id):
    plan = db.session.query(UnitPlan).filter_by(id=plan_id, user_id=user_id, is_deleted=False).first()
    if not plan:
        return None

    upToUnit = db.session.query(UnitPlanToUnit).filter_by(unit_plan_id=plan.id, is_deleted=False).all()
    units = []
    for u in upToUnit:
        unit = db.session.query(Unit).filter_by(id=u.unit_id, is_deleted=False).first()
        if unit:
            units.append({
                "unitname": unit.unit_name,
                "unitcode": unit.unit_code,
                "row": u.row,
                "col": u.col,
                "semester1": unit.semester1,
                "semester2": unit.semester2,
                "exam": unit.exam
            })

    return {
        "unitplanid": plan.id,
        "name": plan.name,
        "units": units
    }
