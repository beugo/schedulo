from flask import Blueprint, request, jsonify, render_template
from flask_login import current_user
from app import db
from app.models import Unit, UnitPlan, UnitPlanToUnit, UserFriend, Post
from app.utils.unit_plan_helper import get_plan_core_info
from sqlalchemy import or_

plans_bp = Blueprint("plans", __name__)


@plans_bp.route("/get", methods=["GET"])
def get_plan():
    if not current_user.is_authenticated:
        return jsonify({"ok": False, "message": "Not logged in"}), 401

    plan_id = request.args.get("id", "")
    plan_data = get_plan_core_info(plan_id, current_user.id)

    if not plan_data:
        return jsonify({"ok": False, "message": "Plan not found"}), 404

    return jsonify({"ok": True, "plan": plan_data})


@plans_bp.route("/delete", methods=["POST"])
def delete_plan():
    if not current_user.is_authenticated:
        return jsonify({"ok": False, "message": "Not logged in"}), 401
    # does not seem safe ?
    plan_id = request.args.get("id", type=int)
    if not plan_id:
        return jsonify({"ok": False, "message": "No plan ID provided"}), 400

    plan_to_delete = UnitPlan.query.filter_by(
        user_id=current_user.id, is_deleted=False, id=plan_id).first()

    if not plan_to_delete:
        return jsonify(
            {"ok": False, "message": "Plan not found or already deleted"}), 404

    plan_to_delete.is_deleted = True
    db.session.commit()

    return jsonify(
        {"ok": True, "message": 'Plan ' + str(plan_id) + ' Deleted'})


@plans_bp.route("/save", methods=["POST"])
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
        return jsonify(
            {"message": "Some units do not exist?", "ok": False}), 400

    # Check if the plan name already exists for the user
    existing_plan = UnitPlan.query.filter_by(
        user_id=current_user.id, name=plan_name
    ).first()

    if existing_plan:
        return jsonify(
            {"message": "Plan name already exists", "ok": False}), 400

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
            unit_plan_id=new_plan.id,
            unit_id=unit_dict[unit_code],
            row=row,
            col=col
        )
        db.session.add(unit_plan_to_unit)

    db.session.commit()

    # Should be safe hopefully
    return jsonify({"message": "Units saved successfully", "ok": True}), 200


@plans_bp.route("/user", methods=["GET"])
def get_plans():
    if not current_user.is_authenticated:
        return jsonify({"ok": False, "message": "Not logged in"}), 401
    plans = UnitPlan.query.filter_by(
        user_id=current_user.id, is_deleted=False).all()

    result = []
    for p in plans:
        shared = db.session.query(Post).filter_by(
            unit_plan_id=p.id, is_deleted=False).first() is not None
        result.append({"id": p.id, "name": p.name, "shared": shared})
    return jsonify(result)


@plans_bp.route("/view", methods=["GET"])
def view_plan():
    plan_id = request.args.get("id")
    if not plan_id:
        return jsonify({"ok": False, "message": "No plan ID provided"}), 400

    friend_ids = db.session.query(UserFriend.user_id).filter(
        UserFriend.friend_id == current_user.id, UserFriend.is_deleted == False
    ).union(
        db.session.query(UserFriend.friend_id).filter(
            UserFriend.user_id == current_user.id, UserFriend.is_deleted == False)
    ).subquery()

    shared_unit_ids = db.session.query(Post.unit_plan_id).filter(
        Post.user_id.in_(friend_ids),
        Post.is_deleted == False
    )

    plan = UnitPlan.query.filter(
        UnitPlan.id == plan_id,
        UnitPlan.is_deleted == False,
        or_(
            UnitPlan.user_id == current_user.id,
            UnitPlan.id.in_(shared_unit_ids)
        )
    ).first()
    if not plan:
        return jsonify({"ok": False, "message": "Plan not found"}), 404

    # pind all the units in the unit plan
    plan_units = UnitPlanToUnit.query.filter_by(
        unit_plan_id=plan.id,
        is_deleted=False
    ).all()

    # make just a regular list for the side bar
    sidebar_units = []
    for pu in plan_units:
        unit = Unit.query.get(pu.unit_id)
        if unit:
            sidebar_units.append({
                "name": unit.unit_name,
                "code": unit.unit_code
            })

    # make a ordered dict for the actual plan.
    year_cols = {
        1: {1: [], 2: [], 3: [], 4: []},
        2: {1: [], 2: [], 3: [], 4: []},
        3: {1: [], 2: [], 3: [], 4: []},
        4: {1: [], 2: [], 3: [], 4: []}
    }

    # seperate the semesters into years(might not need later on)
    def get_year(row):
        if row in (1, 2):
            return 1
        if row in (3, 4):
            return 2
        if row in (5, 6):
            return 3
        if row in (7, 8):
            return 4
        return None

    # populate the dict
    # there has to be a better way of doing this?
    for pu in plan_units:
        unit = Unit.query.get(pu.unit_id)
        if not unit:
            continue
        unit_info = {"name": unit.unit_name, "code": unit.unit_code}
        year = get_year(pu.row)
        col = pu.col

        year_cols[year][col].append(unit_info)

    return render_template(
        "viewonlyplan.html",
        plan_name=plan.name,
        plan_units_list=sidebar_units,
        year1_units=year_cols[1],
        year2_units=year_cols[2],
        year3_units=year_cols[3],
        year4_units=year_cols[4],
    )
