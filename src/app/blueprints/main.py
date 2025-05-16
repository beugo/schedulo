from flask import Blueprint, render_template, request
from flask_login import login_required, current_user
from app.models import Unit, UnitPlan, UnitPlanToUnit
import json

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def landing():
    return render_template("landing.html")


@main_bp.route("/info")
def info():
    return render_template("info.html")


@main_bp.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")


@main_bp.route("/unitplans")
@login_required
def unitplans_page():
    return render_template("unitplans.html")


@main_bp.route("/create", methods=["GET"])
@login_required
def create_page():
    plan_id = request.args.get("id")
    context = {
        "plan_id": 0,
        "plan_name": "",
        "grid_units": {},
    }
    if plan_id:
        plan = UnitPlan.query.filter_by(
            id=plan_id, user_id=current_user.id, is_deleted=False
        ).first_or_404()
        context["plan_name"] = plan.name

        plan_units = UnitPlanToUnit.query.filter_by(
            unit_plan_id=plan.id, is_deleted=False
        ).all()

        # populate the context with all the units in that unit plan
        grid = {}
        for pu in plan_units:
            unit = Unit.query.get(pu.unit_id)
            if not unit:
                continue
            # stringify the key
            key = f"{pu.row},{pu.col}"
            grid[key] = {"name": unit.unit_name, "code": unit.unit_code}
        context["grid_units"] = grid
        context["plan_id"] = plan_id

    return render_template("create.html", **context)


@main_bp.route("/friends")
@login_required
def friends_page():
    return render_template("friends.html")


@main_bp.route("/visualise")
@login_required
def visualise_page():
    return render_template("visualise.html")


@main_bp.route("/discover")
@login_required
def discover():
    unit_info = {
        "unit_name": "",
        "unit_code": "",
        "exam": "",
        "url": "",
        "unit_coordinator": "",
        "contact_hours": "",
        "prerequisites": "",
        "description": "",
        "semesterOne": "",
        "semesterTwo": "",
    }

    unit_id = request.args.get("id")
    if unit_id:
        unit = Unit.query.filter_by(id=unit_id).first()
        contact_hours_raw = unit.contact_hours
        try:
            contact_hours = json.loads(contact_hours_raw)
        except (TypeError, json.JSONDecodeError):
            contact_hours = []

        if unit:
            unit_info = {
                "unit_name": unit.unit_name,
                "unit_code": unit.unit_code,
                "exam": unit.exam,
                "url": unit.url,
                "unit_coordinator": unit.unit_coordinator,
                "contact_hours": contact_hours,
                "prerequisites": unit.prerequisites,
                "description": unit.description,
                "semesterOne": unit.semester1,
                "semesterTwo": unit.semester2,
            }

    return render_template("discover_unit.html", **unit_info)
