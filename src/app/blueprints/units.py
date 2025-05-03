from flask import Blueprint, request, jsonify
from app.models import Unit
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
        [{"unit_name": u.unit_name, "unit_code": u.unit_code} for u in units]
    )
