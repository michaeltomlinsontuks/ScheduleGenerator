
from datetime import datetime

# --- Semester Configuration ---
# These dates define the start and end of the recurring events.
SEMESTER_START_DATE = datetime(2025, 7, 21)
SEMESTER_END_DATE = datetime(2025, 11, 14)

# --- Module Color Configuration ---
# Maps module prefixes to Google Calendar color names.
# The script will later map these names to the API's colorId.
# Available colors: "Default", "Lavender", "Sage", "Grape", "Flamingo", 
# "Banana", "Tangerine", "Peacock", "Graphite", "Blueberry", "Basil"
MODULE_COLORS = {
    "COS": "Blueberry",  # Blueberry
    "STK": "Sage",       # Sage
    "WTW": "Grape",      # Grape
    "Default": "Graphite" # Default color for any other module
}

# --- Google API Configuration ---
# The name of the application (used for the OAuth consent screen).
APPLICATION_NAME = 'UP Schedule Generator'
# The path to the client secrets file obtained from Google Cloud Console.
CLIENT_SECRETS_FILE = 'credentials.json'
# The scopes required for the application.
SCOPES = ['https://www.googleapis.com/auth/calendar']
