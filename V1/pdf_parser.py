import pdfplumber

def parse_pdf(pdf_path):
    schedule_data = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            for line in text.split("\n"):
                # Parse each line and extract relevant data
                # Example: Split by spaces or use regex to extract Module, Group, etc.
                if "COS" in line:  # Example condition to filter relevant lines
                    schedule_data.append(line.strip())
    return schedule_data