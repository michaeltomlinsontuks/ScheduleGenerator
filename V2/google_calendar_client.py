import os.path
import pickle
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from V2.config import CLIENT_SECRETS_FILE, SCOPES, APPLICATION_NAME

# Mapping of color names to Google Calendar API color IDs
# See: https://developers.google.com/calendar/api/v3/reference/colors
COLOR_ID_MAP = {
    "Default": "0",
    "Lavender": "1",
    "Sage": "2",
    "Grape": "3",
    "Flamingo": "4",
    "Banana": "5",
    "Tangerine": "6",
    "Peacock": "7",
    "Graphite": "8",
    "Blueberry": "9",
    "Basil": "10",
}

def get_calendar_service():
    """
    Authenticates with the Google Calendar API and returns a service object.
    Handles the OAuth 2.0 flow and token storage.
    """
    creds = None
    token_path = 'V2/token.pickle'

    # Load credentials from the token file if it exists.
    if os.path.exists(token_path):
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)

    # If there are no (valid) credentials, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Ensure the credentials.json file exists
            if not os.path.exists("V2/" + CLIENT_SECRETS_FILE):
                raise FileNotFoundError(
                    f"Error: The credentials file was not found at V2/{CLIENT_SECRETS_FILE}. "
                    f"Please follow the setup instructions to get your credentials."
                )
            flow = InstalledAppFlow.from_client_secrets_file("V2/" + CLIENT_SECRETS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)

    return build('calendar', 'v3', credentials=creds)

def add_event_to_calendar(service, event_data):
    """
    Adds a single event to the user's primary Google Calendar.

    Args:
        service: The authenticated Google Calendar service object.
        event_data: A dictionary containing the processed event details.
    """
    event = {
        'summary': event_data.get('summary', 'Unnamed Event'),
        'location': event_data.get('location', ''),
        'description': event_data.get('description', ''),
        'start': {
            'dateTime': event_data['start_dt'].isoformat(),
            'timeZone': 'Africa/Johannesburg',
        },
        'end': {
            'dateTime': event_data['end_dt'].isoformat(),
            'timeZone': 'Africa/Johannesburg',
        },
        'reminders': {
            'useDefault': False,
        },
    }

    # Add recurrence rule if it exists
    if event_data.get('rrule'):
        event['recurrence'] = [event_data['rrule']]

    # Add color if specified
    if event_data.get('colorId'):
        event['colorId'] = event_data['colorId']

    created_event = service.events().insert(calendarId='primary', body=event).execute()
    print(f"Event created: {created_event.get('htmlLink')}")

if __name__ == '__main__':
    # This is for testing purposes.
    # It will attempt to authenticate and print the user's calendar list.
    print("Attempting to authenticate with Google Calendar...")
    try:
        service = get_calendar_service()
        print("Authentication successful!")
        
        # List the user's calendars
        print("\nYour calendars:")
        calendar_list = service.calendarList().list().execute()
        for calendar_list_entry in calendar_list['items']:
            print(f"- {calendar_list_entry['summary']}")

    except FileNotFoundError as e:
        print(e)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
