import unittest
from app import create_app, db
from app.config import TestConfig
from app.seeds import import_units, create_users_and_plans


class BasicAppTestCase(unittest.TestCase):

    def setUp(self):
        testApp = create_app(TestConfig)
        self.client = testApp.test_client()
        self.app_context = testApp.app_context()
        self.app_context.push()
        db.create_all()

        import_units(db.session, "../data-scraping/cits.csv")
        create_users_and_plans(db.session)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_homepage(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)


if __name__ == '__main__':
    unittest.main(verbosity=2)
