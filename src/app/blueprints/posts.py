from flask import Blueprint, request, jsonify
from flask_login import current_user
from app import db
from app.models import Post, User, UserFriend, UnitPlan, UnitPlanToUnit
from sqlalchemy import or_
from app.utils.unit_plan_helper import get_plan_core_info

post_bp = Blueprint("posts", __name__)


@post_bp.route("/refresh", methods=["GET"])
def refresh_posts():
    if not current_user.is_authenticated:
        return jsonify({"message": "User not authenticated", "ok": False}), 401

    friend_ids = (
        db.session.query(UserFriend.user_id)
        .filter(UserFriend.friend_id == current_user.id, UserFriend.is_deleted == False)
        .union(
            db.session.query(UserFriend.friend_id).filter(
                UserFriend.user_id == current_user.id, UserFriend.is_deleted == False
            )
        )
        .subquery()
    )

    posts = (
        db.session.query(Post)
        .filter(Post.user_id.in_(friend_ids), Post.is_deleted == False)
        .order_by(Post.posted_at.desc())
        .limit(10)
    )

    res = []
    for post in posts:
        plan_data = get_plan_core_info(post.unit_plan_id, post.user_id)
        if not plan_data:
            continue

        user = db.session.get(User, post.user_id)
        res.append(
            {
                "id": post.id,
                "unit_plan": plan_data,
                "user_name": user.username,
                "posted_at": post.posted_at.isoformat(),
                "is_deleted": post.is_deleted,
            }
        )

    return jsonify(res), 200


@post_bp.route("/post", methods=["POST"])
def post():
    if not current_user.is_authenticated:
        return jsonify({"message": "User not authenticated", "ok": False}), 401

    unit_plan_id = request.json.get("id", "")
    unit_plan = db.session.query(UnitPlan).filter_by(id=unit_plan_id).first()
    if not unit_plan:
        return jsonify({"message": "Unit plan not found", "ok": False}), 404
    if unit_plan.user_id != current_user.id:
        return jsonify({"message": "Unit plan not yours", "ok": False}), 401

    alreadyPosted = (
        db.session.query(Post)
        .filter_by(unit_plan_id=unit_plan.id, is_deleted=False)
        .first()
    )
    if alreadyPosted:
        return jsonify({"message": "Already posted", "ok": False}), 400

    new_post = Post(user_id=current_user.id, unit_plan_id=unit_plan.id)
    db.session.add(new_post)
    db.session.commit()

    return jsonify({"message": "Post shared!", "ok": True}), 200


@post_bp.route("/remove", methods=["PATCH"])
def delete_post():
    if not current_user.is_authenticated:
        return jsonify({"message": "User not authenticated", "ok": False}), 401

    post_id = request.json.get("id", "")
    post = db.session.query(Post).filter_by(id=post_id, is_deleted=False).first()

    if not post:
        return jsonify({"message": "Post not found", "ok": False}), 404
    if post.user_id != current_user.id:
        return jsonify({"message": "Post not yours", "ok": False}), 401

    post.is_deleted = True
    db.session.commit()

    return jsonify({"message": "Post removed", "ok": True}), 200
