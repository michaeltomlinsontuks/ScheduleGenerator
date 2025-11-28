import pdfplumber
from typing import Literal


def get_pdf_type(file_path: str) -> Literal['lecture', 'test', 'exam', 'unknown']:
    """
    Determines the type of schedule PDF by scanning the first page
    for mode-identifying keywords.
    
    Args:
        file_path: The absolute path to the PDF file.
    
    Returns:
        'lecture', 'test', 'exam', or 'unknown' based on content.
    """
    with pdfplumber.open(file_path) as pdf:
        if len(pdf.pages) == 0:
            return 'unknown'
        
        # Only check first page for efficiency
        first_page = pdf.pages[0]
        text = first_page.extract_text()
        
        if not text:
            return 'unknown'
        
        # Check for mode keywords (order matters for specificity)
        # Note: Check "Semester Tests" before "Exams" to avoid false positives
        if "Semester Tests" in text:
            return 'test'
        if "Exams" in text:
            return 'exam'
        if "Lectures" in text:
            return 'lecture'
        
        return 'unknown'
