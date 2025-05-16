from flask import Blueprint, jsonify
from flask_login import current_user
from app import db
from app.models import Unit, UnitPlan, UnitPlanToUnit, UserFriend, Post

chart_bp = Blueprint("chart", __name__)


@chart_bp.route("/unit_data")
def unit_data():
    if not current_user.is_authenticated:
        return jsonify({"ok": False}), 401

    friend_ids = (
        db.session.query(UserFriend.user_id)
        .filter(
            UserFriend.friend_id == current_user.id, UserFriend.is_deleted.is_(False)
        )
        .union(
            db.session.query(UserFriend.friend_id).filter(
                UserFriend.user_id == current_user.id, UserFriend.is_deleted.is_(False)
            )
        )
        .subquery()
    )

    # count usage of units in friends' plans
    friend_unit_counts = (
        db.session.query(Unit.id, db.func.count(Unit.id).label("count"))
        .join(UnitPlanToUnit, Unit.id == UnitPlanToUnit.unit_id)
        .join(UnitPlan, UnitPlan.id == UnitPlanToUnit.unit_plan_id)
        .filter(
            UnitPlan.user_id.in_(friend_ids),
            Unit.is_deleted.is_(False),
            UnitPlanToUnit.is_deleted.is_(False),
        )
        .group_by(Unit.id)
        .subquery()
    )

    total_unit_counts = (
        db.session.query(Unit.id, db.func.count(Unit.id).label("count"))
        .join(UnitPlanToUnit, Unit.id == UnitPlanToUnit.unit_id)
        .join(UnitPlan, UnitPlan.id == UnitPlanToUnit.unit_plan_id)
        .filter(Unit.is_deleted.is_(False), UnitPlanToUnit.is_deleted.is_(False))
        .group_by(Unit.id)
        .subquery()
    )

    # query units
    units = (
        db.session.query(
            Unit,
            db.func.coalesce(friend_unit_counts.c.count, 0).label("friend_use_count"),
            db.func.coalesce(total_unit_counts.c.count, 0).label("total_use_count"),
        )
        .outerjoin(friend_unit_counts, Unit.id == friend_unit_counts.c.id)
        .outerjoin(total_unit_counts, Unit.id == total_unit_counts.c.id)
        .filter(Unit.is_deleted.is_(False))
        .order_by(db.desc("friend_use_count"))
        .all()
    )

    data = {
        "labels": [],
        "friend_count": [],
        "total_count": [],
    }
    for unit, friend_count, total_count in units:
        data["labels"].append(unit.unit_code)
        data["friend_count"].append(friend_count)
        data["total_count"].append(total_count)

    return jsonify(data)
