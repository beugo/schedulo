import unittest

if __name__ == '__main__':
    loader = unittest.TestLoader()
    suite = loader.discover('app/tests/unit', pattern='test_*.py')
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)