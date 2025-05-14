# Schedulo


## Design and Use

This tool helps new UWA Computer Science students plan their degree over three years by generating a personalized unit plan based on their major. It simplifies handbook requirements, prerequisites, and credit tracking through a clear, guided interface that maps out each semester from start to finish.

### Tech Stack
- Frontend: HTML, CSS, JavaScript, Tailwind
- Backend: Flask, jQuery, AJAX/Websockets, SQLite (via SQLAlchemy)

## Group Members
| Name               | Student Number | GitHub Username   |
|--------------------|----------------|--------------------|
| Hugo Smith         | 23620112       | beugo              |
| Joel Smith         | 23338559       | joeldotsmith       |
| Prashan Wijesinghe | 23783481       | quarterpie3141     |
| Nathan Kim         | 23364749       | nathanbkim         |


## Instructions to Launch Application
### Requirements

- Python 3.8 or newer
- `pip`
- `virtualenv`

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone git@github.com:beugo/schedulo.git
   cd schedulo
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

3. **Install project dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask app**
   ```bash
   cd src
   python run.py
   ```

5. **Visit the app**  
   Visit the app at this address --> [http://localhost:5000](http://localhost:5000)

6. **Import Existing Units (Optional)**
   To import existing units run the import_units.py script from the project directory
   ```bash
   cd schedulo
   python seed.py
   ```

## Instructions for how to run the tests for the application

1. **Running Unit Tests**
```
cd src
python run_unit_tests.py
```

2. **Running Selenium Tests**
```
cd src
python run_selenium_tests.py
```

