import time
from selenium.webdriver.common.by import By
from base import BaseSeleniumTest, LOCALHOST

class FriendsUITests(BaseSeleniumTest):
    def test_add_and_remove_friend(self):
        # login first
        self.driver.get(f"{LOCALHOST}auth/login")
        self.driver.find_element("name", "username").send_keys("user1")
        self.driver.find_element("name", "password").send_keys("password")
        self.driver.find_element("css selector", "button[type='submit']").click()
        time.sleep(1)

        # add friend
        self.driver.get(f"{LOCALHOST}friends")
        search = self.driver.find_element(By.NAME, "friend")  # update to actual name
        search.send_keys("user2")
        self.driver.find_element(By.ID, "add-friend").click()  # update ID
        time.sleep(1)
        friend_list = self.driver.find_element(By.ID, "friend_list")  # update ID
        self.assertIn("user2", friend_list.text)

        # remove friend
        self.driver.find_element(By.CSS_SELECTOR, ".remove-friend").click()  # update selector
        time.sleep(1)
        self.assertNotIn("user2", friend_list.text)