from app import create_app, db
from app.seeds import import_units

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        import_units(db.session, "../data-scraping/cits.csv")
        import_units(db.session, "../data-scraping/non_cits_core_units.csv")
        import_units(db.session, "../data-scraping/electives.csv")
        print("Units imported.")