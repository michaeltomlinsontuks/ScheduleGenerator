# University of Pretoria Schedule Generator V1 (Prototype)

## Overview
The University of Pretoria Schedule Generator V1 is a prototype Python-based tool designed to convert UP class schedules from PDF format into importable calendar files (.ics format). This version serves as a proof-of-concept and testing ground for developing a more robust V2 system. The program is specifically tailored for University of Pretoria's schedule format and extracts course information including module codes, times, venues, and groups.

**Note: This is a prototype version. V2 is planned as a complete rebuild addressing the limitations and bugs found in V1.**

## Program Goals
- **Prototype UP Schedule Conversion**: Test approaches for converting University of Pretoria PDF timetables into digital calendar format
- **Prevent Calendar Import Errors**: Develop preview functionality to avoid mass creation of incorrect events in Google Calendar
- **Personal Schedule Management**: Create foundation for streamlined personal class schedule organization for UP students
- **Google Calendar Integration**: Generate .ics files for easy Google Calendar import (with future Google Apps Script automation planned)
- **Learning Platform**: Serve as testing ground for V2 development

## Core Features (Prototype Status)
1. **UP PDF Parsing**: Initial attempt at extracting schedule data from University of Pretoria PDF timetables (table format)
2. **PDF-to-Excel Conversion**: Prototype conversion from PDF table data to Excel format for easier parsing
3. **Preview Generation**: Basic one-week preview to verify accuracy before full import
4. **Full Schedule Generation**: Generate complete semester-long recurring events
5. **Google Calendar Ready**: Output .ics files optimized for Google Calendar import
6. **Configurable Semester Length**: Variable semester duration settings

## Known Limitations (To Be Addressed in V2)
- **Incomplete PDF Parsing**: Direct PDF processing needs significant improvement
- **Manual Excel Conversion**: PDF-to-Excel conversion is currently manual
- **Missing Functions**: Some referenced functions are not fully implemented
- **Time Adjustment Issues**: Contains outdated time correction code
- **Limited Error Handling**: Minimal validation and error recovery
- **No User Interface**: Command-line only with limited user interaction

## Requirements

### System Requirements
- Python 3.7 or higher
- macOS, Windows, or Linux operating system

### Python Dependencies
The following packages are required (should be added to requirements.txt):
```
pdfplumber>=1.0.0
icalendar>=4.0.0
pandas>=1.3.0
pytz>=2021.1
ics>=0.7.0
PyMuPDF>=1.18.0
openpyxl>=3.0.0
```

### Input File Requirements
- **PDF Files**: University-generated schedule PDFs with structured text
- **Excel Files**: Must contain sheets named "Lectures" and "SemesterDates" with specific column formats
- **Network Access**: None required (operates on local files)

## Installation Instructions

1. **Clone or Download**: Obtain the V1 directory containing all program files
2. **Install Python**: Ensure Python 3.7+ is installed on your system
3. **Install Dependencies**: Run the following command in the V1 directory:
   ```bash
   pip install -r requirements.txt
   ```
   Note: The requirements.txt file needs to be populated with the dependencies listed above.

4. **Verify Installation**: Ensure all Python files are in the same directory:
   - main.py (main program entry point)
   - pdf_parser.py (PDF processing functions)
   - ics_generator.py (calendar file generation)
   - utils.py (utility functions)
   - grokAttempt.py (Excel-based processing)
   - testConverter.py (PDF testing utility)

## Workflow
The intended workflow reflects UP's PDF table format:
1. **University Input**: Start with UP-generated PDF schedule (table format)
2. **Excel Conversion**: Convert PDF to Excel for easier data manipulation
3. **Preview Generation**: Create one-week preview to catch errors before mass import
4. **Verification**: Review preview in calendar to ensure accuracy
5. **Full Generation**: Generate complete semester schedule only after verification
6. **Google Calendar Import**: Import .ics file to Google Calendar (manual currently, Google Apps Script automation planned)

## Usage Instructions (Prototype)

### Current Working Method: Excel Processing
This is the only fully functional workflow in V1:

1. **Manual PDF-to-Excel Conversion**: Manually convert the UP PDF table to Excel format
2. **Prepare Excel File**: Ensure your Excel file has:
   - "Lectures" sheet with columns: Module, Activity, Group, Day, Start Time, End Time, Venue
   - "SemesterDates" sheet with semester start and end dates
3. **Update File Path**: Edit grokAttempt.py to point to your Excel file (hardcoded path)
4. **Run the Script**:
   ```bash
   python grokAttempt.py
   ```
5. **Test Import**: Import the generated "schedule.ics" into Google Calendar to verify
6. **Manual Cleanup**: Fix any errors or time issues manually

### Experimental Methods (Not Fully Functional)
- **Direct PDF Processing (main.py)**: Contains incomplete implementations
- **PDF Analysis (testConverter.py)**: Basic PDF debugging utility

## Configuration Options

### Semester Duration (Variable Setting)
Modify the semester length in utils.py or grokAttempt.py:
- Default: 16 weeks from start date
- Can be adjusted based on UP's academic calendar
- Set as a configurable variable for easy semester-to-semester changes

### UP-Specific Settings
- **Timezone**: Africa/Johannesburg (fixed for UP)
- **Module Codes**: Configured for UP format (COS, STK, SCI, WST, etc.)
- **Time Format**: Handles UP's standard time formatting
- **Venue Codes**: Recognizes UP venue naming conventions

### Google Calendar Optimization
- Events formatted for optimal Google Calendar display
- Time zone handling prevents scheduling conflicts
- Preview system prevents mass incorrect imports

## Troubleshooting

### Common Issues
1. **Missing Dependencies**: Ensure all required packages are installed
2. **PDF Parsing Errors**: Verify PDF contains extractable text (not scanned images)
3. **Date Format Issues**: Ensure dates in Excel files are properly formatted
4. **Import Errors**: Verify .ics files are valid by testing with calendar application

### File Format Requirements
- PDF files must contain structured, extractable text
- Excel files require specific sheet names and column structures
- Input files should use consistent date/time formats

## Support and Maintenance
- Check error messages for specific issues
- Verify input file formats match expected structure
- Test with small sample files before processing full schedules
- Regular updates may be needed for changes in university PDF formats

## Development Status
- **Current State**: Functional prototype for Excel-based processing
- **Limitations**: Multiple incomplete features and manual workarounds required
- **Next Steps**: Complete rebuild planned for V2
- **Lessons Learned**: PDF parsing complexity, need for better error handling, importance of user interface

## Future V2 Enhancements
- **Complete PDF Parsing**: Robust handling of UP's PDF table formats
- **Automated PDF-to-Excel**: Eliminate manual conversion step
- **User Interface**: GUI or improved CLI for better user experience
- **Google Apps Script Integration**: Direct calendar automation
- **Error Handling**: Comprehensive validation and error recovery
- **Configuration Management**: Easy semester and settings configuration
- **Testing Framework**: Automated testing for reliability

## Version Information
- **Version**: 1.0
- **Last Updated**: July 2025
- **Compatibility**: Python 3.7+, major calendar applications
- **Platform**: Cross-platform (Windows, macOS, Linux)
