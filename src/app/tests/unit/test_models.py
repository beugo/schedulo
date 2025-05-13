import unittest
from app import create_app, db
from app.config import TestConfig
from app.models import User

class TestModels(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_set_and_check_password(self):
        u = User(username='testuser')
        u.set_password('secret')
        self.assertTrue(u.check_password('secret'))
        self.assertFalse(u.check_password('wrong'))

    def test_password_hash_changes(self):
        u = User(username='hashuser')
        u.set_password('pass1')
        first_hash = u.password_hash
        u.set_password('pass2')
        second_hash = u.password_hash
        self.assertNotEqual(first_hash, second_hash)
