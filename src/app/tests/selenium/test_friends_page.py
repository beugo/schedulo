from time import sleep

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from base import BaseSeleniumTest, BASE_URL

class FriendsPageTests(BaseSeleniumTest):
    def setUp(self):
        super().setUp()
        self.login("hugo", "password")
        self.driver.get(f"{BASE_URL}/friends")

    def test_search_and_send_friend_request(self):
        box = self.driver.find_element(By.ID, "searchInput")
        box.send_keys("na")

        sleep(1)

        name = self.driver.find_element(By.CSS_SELECTOR, "#results li")
        name.click()

        self.wait.until(
            EC.text_to_be_present_in_element((By.CLASS_NAME, "alert"), "Sent friend request successfully")
        )

    def test_remove_existing_friend(self):
        # assume "joel" is already a friend in the seed data
        btn = self.driver.find_element(
            By.CSS_SELECTOR,
            "button[onclick=\"deleteFriend('joel')\"]"
        )
        btn.click()
        sleep(1)
        self.driver.refresh()
        rows = self.driver.find_elements(By.XPATH, "//tr[td/text()='joel']")
        self.assertEqual(0, len(rows), "Joel's row should have been removed")        
        