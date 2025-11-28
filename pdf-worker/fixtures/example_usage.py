"""
Example usage of test fixtures in unit tests.
This file demonstrates how to use the fixtures in your test suite.
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from parser.utils import get_pdf_type
from parser.pdf_parser import parse_pdf
from fixtures.sample_tables import (
    LECTURE_TABLE,
    TEST_TABLE,
    EXAM_TABLE,
    INVALID_TABLE,
    EXAM_TABLE_UNFINALISED,
)


def example_using_pdf_files():
    """Example: Using actual PDF files in tests."""
    fixtures_dir = os.path.dirname(__file__)
    
    # Test lecture PDF
    lecture_pdf = os.path.join(fixtures_dir, 'lecture-schedule.pdf')
    pdf_type = get_pdf_type(lecture_pdf)
    assert pdf_type == 'lecture'
    
    result = parse_pdf(lecture_pdf)
    assert result['type'] == 'lecture'
    assert len(result['events']) > 0
    print(f"✓ Lecture PDF: {len(result['events'])} events parsed")
    
    # Test test PDF
    test_pdf = os.path.join(fixtures_dir, 'test-schedule.pdf')
    pdf_type = get_pdf_type(test_pdf)
    assert pdf_type == 'test'
    
    result = parse_pdf(test_pdf)
    assert result['type'] == 'test'
    assert len(result['events']) > 0
    print(f"✓ Test PDF: {len(result['events'])} events parsed")
    
    # Test exam PDF
    exam_pdf = os.path.join(fixtures_dir, 'exam-schedule.pdf')
    pdf_type = get_pdf_type(exam_pdf)
    assert pdf_type == 'exam'
    
    result = parse_pdf(exam_pdf)
    assert result['type'] == 'exam'
    assert len(result['events']) > 0
    print(f"✓ Exam PDF: {len(result['events'])} events parsed")
    
    # Test invalid PDF
    invalid_pdf = os.path.join(fixtures_dir, 'invalid-format.pdf')
    pdf_type = get_pdf_type(invalid_pdf)
    assert pdf_type == 'unknown'
    print("✓ Invalid PDF: correctly detected as unknown")


def example_using_table_data():
    """Example: Using table data structures in tests."""
    from parser.pdf_parser import _parse_weekly_schedule, _parse_test_schedule, _parse_exam_schedule
    
    # Test lecture parser with fixture data
    lecture_events = _parse_weekly_schedule([LECTURE_TABLE])
    assert len(lecture_events) > 0
    print(f"✓ Lecture table: {len(lecture_events)} events parsed")
    
    # Test test parser with fixture data
    test_events = _parse_test_schedule([TEST_TABLE])
    assert len(test_events) > 0
    print(f"✓ Test table: {len(test_events)} events parsed")
    
    # Test exam parser with fixture data
    exam_events = _parse_exam_schedule([EXAM_TABLE])
    assert len(exam_events) > 0
    print(f"✓ Exam table: {len(exam_events)} events parsed")
    
    # Test unfinalised exam detection
    unfinalised_events = _parse_exam_schedule([EXAM_TABLE_UNFINALISED])
    assert len(unfinalised_events) > 0
    # Check that at least one event has "Unfinalised" or "TBA" in venue
    has_unfinalised = any(
        'Unfinalised' in event.get('Venue', '') or 'TBA' in event.get('Venue', '')
        for event in unfinalised_events
    )
    assert has_unfinalised
    print(f"✓ Unfinalised exam table: {len(unfinalised_events)} events parsed")


def example_property_based_test():
    """
    Example: Property-based test pattern.
    
    This demonstrates how you might structure a property-based test
    using the fixtures as a starting point.
    """
    from parser.pdf_parser import _parse_weekly_schedule, _parse_test_schedule, _parse_exam_schedule
    
    # Property: All lecture events should have a 'Day' field
    lecture_events = _parse_weekly_schedule([LECTURE_TABLE])
    for event in lecture_events:
        assert 'Day' in event, f"Event missing 'Day' field: {event}"
    print("✓ Property: All lecture events have 'Day' field")
    
    # Property: All test events should have a 'Date' field
    test_events = _parse_test_schedule([TEST_TABLE])
    for event in test_events:
        assert 'Date' in event, f"Event missing 'Date' field: {event}"
    print("✓ Property: All test events have 'Date' field")
    
    # Property: All exam events should have a 'Start Time' field
    exam_events = _parse_exam_schedule([EXAM_TABLE])
    for event in exam_events:
        assert 'Start Time' in event, f"Event missing 'Start Time' field: {event}"
    print("✓ Property: All exam events have 'Start Time' field")


if __name__ == '__main__':
    print("=" * 60)
    print("Example: Using PDF Files")
    print("=" * 60)
    example_using_pdf_files()
    
    print("\n" + "=" * 60)
    print("Example: Using Table Data")
    print("=" * 60)
    example_using_table_data()
    
    print("\n" + "=" * 60)
    print("Example: Property-Based Test Pattern")
    print("=" * 60)
    example_property_based_test()
    
    print("\n" + "=" * 60)
    print("✓ All examples completed successfully!")
    print("=" * 60)
