import unittest, tempfile, csv
from app import create_app, db
from app.config import TestConfig
from app.seeds import import_units, create_users_and_plans
from app.models import Unit, User, UnitPlan, UnitPlanToUnit

class TestSeeds(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def make_tmp_csv(self, rows):
        tmp = tempfile.NamedTemporaryFile(mode='w', newline='', delete=False)
        writer = csv.writer(tmp)
        writer.writerows(rows)
        tmp.close()
        return tmp.name

    def test_import_units_creates_units(self):
        rows = [
            ['Unit Name','Unit Code','Semesters','Exam','URL','Unit Coordinator','Prerequisites','Description','Contact Hours'],
            ['U1','C001','Semester 1, Semester 2','Yes','u1','coord','none','desc','[["Lec",2]]'],
            ['U2','C002','Semester 2','No','u2','coord2','C001','desc2','[["Lab",1]]'],
        ]
        path = self.make_tmp_csv(rows)
        import_units(db.session, path)

        all_units = Unit.query.all()
        self.assertEqual(len(all_units), 2)

        u1 = Unit.query.filter_by(unit_code='C001').one()
        self.assertTrue(u1.semester1 and u1.semester2 and u1.exam)

        u2 = Unit.query.filter_by(unit_code='C002').one()
        self.assertFalse(u2.semester1)
        self.assertTrue(u2.semester2)
        self.assertFalse(u2.exam)

    def test_create_users_and_plans(self):
        unit_csv = [
            ['Unit Name','Unit Code','Semesters','Exam','URL','Unit Coordinator','Prerequisites','Description','Contact Hours'],
            ['Solo','SU','Semester 1','No','su','c','none','d','[["Lec",1]]'],
        ]
        path = self.make_tmp_csv(unit_csv)
        import_units(db.session, path)
        create_users_and_plans(db.session)

        users = {u.username for u in User.query.all()}
        self.assertSetEqual(users, {'hugo','joel','prashan','nathan'})

        for name in ('hugo','joel','prashan'):
            plans = UnitPlan.query.filter_by(user_id=User.query.filter_by(username=name).one().id)
            self.assertEqual(plans.count(), 2)
            for p in plans:
                links = UnitPlanToUnit.query.filter_by(unit_plan_id=p.id).all()
                self.assertGreaterEqual(len(links), 1)
                self.assertLessEqual(len(links), 4)