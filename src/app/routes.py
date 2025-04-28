from flask import (
    Blueprint,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    jsonify,
)
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import User, Unit, UnitPlan, UnitPlanToUnit, UserFriend
from . import login_manager

main = Blueprint("main", __name__)


### Pages


@main.route("/")
def nav_landingpage():
    """Render the landing page."""
    return render_template("index.html")


@main.route("/dashboard")
@login_required
def nav_dashboard():
    """Render the user dashboard"""
    return render_template("dashboard.html")


@main.route("/login")
def nav_login():
    """Render the login page."""
    return render_template("login.html")


@main.route("/register")
def nav_register():
    """Render the registration page."""
    return render_template("register.html")


@main.route("/unitplans")
@login_required
def nav_unitplans():
    """Render the unit plan page."""
    return render_template("unitplans.html")


@main.route("/create")
@login_required
def nav_create():
    """Render the unit plan creation page."""
    return render_template("create.html")


@main.route("/friends")
@login_required
def nav_friends():
    """Render the friends page."""
    return render_template("friends.html")


### API


### Login


@main.route("/register-user", methods=["POST"])
def register_user():
    """Handle user registration form submission."""
    username = request.form["username"]
    password = request.form["password"]
    confirm_password = request.form["confirm_password"]

    if password != confirm_password:
        flash("Passwords do not match", "error")
        return redirect(url_for("main.nav_register"))

    existing_user = User.query.filter(User.username == username).first()
    if existing_user:
        flash("Username already exists", "error")
        return redirect(url_for("main.nav_register"))

    new_user = User(username=username)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    login_user(new_user)
    return redirect(url_for("main.nav_dashboard"))


@main.route("/login-user", methods=["POST"])
def login():
    """Handle user login form submission."""
    username = request.form["username"]
    password = request.form["password"]

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user)
        flash("Login successful!", "success")
        return redirect(url_for("main.nav_dashboard"))

    flash("Invalid username or password", "error")
    return redirect(url_for("main.nav_login"))


@main.route("/logout")
def logout():
    """Log the user out and redirect to home."""
    logout_user()
    return redirect(url_for("main.nav_landingpage"))


@login_manager.user_loader
def load_user(user_id):
    """Load user for Flask-Login session management."""
    return User.query.get(int(user_id))


### Units


@main.route("/search_units")
def search_units():
    """Search unit data by name or code."""
    query = request.args.get("q", "")
    search_type = request.args.get("type", "")

    if search_type == "code":
        results = Unit.query.filter(Unit.unit_code.ilike(f"%{query}%")).limit(5).all()
    else:
        results = Unit.query.filter(Unit.unit_name.ilike(f"%{query}%")).limit(5).all()

    return jsonify(
        [{"unit_name": u.unit_name, "unit_code": u.unit_code} for u in results]
    )


@main.route("/all_units")
def all_units():
    """Gets all units to choose from."""
    results = Unit.query.filter(Unit.is_deleted.is_(False)).all()
    return jsonify(
        [{"unit_name": u.unit_name, "unit_code": u.unit_code} for u in results]
    )


### Unit Plans


@main.route("/save_units", methods=["POST"])
def save_units():
    """Saves the selected units to the database."""

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


@main.route("/UserUnitPlans", methods=["GET"])
def get_user_unit_plans():
    """Get all unit plans for the current user."""
    if current_user.id:
        unit_plans = UnitPlan.query.filter_by(user_id=current_user.id).all()
        return jsonify(
            [
                {
                    "id": plan.id,
                    "name": plan.name,
                    "user_id": plan.user_id,
                    "is_deleted": plan.is_deleted,
                }
                for plan in unit_plans
            ]
        )
    return jsonify({"message": "User not logged in", "ok": False}), 401


### Friends


@main.route("/get_friends", methods=["GET"])
def get_user_friends():
    """Get all friends for the current user."""
    if current_user.id:
        user_friend_link = UserFriend.query.filter_by(
            user_id=current_user.id, is_deleted=False
        ).all()
        user_friend_ids = [f.friend_id for f in user_friend_link]

        user_friends = User.query.filter(User.id.in_(user_friend_ids))
        return jsonify(
            [
                {
                    "username": friend.username,
                }
                for friend in user_friends
            ]
        )
    return jsonify({"message": "User not logged in", "ok": False}), 401


@main.route("/search_friends", methods=["GET"])
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


@main.route("/add_friend", methods=["POST"])
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
        else:
            return jsonify({"message": "Already friends", "ok": False}), 400

    new_friendship = UserFriend(user_id=current_user.id, friend_id=friend.id)
    db.session.add(new_friendship)
    db.session.commit()

    return jsonify({"message": "Friend added successfully", "ok": True}), 200


@main.route("/remove_friend", methods=["PATCH"])
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
