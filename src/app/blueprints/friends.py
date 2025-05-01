from flask import Blueprint, request, jsonify
from flask_login import current_user
from app import db
from app.models import User, UserFriend

friends_bp = Blueprint("friends", __name__)


@friends_bp.route("/get", methods=["GET"])
def get_friends():
    if not current_user.is_authenticated:
        return jsonify({"ok": False}), 401
    links = UserFriend.query.filter_by(user_id=current_user.id, is_deleted=False)
    ids = [l.friend_id for l in links]
    users = User.query.filter(User.id.in_(ids)).all()
    return jsonify([{"username": u.username} for u in users])


@friends_bp.route("/search", methods=["GET"])
def search_friends():
    """Search friends by name, excluding the current logged-in user."""
    query = request.args.get("q", "")
    current_f_id = db.session.query(UserFriend.friend_id).filter_by(
        user_id=current_user.id, is_deleted=False
    )
    results = (
        User.query.filter(
            User.username.ilike(f"%{query}%"),
            User.id != current_user.id,
            ~User.id.in_(current_f_id),
        )
        .limit(5)
        .all()
    )

    return jsonify([{"username": u.username} for u in results])


@friends_bp.route("/add", methods=["POST"])
def add_friend():
    """Add a friend to the current user."""
    friend_username = request.json.get("q", "")
    if not friend_username:
        return jsonify({"message": "No friend username provided", "ok": False}), 400

    friend = User.query.filter_by(username=friend_username).first()
    if not friend:
        return jsonify({"message": "Friend not found", "ok": False}), 404

    existing_friendship = UserFriend.query.filter_by(
        user_id=current_user.id, friend_id=friend.id
    ).first()
    if existing_friendship:
        if existing_friendship.is_deleted:
            existing_friendship.is_deleted = not existing_friendship.is_deleted
            db.session.commit()
            return jsonify({"message": "Friend added successfully", "ok": True}), 200
        return jsonify({"message": "Already friends", "ok": False}), 400

    new_friendship = UserFriend(user_id=current_user.id, friend_id=friend.id)
    db.session.add(new_friendship)
    db.session.commit()

    return jsonify({"message": "Friend added successfully", "ok": True}), 200


@friends_bp.route("/remove", methods=["PATCH"])
def remove_friend():
    """Toggle Soft Delete friend to the current user."""
    friend_username = request.json.get("q", "")
    if not friend_username:
        return jsonify({"message": "No friend username provided", "ok": False}), 400
    friend = User.query.filter_by(username=friend_username).first()
    if not friend:
        return jsonify({"message": "Friend not found", "ok": False}), 404
    existing_friendship = UserFriend.query.filter_by(
        user_id=current_user.id, friend_id=friend.id
    ).first()
    if not existing_friendship:
        return jsonify({"message": "You are not friends?", "ok": False}), 404

    existing_friendship.is_deleted = not existing_friendship.is_deleted
    db.session.commit()
    return jsonify({"message": "Friendship updated", "ok": True}), 200
