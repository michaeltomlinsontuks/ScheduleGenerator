from datetime import datetime, timedelta

def get_next_monday():
    today = datetime.now().date()
    days_ahead = (0 - today.weekday()) % 7  # 0 = Monday
    return today + timedelta(days=days_ahead)

def get_semester_end_date(start_date):
    # Example: Semester ends 16 weeks after the start date
    return start_date + timedelta(weeks=16)

def parse_time_range(time_range):
    start_str, end_str = time_range.split(" - ")
    start_time = datetime.strptime(start_str, "%H:%M").time()
    end_time = datetime.strptime(end_str, "%H:%M").time()
    return start_time, end_time