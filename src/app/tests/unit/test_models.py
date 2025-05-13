import unittest
from app import create_app, db
from app.config import TestConfig
from app.models import User

class TestModels(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_set_and_check_password(self):
        u = User(username='testuser')
        u.set_password('secret')
        self.assertTrue(u.check_password('secret'))
        self.assertFalse(u.check_password('wrong'))

    def test_password_hash_changes(self):
        u = User(username='hashuser')
        u.set_password('first')
        h1 = u.password_hash
        u.set_password('second')
        h2 = u.password_hash
        self.assertNotEqual(h1, h2)
