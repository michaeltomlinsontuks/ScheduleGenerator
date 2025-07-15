
import os
from datetime import datetime, timedelta
import pytz

from pdf_parser import parse_pdf
from data_processor import process_events
from preview_generator import generate_preview_summary
from google_calendar_client import get_calendar_service, add_event_to_calendar, COLOR_ID_MAP
from config import SEMESTER_START_DATE, SEMESTER_END_DATE, MODULE_COLORS

TIMEZONE = pytz.timezone("Africa/Johannesburg")

def main():
    """
    Main function to run the schedule generator with Google Calendar integration.
    """
    print("--- University of Pretoria Schedule Generator V2 ---")

    pdf_path = input("Please enter the full path to your schedule PDF: ").strip()

    if not os.path.exists(pdf_path) or not pdf_path.lower().endswith('.pdf'):
        print("Invalid file path or not a PDF file. Please try again.")
        return

    try:
        # 1. Parse and process the PDF
        print("\nProcessing your schedule...")
        raw_events = parse_pdf(pdf_path)
        processed_events = process_events(raw_events)

        if not processed_events:
            print("Could not find any valid events in the PDF.")
            return

        # 2. Authenticate with Google Calendar
        print("\nAuthenticating with Google Calendar...")
        # This will prompt for login on the first run
        service = get_calendar_service()
        print("Authentication successful!")

        # 3. Generate and display the preview
        print("\n--- PREVIEW ---")
        preview_summary = generate_preview_summary(processed_events)
        print(preview_summary)
        print("The events listed above will be added to your primary Google Calendar.")

        # 4. Get user approval
        approval = input("\nDo you want to proceed? (yes/no): ").strip().lower()

        if approval == 'yes':
            print("\nAdding events to your Google Calendar. This may take a moment...")
            # 5. Prepare and add events to Google Calendar
            for event_data in processed_events:
                # Assign color
                module_prefix = event_data.get('Module', '').split()[0]
                color_name = MODULE_COLORS.get(module_prefix, MODULE_COLORS['Default'])
                event_data['colorId'] = COLOR_ID_MAP.get(color_name, "0")

                # Set datetimes and recurrence
                if 'Date' in event_data and event_data['Date']:
                    event_date = datetime.strptime(event_data['Date'], '%d %b %Y')
                    start_dt = TIMEZONE.localize(datetime.combine(event_date, datetime.strptime(event_data['start_time'], '%H:%M').time()))
                    end_dt = TIMEZONE.localize(datetime.combine(event_date, datetime.strptime(event_data['end_time'], '%H:%M').time()))
                else:
                    day_map = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6}
                    day_of_week = day_map.get(event_data['Day'])
                    if day_of_week is None: continue

                    first_day = SEMESTER_START_DATE
                    while first_day.weekday() != day_of_week:
                        first_day += timedelta(days=1)
                    
                    start_time = datetime.strptime(event_data['start_time'], '%H:%M').time()
                    end_time = datetime.strptime(event_data['end_time'], '%H:%M').time()
                    start_dt = TIMEZONE.localize(datetime.combine(first_day, start_time))
                    end_dt = TIMEZONE.localize(datetime.combine(first_day, end_time))
                    
                    # Set recurrence rule
                    until_date = SEMESTER_END_DATE.strftime("%Y%m%dT%H%M%SZ")
                    event_data['rrule'] = f"FREQ=WEEKLY;UNTIL={until_date}"

                event_data['start_dt'] = start_dt
                event_data['end_dt'] = end_dt

                add_event_to_calendar(service, event_data)
            
            print("\nSuccess! Your schedule has been added to your Google Calendar.")
        else:
            print("\nAborted. No events were added to your calendar.")

    except FileNotFoundError as e:
        print(f"\n{e}")
    except Exception as e:
        print(f"\nAn error occurred: {e}")

if __name__ == '__main__':
    main()
