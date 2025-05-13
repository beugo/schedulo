import unittest
from app import create_app, db
from app.config import TestConfig
from app.seeds import import_units, create_users_and_plans
from app.models import Unit, UnitPlan

CSV_PATH = "../data-scraping/cits.csv"

class TestEndpoints(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        import_units(db.session, CSV_PATH)
        create_users_and_plans(db.session)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def login(self, username='user1', password='password'):
        return self.client.post(
            '/auth/login-user',
            data={'username': username, 'password': password},
            follow_redirects=True
        )

    def test_units_all(self):
        resp = self.client.get('/units/all')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), Unit.query.count())

    def test_plans_user_requires_login(self):
        resp = self.client.get('/plans/user')
        self.assertEqual(resp.status_code, 302)

    def test_plans_user_after_login(self):
        self.login()
        resp = self.client.get('/plans/user')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), UnitPlan.query.filter_by(user_id=1).count())

    def test_friend_get(self):
        self.login()
        resp = self.client.get('/friend/get')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIsInstance(data, list)
        self.assertEqual(data, [])

    def test_invalid_login(self):
        resp = self.client.post(
            '/auth/login-user',
            data={'username': 'wrong', 'password': 'wrong'},
            follow_redirects=True
        )
        self.assertIn(b'Invalid credentials', resp.data)