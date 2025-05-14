from time import sleep
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from base import BaseSeleniumTest, BASE_URL

class FriendFlowTests(BaseSeleniumTest):
    def setUp(self):
        super().setUp()
        self.login("hugo", "password")
        self.driver.get(f"{BASE_URL}/friends")

    def test_search_and_send_friend_request(self):
        self.driver.get(f"{BASE_URL}/friends")
        self.wait.until(EC.presence_of_element_located((By.ID, "searchInput")))
        self.wait.until(EC.presence_of_element_located((By.ID, "results")))
        self.wait.until(EC.presence_of_element_located((By.ID, "friendTable")))

        box = self.driver.find_element(By.ID, "searchInput")
        box.send_keys("na")

        self.wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'nathan')]"))
        )

        nathan_option = self.driver.find_element(By.XPATH, "//ul[@id='results']/li[text()='nathan']")
        nathan_option.click()

        locator = (By.CSS_SELECTOR, ".alert.success")
        self.wait.until(EC.visibility_of_element_located(locator))
        alert = self.driver.find_element(*locator)
        self.assertIn("Sent friend request successfully", alert.text)

    def test_remove_existing_friend(self):  # this test can be a bit flaky
        sleep(2)
        btn = self.driver.find_element(
            By.CSS_SELECTOR,
            "button[onclick=\"deleteFriend('joel')\"]"
        )
        btn.click()
        sleep(2)
        self.driver.refresh()
        self.driver.get(f"{BASE_URL}/friends")
        sleep(2)
        rows = self.driver.find_elements(By.CSS_SELECTOR, "tbody tr")
        self.assertEqual(1, len(rows), "Joel's row should have been removed")


class AuthFlowTests(BaseSeleniumTest):
    def test_login_success_redirects_to_dashboard(self):
        self.login("hugo", "password")
        self.assertIn("/dashboard", self.driver.current_url)

    def test_logout_takes_you_back_to_landing(self):
        self.login("hugo", "password")
        self.driver.find_element(By.LINK_TEXT, "Logout").click()
        sleep(2)
        self.assertIn(BASE_URL + "/", self.driver.current_url)