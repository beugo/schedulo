import unittest
from app import create_app, db
from app.config import TestConfig
from app.seeds import import_units, create_users_and_plans
from app.models import Unit, UnitPlan

CSV_PATH = "../data-scraping/units.csv"

class TestEndpoints(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

        db.create_all()
        import_units(db.session, CSV_PATH)
        create_users_and_plans(db.session)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def login(self, username='hugo', password='password'):
        return self.client.post(
            '/auth/login-user',
            data={'username': username, 'password': password},
            follow_redirects=True
        )

    def test_units_all(self):
        """GET /units/all returns JSON list of all units."""
        resp = self.client.get('/units/all')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIsInstance(data, list)
        # should match count in DB
        self.assertEqual(len(data), Unit.query.count())

        if data:
            self.assertIn('unit_code', data[0])
            self.assertIn('unit_name', data[0])

    def test_plans_user_requires_login(self):
        """GET /plans/user shouldn't be accessible when not logged in."""
        resp = self.client.get('/plans/user')
        self.assertEqual(resp.status_code, 401)

    def test_plans_user_after_login(self):
        """Logged-in user sees exactly their own plans."""
        self.login()
        resp = self.client.get('/plans/user')
        self.assertEqual(resp.status_code, 200)

        data = resp.get_json()
        self.assertIsInstance(data, list)

        expected = UnitPlan.query.filter_by(user_id=1).count()
        self.assertEqual(len(data), expected)

        for plan in data:
            self.assertIn('id', plan)
            self.assertIn('name', plan)
            self.assertIn('shared', plan)

    def test_friend_get_before_and_after_login(self):
        """/friend/get returns [] when logged out, and actual friends when logged in."""
        resp = self.client.get('/friend/get')
        self.assertEqual(resp.status_code, 401)

        self.login()
        resp = self.client.get('/friend/get')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIsInstance(data, list)

    def test_invalid_login_shows_flash(self):
        """Bad credentials flash an error."""
        resp = self.client.post(
            '/auth/login-user',
            data={'username': 'skibidi', 'password': 'toilet'},
            follow_redirects=True
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'Invalid credentials', resp.data)

    def test_shared_feed(self):
        """GET /share/refresh shows all shared plans."""
        self.login(username='hugo', password='password')

        resp = self.client.get('/share/refresh')
        self.assertEqual(resp.status_code, 200)
        feed = resp.get_json()
        self.assertIsInstance(feed, list)

        self.assertEqual(len(feed), 10)

        for post in feed:
            self.assertIn('user_name', post)
            self.assertIn('unit_plan', post)
            self.assertIsInstance(post['unit_plan'], dict)
            self.assertIn('name', post['unit_plan'])
