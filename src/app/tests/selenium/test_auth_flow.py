import time
from selenium.webdriver.common.by import By
from base import BaseSeleniumTest, LOCALHOST

class AuthFlowTests(BaseSeleniumTest):
    def test_login_success(self):
        self.driver.get(f"{LOCALHOST}auth/login")
        self.driver.find_element("name", "username").send_keys("user1")
        self.driver.find_element("name", "password").send_keys("password")
        self.driver.find_element("css selector", "button[type='submit']").click()
        time.sleep(1)
        self.assertIn("/dashboard", self.driver.current_url)

    def test_login_failure(self):
        self.driver.get(f"{LOCALHOST}auth/login")
        self.driver.find_element("name", "username").send_keys("wrong")
        self.driver.find_element("name", "password").send_keys("wrong")
        self.driver.find_element("css selector", "button[type='submit']").click()
        time.sleep(1)
        error = self.driver.find_element(By.CLASS_NAME, "alert")
        self.assertIn("Invalid credentials", error.text)