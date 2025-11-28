"""
Script to verify that the generated PDF fixtures are valid and parseable.
"""

import sys
import os

# Add parent directory to path to import parser modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from parser.utils import get_pdf_type
from parser.pdf_parser import parse_pdf


def verify_lecture_pdf():
    """Verify lecture schedule PDF."""
    print("\n=== Verifying lecture-schedule.pdf ===")
    pdf_path = os.path.join(os.path.dirname(__file__), 'lecture-schedule.pdf')
    
    # Check type detection
    pdf_type = get_pdf_type(pdf_path)
    print(f"Detected type: {pdf_type}")
    assert pdf_type == 'lecture', f"Expected 'lecture', got '{pdf_type}'"
    
    # Check parsing
    result = parse_pdf(pdf_path)
    print(f"Parsed {len(result['events'])} events")
    print(f"Event type: {result['type']}")
    
    # Verify we got events
    assert len(result['events']) > 0, "No events parsed"
    assert result['type'] == 'lecture', f"Expected type 'lecture', got '{result['type']}'"
    
    # Show first event
    if result['events']:
        print(f"First event: {result['events'][0]}")
    
    print("✓ Lecture PDF verified successfully")


def verify_test_pdf():
    """Verify test schedule PDF."""
    print("\n=== Verifying test-schedule.pdf ===")
    pdf_path = os.path.join(os.path.dirname(__file__), 'test-schedule.pdf')
    
    # Check type detection
    pdf_type = get_pdf_type(pdf_path)
    print(f"Detected type: {pdf_type}")
    assert pdf_type == 'test', f"Expected 'test', got '{pdf_type}'"
    
    # Check parsing
    result = parse_pdf(pdf_path)
    print(f"Parsed {len(result['events'])} events")
    print(f"Event type: {result['type']}")
    
    # Verify we got events
    assert len(result['events']) > 0, "No events parsed"
    assert result['type'] == 'test', f"Expected type 'test', got '{result['type']}'"
    
    # Show first event
    if result['events']:
        print(f"First event: {result['events'][0]}")
    
    print("✓ Test PDF verified successfully")


def verify_exam_pdf():
    """Verify exam schedule PDF."""
    print("\n=== Verifying exam-schedule.pdf ===")
    pdf_path = os.path.join(os.path.dirname(__file__), 'exam-schedule.pdf')
    
    # Check type detection
    pdf_type = get_pdf_type(pdf_path)
    print(f"Detected type: {pdf_type}")
    assert pdf_type == 'exam', f"Expected 'exam', got '{pdf_type}'"
    
    # Check parsing
    result = parse_pdf(pdf_path)
    print(f"Parsed {len(result['events'])} events")
    print(f"Event type: {result['type']}")
    
    # Verify we got events
    assert len(result['events']) > 0, "No events parsed"
    assert result['type'] == 'exam', f"Expected type 'exam', got '{result['type']}'"
    
    # Show first event
    if result['events']:
        print(f"First event: {result['events'][0]}")
    
    print("✓ Exam PDF verified successfully")


def verify_invalid_pdf():
    """Verify invalid format PDF."""
    print("\n=== Verifying invalid-format.pdf ===")
    pdf_path = os.path.join(os.path.dirname(__file__), 'invalid-format.pdf')
    
    # Check type detection
    pdf_type = get_pdf_type(pdf_path)
    print(f"Detected type: {pdf_type}")
    assert pdf_type == 'unknown', f"Expected 'unknown', got '{pdf_type}'"
    
    # Check that parsing raises an error
    try:
        result = parse_pdf(pdf_path)
        print("ERROR: Should have raised ValueError for unknown type")
        assert False, "Expected ValueError for unknown PDF type"
    except ValueError as e:
        print(f"Correctly raised ValueError: {e}")
    
    print("✓ Invalid PDF verified successfully")


def main():
    """Run all verification tests."""
    print("=" * 60)
    print("Verifying PDF Fixtures")
    print("=" * 60)
    
    try:
        verify_lecture_pdf()
        verify_test_pdf()
        verify_exam_pdf()
        verify_invalid_pdf()
        
        print("\n" + "=" * 60)
        print("✓ All fixtures verified successfully!")
        print("=" * 60)
        return 0
    except AssertionError as e:
        print(f"\n✗ Verification failed: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
