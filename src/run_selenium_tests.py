import os
import sys
import time
import threading
import unittest

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.config import TestConfig
from app.seeds import import_units, create_users_and_plans

LOCALHOST = "http://localhost:5000/"
CSV_PATH   = "../data-scraping/cits.csv"

if __name__ == "__main__":
    # ——— 1) Flask app + DB + seed data ———
    app = create_app(TestConfig)
    app.testing = True

    ctx = app.app_context()
    ctx.push()

    db.create_all()
    import_units(db.session, CSV_PATH)
    create_users_and_plans(db.session)

    # ——— 2) run the server once ———
    server = threading.Thread(
        target=lambda: app.run(port=5000, use_reloader=False),
        daemon=True
    )
    server.start()
    time.sleep(1)   

    # ——— 3) discover & run your tests ———
    loader = unittest.TestLoader()
    suite  = loader.discover("app/tests/selenium", pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # ——— 4) teardown ———
    db.session.remove()
    db.drop_all()
    ctx.pop()

    sys.exit(not result.wasSuccessful())