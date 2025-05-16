#!/usr/bin/env python3
import argparse
import sys
import unittest

def run_tests(subdir):
    loader = unittest.TestLoader()
    suite  = loader.discover(f"app/tests/{subdir}", pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    return runner.run(suite)

def main():
    p = argparse.ArgumentParser(description="Run unit or selenium test suites")
    grp = p.add_mutually_exclusive_group(required=True)
    grp.add_argument('-u', '--unit',     action='store_true', help='Run unit tests')
    grp.add_argument('-s', '--selenium', action='store_true', help='Run selenium tests')
    args = p.parse_args()

    if args.unit:
        result = run_tests("unit")       
    else:
        result = run_tests("selenium")  

    sys.exit(0 if result.wasSuccessful() else 1)

if __name__ == "__main__":
    main()
