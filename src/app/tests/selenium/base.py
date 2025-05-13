import threading
import time
import unittest
from werkzeug.serving import make_server
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

from app import create_app, db
from app.config import TestConfig
from app.seeds import import_units, create_users_and_plans

BASE_URL = "http://127.0.0.1:5001"
class BaseSeleniumTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(TestConfig)
        cls.app.testing = True
        cls.ctx = cls.app.app_context()
        cls.ctx.push()

        db.create_all()
        import_units(db.session, "../data-scraping/cits.csv")
        create_users_and_plans(db.session)

        cls.server = make_server("127.0.0.1", 5001, cls.app)
        cls.server_thread = threading.Thread(target=cls.server.serve_forever)
        cls.server_thread.setDaemon(True)
        cls.server_thread.start()

        time.sleep(1)  
        chrome_opts = Options()
        chrome_opts.add_argument("--headless")
        cls.driver = webdriver.Chrome(options=chrome_opts)

        cls.wait = WebDriverWait(cls.driver, 2)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        cls.server.shutdown()
        cls.server_thread.join()
        db.session.remove()
        db.drop_all()
        cls.ctx.pop()
    
    def login(self, username, password):
        self.driver.get(BASE_URL + "/auth/login")

        self.driver.find_element(By.NAME, "username").send_keys(username)
        self.driver.find_element(By.NAME, "password").send_keys(password)

        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        time.sleep(1)

        