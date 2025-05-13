import time
from selenium.webdriver.common.by import By
from base import BaseSeleniumTest, LOCALHOST

class PlanUITests(BaseSeleniumTest):
    def test_plan_page_elements(self):
        self.driver.get(f"{LOCALHOST}create-plan")  # update path if needed
        self.assertTrue(self.driver.find_element(By.ID, "searchInput"))
        self.assertTrue(self.driver.find_element(By.ID, "unitList"))
        self.assertTrue(self.driver.find_element(By.ID, "saveButton"))

    def test_search_filters(self):
        self.driver.get(f"{LOCALHOST}create-plan")
        search = self.driver.find_element(By.ID, "searchInput")
        search.send_keys("CITS1401")
        time.sleep(1)
        items = self.driver.find_elements(By.CSS_SELECTOR, "#unitList li")
        self.assertTrue(all("CITS1401" in item.text for item in items))