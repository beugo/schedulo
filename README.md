# cits3403-project


## Design and Use

This tool helps new UWA Computer Science students plan their course schedules by generating a personalized unit plan based on their major. It simplifies handbook requirements and prerequisites through a clear, guided interface. (TODO: figure out whether we are prioritising the three-year unit plan or the weekly class scheduler)

### Tech Stack
Frontend: HTML, CSS, JavaScript, Tailwind
Backend: Flask, jQuery, AJAX/Websockets, SQLite (via SQLAlchemy)

## Group Members
| Name               | Student Number | GitHub Username   |
|--------------------|----------------|--------------------|
| Hugo Smith         | 23620112       | beugo              |
| Joel Smith         | 23338559       | joeldotsmith       |
| Prashan Wijesinghe | 23783481       | quarterpie3141     |
| Nathan Kim         | 23364749       | nathanbkim         |

--

## Instructions to Launch Application
### Requirements

- Python 3.8 or newer
- `pip`
- `virtualenv`

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone git@github.com:beugo/cits3403-project.git
   cd cits3403-project
   ```

2. **Create and activate a virtual environment**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install project dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask app**
   ```bash
   cd deliverables
   python run.py
   ```

5. **Visit the app**
   Open your browser and go to:  
   [http://localhost:5000](http://localhost:5000)

6. **Import Existing Units (Optional)**
   To import existing units run the import_units.py script from the project directory
   ```bash
   cd cits3404-Project
   python3 src/import_units.py
   ```

## Instructions for how to run the tests for the application
