from app import create_app, db
from app.models import Unit
import json
import csv

app = create_app()
app.app_context().push()


def parse_bool(val):
    return val.strip().lower() == "yes"


with open("data-scraping/cits.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        unit = Unit(
            unit_name=row["Unit Name"].strip(),
            unit_code=row["Unit Code"].strip(),
            exam=parse_bool(row["Exam"]),
            url=row["URL"].strip(),
            unit_coordinator=row["Unit Coordinator"].strip(),
            contact_hours=json.dumps(eval(row["Contact Hours"])),
            prerequisites=row["Prerequisites"].strip(),
            description=row["Description"].strip(),
        )
        db.session.add(unit)

    db.session.commit()
    print("Units imported.")
