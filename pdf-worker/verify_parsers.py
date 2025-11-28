#!/usr/bin/env python3
"""
Verification script for existing lecture and test parsers.
This script tests _parse_weekly_schedule() and _parse_test_schedule()
to ensure they still work correctly after the multi-mode changes.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from parser.pdf_parser import parse_pdf, _parse_weekly_schedule, _parse_test_schedule
from parser.utils import get_pdf_type
from parser.data_processor import process_events


def verify_lecture_parser():
    """Verify that the lecture parser works correctly."""
    print("=" * 60)
    print("VERIFYING LECTURE PARSER (_parse_weekly_schedule)")
    print("=" * 60)
    
    # Test with sample lecture data
    sample_lecture_table = [
        [
            ['Module', 'Offered', 'Group', 'Activity', 'Day', 'Time', 'Venue', 'Lang'],
            ['COS 214', 'S1', 'G01', 'Lecture', 'Monday\nWednesday', '08:30-10:20', 'IT 4-4', 'E'],
            ['COS 214', 'S1', 'G01', 'Practical', 'Tuesday', '14:00-16:00', 'IT Lab 1', 'E'],
        ]
    ]
    
    try:
        events = _parse_weekly_schedule(sample_lecture_table)
        print(f"✓ Successfully parsed {len(events)} lecture events")
        
        # Verify multi-day splitting (Monday\nWednesday should create 2 events)
        cos214_lectures = [e for e in events if e.get('Activity') == 'Lecture']
        if len(cos214_lectures) == 2:
            print("✓ Multi-day lecture splitting works correctly (2 events from Monday\\nWednesday)")
        else:
            print(f"✗ Multi-day splitting failed: expected 2 events, got {len(cos214_lectures)}")
            return False
        
        # Verify required fields are present
        required_fields = ['Module', 'Activity', 'Group', 'Day', 'Time', 'Venue']
        for event in events:
            missing_fields = [f for f in required_fields if f not in event or not event[f]]
            if missing_fields:
                print(f"✗ Event missing required fields: {missing_fields}")
                return False
        print(f"✓ All {len(events)} events have required fields: {', '.join(required_fields)}")
        
        # Process events to verify they work with data processor
        processed = process_events(events)
        print(f"✓ Data processor successfully processed {len(processed)} lecture events")
        
        # Verify isRecurring flag is set correctly
        recurring_count = sum(1 for e in processed if e.get('isRecurring') == True)
        if recurring_count == len(processed):
            print(f"✓ All {len(processed)} lecture events are marked as recurring")
        else:
            print(f"✗ Not all lecture events marked as recurring: {recurring_count}/{len(processed)}")
            return False
        
        print("\n✓ LECTURE PARSER VERIFICATION PASSED\n")
        return True
        
    except Exception as e:
        print(f"✗ Lecture parser failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


def verify_test_parser():
    """Verify that the test parser works correctly."""
    print("=" * 60)
    print("VERIFYING TEST PARSER (_parse_test_schedule)")
    print("=" * 60)
    
    # Test with sample test data
    sample_test_table = [
        [
            ['Module', 'Test', 'Date', 'Time', 'Venue'],
            ['COS 214', 'Test 1', '15 Aug 2025', '08:30-10:30', 'IT 4-4\nIT 4-5'],
            ['COS 214', 'Test 2', '22 Sep 2025', '14:00-16:00', 'Exam Hall A'],
        ]
    ]
    
    try:
        events = _parse_test_schedule(sample_test_table)
        print(f"✓ Successfully parsed {len(events)} test events")
        
        # Verify multi-venue splitting (IT 4-4\nIT 4-5 should create 2 events)
        test1_events = [e for e in events if e.get('Test') == 'Test 1']
        if len(test1_events) == 2:
            print("✓ Multi-venue test splitting works correctly (2 events from IT 4-4\\nIT 4-5)")
        else:
            print(f"✗ Multi-venue splitting failed: expected 2 events, got {len(test1_events)}")
            return False
        
        # Verify required fields are present
        required_fields = ['Module', 'Test', 'Date', 'Time', 'Venue']
        for event in events:
            missing_fields = [f for f in required_fields if f not in event or not event[f]]
            if missing_fields:
                print(f"✗ Event missing required fields: {missing_fields}")
                return False
        print(f"✓ All {len(events)} events have required fields: {', '.join(required_fields)}")
        
        # Process events to verify they work with data processor
        processed = process_events(events)
        print(f"✓ Data processor successfully processed {len(processed)} test events")
        
        # Verify isRecurring flag is set correctly
        non_recurring_count = sum(1 for e in processed if e.get('isRecurring') == False)
        if non_recurring_count == len(processed):
            print(f"✓ All {len(processed)} test events are marked as non-recurring")
        else:
            print(f"✗ Not all test events marked as non-recurring: {non_recurring_count}/{len(processed)}")
            return False
        
        print("\n✓ TEST PARSER VERIFICATION PASSED\n")
        return True
        
    except Exception as e:
        print(f"✗ Test parser failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


def verify_no_weekly_references():
    """Verify that there are no hardcoded 'weekly' references in the parser code."""
    print("=" * 60)
    print("CHECKING FOR HARDCODED 'weekly' REFERENCES")
    print("=" * 60)
    
    files_to_check = [
        'parser/pdf_parser.py',
        'parser/utils.py',
        'parser/data_processor.py',
    ]
    
    found_weekly = False
    for filepath in files_to_check:
        full_path = os.path.join(os.path.dirname(__file__), filepath)
        if os.path.exists(full_path):
            with open(full_path, 'r') as f:
                content = f.read()
                if "'weekly'" in content or '"weekly"' in content:
                    print(f"✗ Found 'weekly' reference in {filepath}")
                    found_weekly = True
                else:
                    print(f"✓ No 'weekly' references in {filepath}")
    
    if not found_weekly:
        print("\n✓ NO HARDCODED 'weekly' REFERENCES FOUND\n")
        return True
    else:
        print("\n✗ FOUND HARDCODED 'weekly' REFERENCES\n")
        return False


def main():
    """Run all verification tests."""
    print("\n" + "=" * 60)
    print("PARSER VERIFICATION SUITE")
    print("Task 8: Verify existing lecture and test parsers")
    print("=" * 60 + "\n")
    
    results = []
    
    # Run verification tests
    results.append(("Lecture Parser", verify_lecture_parser()))
    results.append(("Test Parser", verify_test_parser()))
    results.append(("No 'weekly' References", verify_no_weekly_references()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{name}: {status}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n✓✓✓ ALL VERIFICATIONS PASSED ✓✓✓\n")
        print("Requirements verified:")
        print("  - 1.2: Lecture events have required fields")
        print("  - 1.3: Lecture events are recurring")
        print("  - 1.4: Multi-day lecture splitting")
        print("  - 2.2: Test events have required fields")
        print("  - 2.3: Test events are non-recurring")
        print("  - 2.4: Multi-venue test splitting")
        print("  - No hardcoded 'weekly' references")
        return 0
    else:
        print("\n✗✗✗ SOME VERIFICATIONS FAILED ✗✗✗\n")
        return 1


if __name__ == '__main__':
    sys.exit(main())
