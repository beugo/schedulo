from flask import Blueprint, request, jsonify
from flask_login import current_user
from app import db
from app.models import Unit, UnitPlan, UnitPlanToUnit

plans_bp = Blueprint('plans', __name__)

@plans_bp.route('/save', methods=['POST'])
def save_plan():
    plan_name = request.json.get("plan_name", "")
    units = request.json.get("units", [])
    unit_codes = [unit["unit_code"] for unit in units]

    if not units:
        return jsonify({"message": "No units selected", "ok": False}), 400
    if current_user.id is None:
        return jsonify({"message": "User not logged in", "ok": False}), 401
    if not plan_name:
        return jsonify({"message": "No plan name provided", "ok": False}), 400

    seen_positions = set()

    # Gets all unit objects and if they don't all exist then return error
    # I think this is safe and better than before
    # Then into a dict for easy access
    unit_objs = Unit.query.filter(Unit.unit_code.in_(unit_codes)).all()
    unit_dict = {unit.unit_code: unit.id for unit in unit_objs}
    if len(unit_objs) != len(units):
        return jsonify({"message": "Some units do not exist?", "ok": False}), 400

    # Check if the plan name already exists for the user
    existing_plan = UnitPlan.query.filter_by(
        user_id=current_user.id, name=plan_name
    ).first()

    if existing_plan:
        return jsonify({"message": "Plan name already exists", "ok": False}), 400

    #  Add Plan to the database to get plan id
    user_id = current_user.id
    new_plan = UnitPlan(user_id=user_id, name=plan_name)
    db.session.add(new_plan)
    db.session.commit()

    # Add Unit Links to the database
    for unit in units:
        unit_code = unit["unit_code"]
        row = unit["row"]
        col = unit["column"]
        pos = (row, col)
        if pos in seen_positions:
            raise ValueError("Duplicate position detected")
        seen_positions.add(pos)

        unit_plan_to_unit = UnitPlanToUnit(
            unit_plan_id=new_plan.id, unit_id=unit_dict[unit_code], row=row, col=col
        )
        db.session.add(unit_plan_to_unit)

    db.session.commit()

    # Should be safe hopefully
    return jsonify({"message": "Units saved successfully", "ok": True}), 200

@plans_bp.route('/user', methods=['GET'])
def get_plans():
    if not current_user.is_authenticated:
        return jsonify({'ok':False,'message':'Not logged in'}),401
    plans = UnitPlan.query.filter_by(user_id=current_user.id, is_deleted=False).all()
    return jsonify([{ 'id':p.id,'name':p.name } for p in plans])