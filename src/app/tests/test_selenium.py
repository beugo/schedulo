import time
import threading
import unittest

from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager

from app import create_app, db
from app.config import TestConfig
from app.seeds import import_units, create_users_and_plans

LOCALHOST = "http://localhost:5000/"
CSV_PATH = "../data-scraping/cits.csv"

def _run_app(app):
    app.run(port=5000, use_reloader=False)

class SeleniumTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        cls.driver = webdriver.Chrome(options=options)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def setUp(self):
        self.app = create_app(TestConfig)
        self.app.testing = True
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        import_units(db.session, CSV_PATH)
        create_users_and_plans(db.session)

        self.server = threading.Thread(
            target=_run_app, args=(self.app,), daemon=True
        )
        self.server.start()
        time.sleep(1)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_homepage_loads_and_has_title(self):
        self.driver.get(LOCALHOST)
        self.assertIn("Schedulo", self.driver.title)