from selenium.webdriver.common.by import By
from base import BaseSeleniumTest, BASE_URL

class HomePageTest(BaseSeleniumTest):
    def test_landing_page_title(self):
        self.driver.get(BASE_URL + "/")
        nav = self.driver.find_element(By.CSS_SELECTOR, "nav a")
        self.assertIn("Schedulo", nav.text)

    def test_homepage_nav_links(self):
        self.driver.get(BASE_URL + "/")
        assert self.driver.find_element(By.LINK_TEXT, "Login").is_displayed()
        assert self.driver.find_element(By.LINK_TEXT, "Register").is_displayed()

    