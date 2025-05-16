# Schedulo


## What is Schedulo?

Schedulo is a web-based planning tool designed specifically for new Computer Science students at the University of Western Australia (UWA). Its main purpose is to help students map out their three-year degree by generating a personalized unit plan based on their chosen major. Schedulo streamlines the process of understanding handbook requirements, checking prerequisites, and tracking credit points, all through an intuitive and guided interface. The application visually lays out each semester, making it easy for students to see their academic journey from start to finish and make informed decisions about their studies.

### Key Features
- **Personalized Unit Planning:** Enter your major and Schedulo will generate a recommended sequence of units for all three years, taking into account prerequisites and degree requirements.
- **Handbook Simplification:** Schedulo interprets the official UWA handbook rules and presents them in a clear, actionable format.
- **Prerequisite Awareness:** Schedulo automatically checks for prerequisite chains, ensuring you don’t miss any required units.
- **Interactive Interface:** The guided interface allows you to explore, adjust, and visualize your plan semester by semester.
- **Collaboration:** You can share your plan with friends, compare unit choices, and even send or receive friend requests within the platform.

### Technology Stack
- **Frontend:** Built with HTML, JavaScript, and Tailwind CSS for a modern, responsive user experience.
- **Backend:** Powered by Flask (Python), with real-time features enabled by AJAX. Data is stored in SQLite using SQLAlchemy ORM for reliability and simplicity.

## Group Members
| Name               | Student Number | GitHub Username   |
|--------------------|----------------|--------------------|
| Hugo Smith         | 23620112       | beugo              |
| Joel Smith         | 23338559       | joeldotsmith       |
| Prashan Wijesinghe | 23783481       | quarterpie3141     |
| Nathan Kim         | 23364749       | nathanbkim         |


## How to Launch the Application

### Requirements

- Python 3.8 or newer (make sure it is installed on your system)
- `pip` (Python package manager)
- `virtualenv` (for creating isolated Python environments)

### Setup Instructions

1. **Clone the repository**
   Clone the Schedulo repository from GitHub and navigate into the project directory:
   ```bash
   git clone git@github.com:beugo/schedulo.git
   cd schedulo
   ```

2. **Create and activate a virtual environment**
   Set up a Python virtual environment to keep dependencies isolated:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

3. **Install project dependencies**
   Install all required Python packages using pip:
   ```bash
   cd src
   pip install -r requirements.txt
   ```
   
4. **Seed Unit Data**
   Seed the unit data:
   ```bash
   flask db upgrade
   python seed_units.py
   ```
5. **Run the Flask app**
   Start the Flask development server:
   ```bash
   python run.py
   ```
6. **Access the application**  
   Open your web browser and go to [http://localhost:5000](http://localhost:5000) to use Schedulo.

7. **Import Existing Users (Optional)**
   If you want to pre-populate the database with existing users, run the following commands from the project directory:
   ```bash
   python seed_users.py
   ```

## How to Run the Tests for the Application

Schedulo includes both unit tests and Selenium-based end-to-end tests to ensure reliability.

1. **Running Unit Tests**
   To execute the unit tests, run:
   ```bash
   python src/test_runner.py -u
   ```

2. **Running Selenium Tests**
   To run the Selenium browser-based tests, use:
   ```bash
   python src/test_runner.py -s
   ```

These tests will help you verify that the application is working as expected and that all major features are functioning correctly.

