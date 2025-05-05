import csv
import json
import ast

from app.models import Unit
from app import create_app, db

app = create_app()

def parse_bool(val):
    """Parse 'yes' string as boolean True."""
    return val.strip().lower() == "yes"


def import_units():
    """Load units from CSV and insert into the database."""
    with open("../data-scraping/cits.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            unit = Unit(
                unit_name=row["Unit Name"].strip(),
                unit_code=row["Unit Code"].strip(),
                exam=parse_bool(row["Exam"]),
                url=row["URL"].strip(),
                unit_coordinator=row["Unit Coordinator"].strip(),
                contact_hours=json.dumps(ast.literal_eval(row["Contact Hours"])),
                prerequisites=row["Prerequisites"].strip(),
                description=row["Description"].strip(),
            )
            db.session.add(unit)

        db.session.commit()
        print("Units imported.")


if __name__ == "__main__":
    with app.app_context():
        import_units()
