import time
import threading
import unittest

from selenium import webdriver
from selenium.webdriver.chrome.service import Service

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
        cls.app = create_app(TestConfig)
        cls.app.testing = True
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        db.create_all()
        import_units(db.session, CSV_PATH)
        create_users_and_plans(db.session)

        cls.server = threading.Thread(
            target=_run_app, args=(cls.app,), daemon=True
        )
        cls.server.start()
        time.sleep(1) 

        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        cls.driver = webdriver.Chrome(options=options)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        db.session.remove()
        db.drop_all()
        cls.app_context.pop()

    def test_homepage_loads_and_has_title(self):
        self.driver.get(LOCALHOST)
        self.assertIn("Schedulo", self.driver.title)

    def test_dashboard_requires_login(self):
        self.driver.get(LOCALHOST + "dashboard")
        self.assertIn("/auth/login", self.driver.current_url)

    def test_login_page_elements_present(self):
        self.driver.get(LOCALHOST + "auth/login")
        username = self.driver.find_element("name", "username")
        password = self.driver.find_element("name", "password")
        submit = self.driver.find_element("css selector", "button[type='submit']")
        self.assertTrue(username.is_displayed())
        self.assertTrue(password.is_displayed())
        self.assertTrue(submit.is_displayed())

    def test_successful_login_redirects_to_dashboard(self):
        self.driver.get(LOCALHOST + "auth/login")
        self.driver.find_element("name", "username").send_keys("user1")
        self.driver.find_element("name", "password").send_keys("password")
        self.driver.find_element("css selector", "button[type='submit']").click()
        time.sleep(1)
        self.assertIn("/dashboard", self.driver.current_url)


if __name__ == "__main__":
    unittest.main(verbosity=2)
