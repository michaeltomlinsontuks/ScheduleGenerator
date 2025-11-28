"""
Sample table data for testing PDF parsers.
Based on actual UP schedule PDF structures.
"""

# Lecture Schedule Table
# Header text: "Lectures"
# Multi-day entries with newline-separated values
LECTURE_TABLE = [
    [
        'Module', 'Offered', 'Group', 'Lang', 'Activity', 
        'Day', 'Time', 'Venue', 'Campus', 'Study Prog'
    ],
    [
        'COS 214', 'S2', 'G01', 'E L', 'L1\nL2\nL3\nL4',
        'Monday\nTuesday\nThursday\nFriday',
        '08:30 - 09:20\n07:30 - 08:20\n09:30 - 10:20\n12:30 - 13:20',
        'Centenary 6\nIT 4-4\nIT 4-4\nIT 4-4',
        'HATFIELD', 'BSc Information and Knowledge Systems'
    ],
    [
        'COS 284', 'S2', 'G01', 'E L', 'L1\nL2',
        'Wednesday\nFriday',
        '10:30 - 11:20\n14:30 - 15:20',
        'IT 4-5\nIT 4-5',
        'HATFIELD', 'BSc Computer Science'
    ],
]

# Test Schedule Table
# Header text: "Semester Tests"
# Multi-venue entries with newline-separated venues
TEST_TABLE = [
    [
        'Module', 'Test', 'Day', 'Date', 'Time', 'Campus', 'Venue'
    ],
    [
        'COS 284', 'Test1', 'Saturday', '23 Aug 2025', '10:00 - 11:30',
        'HATFIELD',
        'Informatorium Blue Lab 1\nInformatorium Blue Lab 2\nInformatorium Blue Lab 3\nInformatorium Red Lab\nInformatorium Green Lab'
    ],
    [
        'COS 214', 'Test1', 'Friday', '15 Aug 2025', '08:30 - 10:30',
        'HATFIELD', 'IT 4-4\nIT 4-5'
    ],
]

# Exam Schedule Table
# Header text: "Exams"
# Venue has building + room details (should be combined, not split)
EXAM_TABLE = [
    [
        'Status', 'Module', 'Paper', 'Activity', 'Date', 'Start Time',
        'Module Campus', 'Exam Campus', 'Venue', 'Exam Comments'
    ],
    [
        'FINAL', 'COS 284', '1', 'Exam\nWritten', '12 NOV 2025', '07:30',
        'HATF', 'HATFIELD', 'IT Building CBT Labs\n1,2,3', ''
    ],
    [
        'FINAL', 'COS 214', '1', 'Exam\nWritten', '15 NOV 2025', '08:00',
        'HATF', 'HATFIELD', 'Exam Hall A\nSeats 1-50', ''
    ],
]

# Invalid format table (missing required columns)
INVALID_TABLE = [
    ['Column1', 'Column2', 'Column3'],
    ['Data1', 'Data2', 'Data3'],
]

# Exam with unfinalised venue
EXAM_TABLE_UNFINALISED = [
    [
        'Status', 'Module', 'Paper', 'Activity', 'Date', 'Start Time',
        'Module Campus', 'Exam Campus', 'Venue', 'Exam Comments'
    ],
    [
        'FINAL', 'COS 301', '1', 'Exam\nWritten', '20 NOV 2025', '14:00',
        'HATF', 'HATFIELD', 'Unfinalised', ''
    ],
    [
        'FINAL', 'COS 332', '1', 'Exam\nWritten', 'TBA', '08:00',
        'HATF', 'HATFIELD', 'TBA', ''
    ],
]

# Lecture with single day (edge case)
LECTURE_TABLE_SINGLE_DAY = [
    [
        'Module', 'Offered', 'Group', 'Lang', 'Activity', 
        'Day', 'Time', 'Venue', 'Campus', 'Study Prog'
    ],
    [
        'COS 301', 'S1', 'G01', 'E', 'L1',
        'Monday',
        '08:30 - 09:20',
        'IT 4-4',
        'HATFIELD', 'BSc Computer Science'
    ],
]

# Test with single venue (edge case)
TEST_TABLE_SINGLE_VENUE = [
    [
        'Module', 'Test', 'Day', 'Date', 'Time', 'Campus', 'Venue'
    ],
    [
        'COS 301', 'Test1', 'Monday', '10 Aug 2025', '08:30 - 10:30',
        'HATFIELD', 'IT 4-4'
    ],
]
