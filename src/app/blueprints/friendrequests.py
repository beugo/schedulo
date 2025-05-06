from flask import Blueprint, request, jsonify
from flask_login import current_user
from app import db
from app.models import User, UserFriend, FriendRequests

friend_req_bp = Blueprint("friend_requests", __name__)


@friend_req_bp.route("/get", methods=["GET"])
def get_friend_requests():
    if not current_user.is_authenticated:
        return jsonify({"ok": False}), 401

    links = (
        db.session.query(User, FriendRequests.created_at)
        .join(FriendRequests, User.id == FriendRequests.user_id)
        .filter(FriendRequests.friend_id == current_user.id, FriendRequests.is_deleted == False)
        .all()
    )
    return jsonify([ {"username": user.username, "created_at": created_at or "Not Found?"} for user, created_at in links ])

@friend_req_bp.route("/send", methods=["POST"])
def send_friend_request():
    """Add a friend to the current user."""
    friend_username = request.json.get("q", "")
    if not friend_username:
        return jsonify({"message": "No friend username provided", "ok": False}), 400

    friend = User.query.filter_by(username=friend_username).first()
    if not friend:
        return jsonify({"message": "Friend not found", "ok": False}), 404

    existing_friendship = UserFriend.query.filter_by(
        user_id=current_user.id, friend_id=friend.id
    ).union(UserFriend.query.filter_by(
        user_id=friend.id, friend_id=current_user.id
    )).first()
    if existing_friendship:
        return jsonify({"message": "Already previously friends", "ok": False}), 400

    pending_request = FriendRequests.query.filter_by(
        user_id=current_user.id, friend_id=friend.id, is_deleted=False
    ).first()

    if pending_request:
        return jsonify({"message": "Already has pending request.", "ok": False}), 400


    send_request = FriendRequests(user_id=current_user.id, friend_id=friend.id)
    db.session.add(send_request)
    db.session.commit()

    return jsonify({"message": "Sent friend request successfully", "ok": True}), 200

@friend_req_bp.route("/remove", methods=["PATCH"])
def remove_friend_request():
    """Remove friend request"""
    friend_username = request.json.get("q", "")
    if not friend_username:
        return jsonify({}), 400
    friend = User.query.filter_by(username=friend_username).first()
    if not friend:
        return jsonify({"message": "Friend not found", "ok": False}), 404

    friend_req = FriendRequests.query.filter_by(
        friend_id=current_user.id, user_id=friend.id, is_deleted=False
    ).first()
    if friend_req:
        friend_req.is_deleted = True
        db.session.commit()

    return jsonify({"message": "Friendship updated", "ok": True}), 200
