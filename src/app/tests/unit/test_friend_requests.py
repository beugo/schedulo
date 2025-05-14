import unittest
from app import create_app, db
from app.config import TestConfig
from app.seeds import import_units, create_users_and_plans
from app.models import User, UserFriend

class TestFriendRequests(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

        db.create_all()
        import_units(db.session, "../data-scraping/cits.csv")
        create_users_and_plans(db.session)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def login(self, u='hugo', p='password'):
        return self.client.post(
            '/auth/login-user',
            data={'username': u, 'password': p},
            follow_redirects=True
        )

    def test_send_friend_request(self):
        self.login('hugo', 'password')
        resp = self.client.post(
            '/friend_requests/send',
            json={'q': 'nathan'}
        )
        self.assertEqual(resp.status_code, 200)

        from app.models import FriendRequests, User
        hugo = User.query.filter_by(username='hugo').one()
        nathan = User.query.filter_by(username='nathan').one()

        fr = FriendRequests.query.filter_by(
            user_id=hugo.id,
            friend_id=nathan.id,
            is_deleted=False
        ).first()
        self.assertIsNotNone(fr)

        self.login('nathan', 'password')
        resp2 = self.client.get('/friend_requests/get')
        self.assertEqual(resp2.status_code, 200)

        pending = resp2.get_json()
        usernames = [r['username'] for r in pending]
        self.assertIn('hugo', usernames)
    
    def test_duplicate_friend_request_blocked(self):
        self.login()
        self.client.post("/friend_requests/send", json={"q": "nathan"})
        second = self.client.post("/friend_requests/send", json={"q": "nathan"})
        self.assertEqual(second.status_code, 400)