import unittest

from app import create_app, db
from app.config import TestConfig
from app.seeds import import_units, create_users_and_plans
from app.models import Unit, User

CSV_PATH = "../data-scraping/cits.csv"


class BasicAppTestCase(unittest.TestCase):

    def setUp(self):
        testApp = create_app(TestConfig)
        self.client = testApp.test_client()
        self.app_context = testApp.app_context()
        self.app_context.push()
        db.create_all()

        import_units(db.session, CSV_PATH)
        create_users_and_plans(db.session)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def login(self, username="user1", password="password"):
        return self.client.post(
            "/auth/login-user",
            data={"username": username, "password": password},
            follow_redirects=True
        )

    def test_homepage(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)

    def test_nonexistent_page_returns_404(self):
        response = self.client.get('/no-such-page')
        self.assertEqual(response.status_code, 404)

    def test_units_seeded(self):
        count = Unit.query.count()
        self.assertGreater(count, 0, "Expected some units to be seeded")

    def test_users_seeded(self):
        count = User.query.count()
        self.assertEqual(count, 8, "Expected 8 users to be seeded")

    def test_dashboard_requires_login(self):
        resp = self.client.get("/dashboard")
        self.assertEqual(resp.status_code, 302)
        self.assertIn("/auth/login", resp.headers["Location"]) 

    def test_dashboard_after_login(self):
        login_resp = self.login()
        self.assertEqual(login_resp.status_code, 200)
        resp = self.client.get("/dashboard")
        self.assertEqual(resp.status_code, 200)


if __name__ == '__main__':
    unittest.main(verbosity=2)
