import unittest
import tempfile
import csv
from app import create_app, db
from app.config import TestConfig
from app.seeds import import_units, create_users_and_plans
from app.models import Unit, User, UnitPlan, UnitPlanToUnit

class TestSeeds(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_import_units_creates_units(self):
        # Create a temporary CSV file
        rows = [
            ['Unit Name','Unit Code','Semesters','Exam','URL','Unit Coordinator','Prerequisites','Description','Contact Hours'],
            ['Test Unit1','TU1','Semester 1, Semester 2','Yes','http://example.com','Coord','None','Desc','[["Lecture",2]]'],
            ['Test Unit2','TU2','Semester 2','No','http://example.org','Coord2','TU1','Desc2','[["Lab",1]]']
        ]
        tmp = tempfile.NamedTemporaryFile(mode='w', newline='', delete=False)
        writer = csv.writer(tmp)
        writer.writerows(rows)
        tmp.close()

        import_units(db.session, tmp.name)
        units = Unit.query.all()
        self.assertEqual(len(units), 2)

        u1 = Unit.query.filter_by(unit_code='TU1').first()
        self.assertTrue(u1.semester1)
        self.assertTrue(u1.semester2)
        self.assertTrue(u1.exam)

        u2 = Unit.query.filter_by(unit_code='TU2').first()
        self.assertFalse(u2.semester1)
        self.assertTrue(u2.semester2)
        self.assertFalse(u2.exam)

    def test_create_users_and_plans(self):
        # Import at least one unit so plans can reference units
        rows = [
            ['Unit Name','Unit Code','Semesters','Exam','URL','Unit Coordinator','Prerequisites','Description','Contact Hours'],
            ['Solo Unit','SU','Semester 1','No','http://example.test','Coord','None','Desc','[["Lecture",1]]']
        ]
        tmp = tempfile.NamedTemporaryFile(mode='w', newline='', delete=False)
        writer = csv.writer(tmp)
        writer.writerows(rows)
        tmp.close()

        import_units(db.session, tmp.name)
        create_users_and_plans(db.session)

        users = User.query.all()
        self.assertEqual(len(users), 8)

        for u in users:
            plans = UnitPlan.query.filter_by(user_id=u.id).all()
            self.assertLessEqual(len(plans), 2)
            for p in plans:
                links = UnitPlanToUnit.query.filter_by(unit_plan_id=p.id).all()
                self.assertGreaterEqual(len(links), 1)
                self.assertLessEqual(len(links), 4)