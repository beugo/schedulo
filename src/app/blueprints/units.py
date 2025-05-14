from flask import Blueprint, request, jsonify
from app.models import Unit, UserFriend, UnitPlanToUnit, UnitPlan
from app import db
from flask_login import current_user

units_bp = Blueprint("units", __name__)


@units_bp.route("/search", methods=["GET"])
def search_units():
    q = request.args.get("q", "")
    field = request.args.get("type", "name")
    query = Unit.unit_code if field == "code" else Unit.unit_name
    results = Unit.query.filter(query.ilike(f"%{q}%")).limit(5).all()
    return jsonify(
        [{"unit_name": u.unit_name, "unit_code": u.unit_code} for u in results]
    )


@units_bp.route("/all", methods=["GET"])
def all_units():
    units = Unit.query.filter_by(is_deleted=False).all()
    return jsonify(
        [{
            "id": u.id,
            "unit_name": u.unit_name,
            "unit_code": u.unit_code,
            "unit_coordinator": u.unit_coordinator,
            "contact_hours": u.contact_hours,
            "prerequisites": u.prerequisites,
            "description": u.description,
        } for u in units]
    )


@units_bp.route("/recommended", methods=["GET"])
def recommended_units():
    if not current_user.is_authenticated:
        return jsonify({"ok": False}), 401
    # get IDs of friends
    friend_ids = db.session.query(UserFriend.user_id).filter(
        UserFriend.friend_id == current_user.id,
        UserFriend.is_deleted == False
    ).union(
        db.session.query(UserFriend.friend_id).filter(
            UserFriend.user_id == current_user.id,
            UserFriend.is_deleted == False
        )
    ).subquery()

    # count usage of units in friends' plans
    unit_counts = (
        db.session.query(Unit.id, db.func.count(Unit.id).label("count"))
        .join(UnitPlanToUnit, Unit.id == UnitPlanToUnit.unit_id)
        .join(UnitPlan, UnitPlan.id == UnitPlanToUnit.unit_plan_id)
        .filter(
            UnitPlan.user_id.in_(friend_ids),
            Unit.is_deleted == False,
            UnitPlanToUnit.is_deleted == False
        )
        .group_by(Unit.id)
        .subquery()
    )

    # query units
    units = (
        db.session.query(Unit, db.func.coalesce(
            unit_counts.c.count, 0).label("friend_use_count"))
        .outerjoin(unit_counts, Unit.id == unit_counts.c.id)
        .filter(Unit.is_deleted == False)
        .order_by(db.desc("friend_use_count"))
        .all()
    )

    # JSON response
    recommended = []
    for unit, count in units:
        recommended.append({
            "id": unit.id,
            "unit_name": unit.unit_name,
            "unit_code": unit.unit_code,
            "value": count,
            "exam": unit.exam,
            "semester1": unit.semester1,
            "semester2": unit.semester2,
            "prerequisites": unit.prerequisites or ""
        })

    return jsonify(recommended)

