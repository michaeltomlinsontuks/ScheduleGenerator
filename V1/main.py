from pdf_parser import parse_pdf
from ics_generator import generate_preview_ics, generate_full_schedule_ics
from utils import get_next_monday, get_semester_end_date

def main():
    # Step 1: Parse the PDF
    pdf_path = input("Enter the path to the PDF file: ")
    schedule_data = parse_pdf(pdf_path)

    # Step 2: Generate preview for one week
    start_date = get_next_monday()
    generate_preview_ics(schedule_data, start_date)

    # Step 3: Prompt user for approval
    if prompt_user_approval():
        # Step 4: Generate full semester schedule
        end_date = get_semester_end_date(start_date)  # Define this function in utils.py
        generate_full_schedule_ics(schedule_data, start_date, end_date)
    else:
        print("Preview not approved. Exiting.")

if __name__ == "__main__":
    main()