from icalendar import Calendar, Event
from datetime import datetime, timedelta, time
import pytz

def generate_preview_ics(schedule_data, start_date):
    cal = Calendar()
    cal.add("prodid", "-//University Schedule//mxm.dk//")
    cal.add("version", "2.0")

    tz = pytz.timezone("Africa/Johannesburg")  # Adjust timezone as needed

    for entry in schedule_data:
        # Parse entry (e.g., split by spaces or regex)
        module, group, activity, day, time_range, venue = parse_entry(entry)

        # Calculate the next occurrence of the event (starting from next Monday)
        event_date = get_next_weekday(start_date, day)

        # Create event
        event = Event()
        event.add("summary", f"{module} {activity} (Group {group})")
        event.add("location", venue)
        event.add("description", f"Module: {module}\nGroup: {group}\nActivity: {activity}")

        # Set start/end datetime
        start_time, end_time = parse_time_range(time_range)
        start_datetime = tz.localize(datetime.combine(event_date, start_time))
        end_datetime = tz.localize(datetime.combine(event_date, end_time))
        event.add("dtstart", start_datetime)
        event.add("dtend", end_datetime)

        # Add event to calendar
        cal.add_component(event)

    # Save the .ics file
    with open("preview_schedule.ics", "wb") as f:
        f.write(cal.to_ical())
    print("Preview schedule generated: preview_schedule.ics")

def generate_full_schedule_ics(schedule_data, start_date, end_date):
    cal = Calendar()
    cal.add("prodid", "-//University Schedule//mxm.dk//")
    cal.add("version", "2.0")

    tz = pytz.timezone("Africa/Johannesburg")  # Adjust timezone as needed

    for entry in schedule_data:
        # Parse entry (e.g., split by spaces or regex)
        module, group, activity, day, time_range, venue = parse_entry(entry)

        # Calculate the first occurrence of the event
        first_occurrence = get_next_weekday(start_date, day)

        # Create event
        event = Event()
        event.add("summary", f"{module} {activity} (Group {group})")
        event.add("location", venue)
        event.add("description", f"Module: {module}\nGroup: {group}\nActivity: {activity}")

        # Set start/end datetime
        start_time, end_time = parse_time_range(time_range)
        start_datetime = tz.localize(datetime.combine(first_occurrence, start_time))
        end_datetime = tz.localize(datetime.combine(first_occurrence, end_time))
        event.add("dtstart", start_datetime)
        event.add("dtend", end_datetime)

        # Add recurrence rule (weekly until END_DATE)
        event.add("rrule", {
            "FREQ": "WEEKLY",
            "UNTIL": datetime.combine(end_date, datetime.max.time()),
            "WKST": "MO"
        })

        # Add event to calendar
        cal.add_component(event)

    # Save the .ics file
    with open("full_schedule.ics", "wb") as f:
        f.write(cal.to_ical())
    print("Full schedule generated: full_schedule.ics")