from time import sleep

from selenium.webdriver.common.by import By
from base import BaseSeleniumTest, BASE_URL

class LoginPageTest(BaseSeleniumTest):
    def test_login_form_fields_present(self):
        self.driver.get(BASE_URL + "/auth/login")
        username = self.driver.find_element(By.NAME, "username")
        password = self.driver.find_element(By.NAME, "password")
        submit   = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")

        self.assertTrue(username.is_displayed())
        self.assertTrue(password.is_displayed())
        self.assertTrue(submit.is_displayed())

    def test_signup_form_fields_present(self):
        self.driver.get(BASE_URL + "/auth/register")
        assert self.driver.find_element(By.ID, "username").is_displayed()
        assert self.driver.find_element(By.ID, "password").is_displayed()
        assert self.driver.find_element(By.ID, "confirm_password").is_displayed()
        assert self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").is_displayed()

    def test_login_success_redirects_to_dashboard(self):
        self.login("hugo", "password")
        assert "/dashboard" in self.driver.current_url

    def test_logout_takes_you_back_to_login(self):
        self.login("hugo", "password")
        self.driver.find_element(By.LINK_TEXT, "Logout").click()

        sleep(1)
        
        assert "/auth/login" in self.driver.current_url  