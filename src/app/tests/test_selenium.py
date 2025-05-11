import unittest
import multiprocessing
from selenium import webdriver

import selenium.webdriver
from app import create_app, db
from app.config import TestConfig
from app.seeds import import_units, create_users_and_plans

LOCALHOST = "http://localhost:5000/"

class SeleniumTests(unittest.TestCase):

    def setUp(self):
        self.testApp = create_app(TestConfig)
        self.app_context = self.testApp.app_context()
        self.app_context.push()
        db.create_all()

        import_units(db.session, "../data-scraping/cits.csv")
        create_users_and_plans(db.session)

        self.server_thread = multiprocessing.Process(target=self.testApp.run)
        self.server_thread.start()

        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        self.driver = webdriver.Chrome(options=options)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

        self.server_thread.terminate()
        self.driver.close()

    def test_homepage_loads_and_has_title(self):
        self.driver.get(LOCALHOST)
        self.assertIn("Schedulo", self.driver.title)
