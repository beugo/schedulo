import unittest
from selenium import webdriver

LOCALHOST = "http://localhost:5000/"

class BaseSeleniumTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        opts = webdriver.ChromeOptions()
        opts.add_argument("--headless=new")
        cls.driver = webdriver.Chrome(options=opts)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()