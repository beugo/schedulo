import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urljoin, urlparse, parse_qs
import logging
import csv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')

BASE_URL = "https://handbooks.uwa.edu.au/units"
EXAM_KEYWORDS = ["exam", "examination"]
DELAY = 0.05  # Delay in seconds between requests

# Create a session with a retry strategy
session = requests.Session()
retry_strategy = Retry(
    total=3,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["HEAD", "GET", "OPTIONS"],
    backoff_factor=1
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session.mount("https://", adapter)
session.mount("http://", adapter)

def get_unit_links():
    """Retrieve all unit detail page links from the base URL."""
    try:
        response = session.get(BASE_URL, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        # Find links that contain "unitdetails" in their href
        unit_links = [a['href'] for a in soup.find_all('a', href=True) if "unitdetails" in a['href']]
        return unit_links
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to get unit links: {e}")
        return []

def normalize_semester(semester_str):
    """Normalize semester strings."""
    semester_str = semester_str.lower()
    if 'semester 1' in semester_str or 'sem 1' in semester_str or 's1' in semester_str:
        return 'Semester 1'
    elif 'semester 2' in semester_str or 'sem 2' in semester_str or 's2' in semester_str:
        return 'Semester 2'
    else:
        return semester_str.title()

def get_unit_info(url):
    """
    Retrieve exam status and offering semesters for a unit.
    
    Returns a tuple: (has_exam, semesters)
      - has_exam: Boolean (True if an exam is mentioned, else False)
      - semesters: List of normalized semester strings when the unit is offered
    """
    try:
        response = session.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")

        # --- Extract semesters from the Offering section ---
        semesters = []
        offering_section = None
        for dt_tag in soup.find_all('dt'):
            dt_text = dt_tag.get_text(separator=' ', strip=True)
            if 'Offering' in dt_text:
                offering_section = dt_tag
                break

        if offering_section:
            dd = offering_section.find_next("dd")
            table = dd.find("table") if dd else None
            if table:
                tbody = table.find("tbody")
                if tbody:
                    rows = tbody.find_all("tr")
                    for row in rows:
                        cols = row.find_all("td")
                        if len(cols) >= 1:
                            semester = cols[0].get_text(strip=True)
                            semester = normalize_semester(semester)
                            semesters.append(semester)
        else:
            logging.warning(f"Could not find offering section in {url}")

        # --- Determine exam status from the Assessment section ---
        assessment_section = soup.find("dt", string="Assessment")
        has_exam = False
        if assessment_section:
            dd = assessment_section.find_next("dd")
            if dd:
                assessment_content = dd.get_text().lower()
                if any(keyword in assessment_content for keyword in EXAM_KEYWORDS):
                    has_exam = True
        else:
            # If the assessment section is not found, assume the exam is present
            print(f"WARNING: assuming exam is present for {url}")
            has_exam = True

        # --- Determine unit name ---
        unit_title_tag = soup.find('h2', id='pagetitle')
        if unit_title_tag:
            unit_title = unit_title_tag.get_text(strip=True)
            if '[' in unit_title:
                unit_name = unit_title.split(' [')[0]
            else:
                unit_name = unit_title
        else:
            unit_name = ''

        return has_exam, semesters, unit_name

    except requests.exceptions.Timeout:
        logging.warning(f"Timeout occurred while accessing {url}")
        return False, []
    except requests.exceptions.RequestException as e:
        logging.error(f"Request exception for {url}: {e}")
        return False, []
    except Exception as e:
        logging.error(f"An error occurred while processing {url}: {e}")
        return False, []

def scrape_units(prefixes=None):
    """
    Scrape all unit links, filter by the given discipline prefixes (if provided),
    and collect the unit code, exam status, semesters, and URL.
    
    Returns a list of tuples: (unit_code, exam, semesters, url)
    """
    unit_links = get_unit_links()
    results = []

    for link in unit_links:
        full_url = urljoin(BASE_URL, link)
        parsed_url = urlparse(full_url)
        unit_code = parse_qs(parsed_url.query).get('code', [None])[0]

        if unit_code is None:
            continue  # Skip if unit code is missing

        if prefixes:
            if not any(unit_code.upper().startswith(prefix.upper()) for prefix in prefixes):
                continue  # Skip units that don't match the desired discipline prefixes

        logging.info(f"Processing unit - {unit_code}")

        has_exam, semesters, unit_name = get_unit_info(full_url)
        exam_status = "Yes" if has_exam else "No"
        semesters_joined = ", ".join(semesters) if semesters else ""
        results.append((unit_name, unit_code, exam_status, semesters_joined, full_url))
        time.sleep(DELAY)

    return results

if __name__ == "__main__":
    # Ask user for the discipline prefix(es)
    prefixes_input = input("Enter the discipline prefix(es) for the units you want to include (separate multiple prefixes with commas): ")
    prefixes = [prefix.strip().upper() for prefix in prefixes_input.split(',') if prefix.strip()]

    # Ask user for the output CSV file name
    csv_filename = input("Enter the name for the CSV file (default: units.csv): ").strip()
    if not csv_filename:
        csv_filename = "units.csv"

    # Scrape unit information for the given discipline(s)
    units_info = scrape_units(prefixes)
    
    # Write the gathered information to a CSV file
    with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["Unit Name", "Unit Code", "Exam", "Semesters", "URL"])
        writer.writerows(units_info)
    
    print(f"Data for {len(units_info)} units written to {csv_filename}.")
