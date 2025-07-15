
import pdfplumber
from typing import Literal

def get_pdf_type(file_path: str) -> Literal['weekly', 'test', 'unknown']:
    """
    Determines the type of schedule PDF by scanning its content for keywords.

    Args:
        file_path: The absolute path to the PDF file.

    Returns:
        'weekly', 'test', or 'unknown' based on the content.
    """
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                if "Semester Tests" in text:
                    return "test"
                if "Lectures" in text:
                    return "weekly"
    return "unknown"

