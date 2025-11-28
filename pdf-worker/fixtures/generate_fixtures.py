"""
Script to generate test fixture PDFs for the multi-mode PDF support feature.
Requires: pip install reportlab
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import os


def create_lecture_pdf(filename='lecture-schedule.pdf'):
    """
    Creates a lecture schedule PDF with 'Lectures' header text.
    """
    doc = SimpleDocTemplate(filename, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Add header text "Lectures" in top-left
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.black,
        spaceAfter=20,
    )
    title = Paragraph("Lectures", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.2 * inch))
    
    # Create table data
    data = [
        ['Module', 'Offered', 'Group', 'Lang', 'Activity', 'Day', 'Time', 'Venue', 'Campus'],
        ['COS 214', 'S2', 'G01', 'E L', 'L1\nL2\nL3\nL4', 
         'Monday\nTuesday\nThursday\nFriday',
         '08:30 - 09:20\n07:30 - 08:20\n09:30 - 10:20\n12:30 - 13:20',
         'Centenary 6\nIT 4-4\nIT 4-4\nIT 4-4', 'HATFIELD'],
        ['COS 284', 'S2', 'G01', 'E L', 'L1\nL2',
         'Wednesday\nFriday',
         '10:30 - 11:20\n14:30 - 15:20',
         'IT 4-5\nIT 4-5', 'HATFIELD'],
        ['COS 301', 'S1', 'G01', 'E', 'L1',
         'Monday',
         '08:30 - 09:20',
         'IT 4-4', 'HATFIELD'],
    ]
    
    # Create table
    table = Table(data, colWidths=[0.8*inch, 0.6*inch, 0.5*inch, 0.5*inch, 
                                    0.8*inch, 1.2*inch, 1.5*inch, 1.2*inch, 0.9*inch])
    
    # Style the table
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    elements.append(table)
    doc.build(elements)
    print(f"Created {filename}")


def create_test_pdf(filename='test-schedule.pdf'):
    """
    Creates a test schedule PDF with 'Semester Tests' header text.
    """
    doc = SimpleDocTemplate(filename, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Add header text "Semester Tests" in top-left
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.black,
        spaceAfter=20,
    )
    title = Paragraph("Semester Tests", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.2 * inch))
    
    # Create table data
    data = [
        ['Module', 'Test', 'Day', 'Date', 'Time', 'Campus', 'Venue'],
        ['COS 284', 'Test1', 'Saturday', '23 Aug 2025', '10:00 - 11:30', 'HATFIELD',
         'Informatorium Blue Lab 1\nInformatorium Blue Lab 2\nInformatorium Blue Lab 3\nInformatorium Red Lab\nInformatorium Green Lab'],
        ['COS 214', 'Test1', 'Friday', '15 Aug 2025', '08:30 - 10:30', 'HATFIELD',
         'IT 4-4\nIT 4-5'],
        ['COS 301', 'Test1', 'Monday', '10 Aug 2025', '08:30 - 10:30', 'HATFIELD',
         'IT 4-4'],
    ]
    
    # Create table
    table = Table(data, colWidths=[0.8*inch, 0.7*inch, 0.9*inch, 1.0*inch, 
                                    1.2*inch, 0.9*inch, 2.5*inch])
    
    # Style the table
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    elements.append(table)
    doc.build(elements)
    print(f"Created {filename}")


def create_exam_pdf(filename='exam-schedule.pdf'):
    """
    Creates an exam schedule PDF with 'Exams' header text.
    """
    doc = SimpleDocTemplate(filename, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Add header text "Exams" in top-left
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.black,
        spaceAfter=20,
    )
    title = Paragraph("Exams", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.2 * inch))
    
    # Create table data
    data = [
        ['Status', 'Module', 'Paper', 'Activity', 'Date', 'Start Time',
         'Module Campus', 'Exam Campus', 'Venue', 'Exam Comments'],
        ['FINAL', 'COS 284', '1', 'Exam\nWritten', '12 NOV 2025', '07:30',
         'HATF', 'HATFIELD', 'IT Building CBT Labs\n1,2,3', ''],
        ['FINAL', 'COS 214', '1', 'Exam\nWritten', '15 NOV 2025', '08:00',
         'HATF', 'HATFIELD', 'Exam Hall A\nSeats 1-50', ''],
        ['FINAL', 'COS 301', '1', 'Exam\nWritten', '20 NOV 2025', '14:00',
         'HATF', 'HATFIELD', 'Unfinalised', ''],
    ]
    
    # Create table
    table = Table(data, colWidths=[0.6*inch, 0.7*inch, 0.5*inch, 0.7*inch,
                                    1.0*inch, 0.8*inch, 0.8*inch, 0.8*inch,
                                    1.8*inch, 0.8*inch])
    
    # Style the table
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    elements.append(table)
    doc.build(elements)
    print(f"Created {filename}")


def create_invalid_pdf(filename='invalid-format.pdf'):
    """
    Creates a PDF without any valid mode keywords.
    """
    doc = SimpleDocTemplate(filename, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Add header text that doesn't match any mode
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.black,
        spaceAfter=20,
    )
    title = Paragraph("Random Schedule Document", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.2 * inch))
    
    # Create table with non-standard columns
    data = [
        ['Column1', 'Column2', 'Column3', 'Column4'],
        ['Data1', 'Data2', 'Data3', 'Data4'],
        ['Data5', 'Data6', 'Data7', 'Data8'],
    ]
    
    # Create table
    table = Table(data, colWidths=[2*inch, 2*inch, 2*inch, 2*inch])
    
    # Style the table
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(table)
    doc.build(elements)
    print(f"Created {filename}")


def main():
    """Generate all fixture PDFs."""
    # Create fixtures directory if it doesn't exist
    os.makedirs('pdf-worker/fixtures', exist_ok=True)
    
    # Change to fixtures directory
    os.chdir('pdf-worker/fixtures')
    
    print("Generating PDF fixtures...")
    create_lecture_pdf()
    create_test_pdf()
    create_exam_pdf()
    create_invalid_pdf()
    print("\nAll fixtures created successfully!")
    print("\nGenerated files:")
    print("  - lecture-schedule.pdf")
    print("  - test-schedule.pdf")
    print("  - exam-schedule.pdf")
    print("  - invalid-format.pdf")


if __name__ == '__main__':
    main()
