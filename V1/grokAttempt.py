from ics import Calendar, Event
from datetime import datetime, timedelta
import pandas as pd

# Load the Excel file
excel_file = pd.ExcelFile("finalSchedule.xlsx")

# Read the relevant sheets
lectures_df = pd.read_excel(excel_file, sheet_name="Lectures")
semester_dates_df = pd.read_excel(excel_file, sheet_name="SemesterDates")

# Get semester start and end dates (no timezone)
semester_start = pd.to_datetime(semester_dates_df["Semester Start Date"][0])
semester_end = pd.to_datetime(semester_dates_df["Semester End Date"][0])

# Create a new calendar
cal = Calendar()

# Day mapping for weekday calculation
day_map = {
    "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
    "Friday": 4, "Saturday": 5, "Sunday": 6
}

# Process each row in the Lectures sheet
for index, row in lectures_df.iterrows():
    # Parse start and end times
    start_time = datetime.strptime(str(row["Start Time"]), "%H:%M:%S")
    end_time = datetime.strptime(str(row["End Time"]), "%H:%M:%S")

    # Adjust times by subtracting 2 hours
    start_time_adjusted = (start_time - timedelta(hours=2)).time()
    end_time_adjusted = (end_time - timedelta(hours=2)).time()

    # Calculate the first occurrence from semester start
    first_date = semester_start
    target_day = day_map[row["Day"]]  # e.g., Monday = 0
    semester_start_day = semester_start.weekday()  # 0 = Monday
    days_to_add = (target_day - semester_start_day) % 7
    current_date = first_date + timedelta(days=days_to_add)

    # Generate an event for each week until semester end
    while current_date <= semester_end:
        # Combine date and time (no timezone)
        event_start = datetime.combine(current_date, start_time_adjusted)
        event_end = datetime.combine(current_date, end_time_adjusted)

        # Create an event
        event = Event()
        event.name = f"{row['Module']} {row['Activity']} ({row['Group']})"
        event.begin = event_start
        event.end = event_end
        event.location = row["Venue"]

        # Add event to calendar (no recurrence, no timezone)
        cal.events.add(event)

        # Move to the next week
        current_date += timedelta(days=7)

# Save to .ics file
with open("schedule.ics", "w") as f:
    f.writelines(cal)

print("ICS file 'schedule.ics' created successfully! Import it into Google Calendar.")