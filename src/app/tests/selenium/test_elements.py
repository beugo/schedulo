from selenium.webdriver.common.by import By
from base import BaseSeleniumTest, BASE_URL

class HomePageElementsTest(BaseSeleniumTest):
    def test_landing_page_title(self):
        self.driver.get(BASE_URL + "/")
        nav = self.driver.find_element(By.CSS_SELECTOR, "nav a")
        self.assertIn("Schedulo", nav.text)

    def test_homepage_nav_links(self):
        self.driver.get(BASE_URL + "/")
        self.assertTrue(self.driver.find_element(By.LINK_TEXT, "Login").is_displayed())
        self.assertTrue(self.driver.find_element(By.LINK_TEXT, "Register").is_displayed())

class AuthPageElementsTest(BaseSeleniumTest):
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
        self.assertTrue(self.driver.find_element(By.ID, "username").is_displayed())
        self.assertTrue(self.driver.find_element(By.ID, "password").is_displayed())
        self.assertTrue(self.driver.find_element(By.ID, "confirm_password").is_displayed())
        self.assertTrue(self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").is_displayed())