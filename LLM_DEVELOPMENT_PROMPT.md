# LLM Development Prompt: University of Pretoria Schedule Generator V2

## System Overview
You are tasked with building a complete University of Pretoria Schedule Generator V2 system. This is a rebuild from a V1 prototype that converts UP class schedules from PDF format into Google Calendar-compatible .ics files. The system must be robust, user-friendly, and prevent calendar import disasters through mandatory preview functionality.

## Critical Requirements

### Primary Objectives
1. **Direct PDF Processing**: Parse University of Pretoria PDF schedules without manual conversion
2. **Error Prevention**: Mandatory preview system to prevent mass Google Calendar import errors
3. **User-Friendly**: No manual file editing or code modification required
4. **Google Calendar Ready**: Generate perfect .ics files for seamless import
5. **UP-Specific**: Tailored for University of Pretoria's format and South African timezone

### Input/Output Specifications
- **Input**: UP PDF schedule files (see UP_MOD_XLS.pdf and UP_TST_PDF.pdf in V2 directory)
- **Output**: 
  - Preview .ics file (one week) for validation
  - Full semester .ics file with recurring events
  - Human-readable schedule summary
- **Timezone**: Africa/Johannesburg (South African timezone)
- **Format**: Standard .ics format compatible with Google Calendar

## Technical Architecture

### Core Modules Required
1. **PDF Parser** (`pdf_parser.py`)
   - Extract table data from UP PDF schedules
   - Handle multi-page documents
   - Parse: Module codes, Activity types, Groups, Days, Times, Venues
   - Robust error handling for malformed PDFs

2. **Data Processor** (`data_processor.py`)
   - Validate and clean extracted data
   - Standardize time formats, venue names, day names
   - Handle UP-specific module codes (COS, STK, SCI, WST, etc.)
   - Data quality validation

3. **Calendar Generator** (`calendar_generator.py`)
   - Create .ics calendar events
   - Handle recurring weekly events
   - Timezone management (Africa/Johannesburg)
   - Event formatting for Google Calendar optimization

4. **Preview System** (`preview_generator.py`)
   - Generate one-week preview calendar
   - Create comparison tools
   - Validation reports for user review

5. **Configuration Manager** (`config.py`)
   - Semester date management
   - User preferences
   - UP academic calendar integration
   - Easy semester duration configuration

6. **Main Application** (`main.py`)
   - User interface (CLI with clear prompts)
   - Workflow orchestration
   - Error handling and user feedback
   - Progress indicators

### Technology Stack
- **Python 3.8+**
- **PDF Processing**: Choose between pdfplumber, PyMuPDF, or tabula-py (analyze and recommend)
- **Calendar**: icalendar library for .ics generation
- **Data**: pandas for data manipulation
- **Time**: pytz for timezone handling
- **Config**: JSON or YAML for configuration files
- **Testing**: pytest for comprehensive testing

## PDF Structure Analysis (Critical First Step)

### Sample Files Available
- `UP_MOD_XLS.pdf`: Primary format sample
- `UP_TST_PDF.pdf`: Secondary format sample

### Required Analysis Tasks
1. **Table Structure Mapping**:
   - Identify exact column headers and positions
   - Document table boundaries and multi-page handling
   - Map data fields: Module → Activity → Group → Day → Time → Venue

2. **Data Format Documentation**:
   - Module code patterns (e.g., COS 216, STK 210)
   - Time format variations (e.g., 08:30-10:20, 14:00-15:50)
   - Day name formats (Monday/Mon, etc.)
   - Venue naming conventions
   - Group notation (P01, G01, etc.)

3. **Edge Cases Identification**:
   - Multi-line entries
   - Merged table cells
   - Special characters or encoding issues
   - Split time ranges
   - Missing or incomplete data

## User Workflow Design

### Required User Experience
1. **Simple Startup**:
   ```
   python main.py
   ```

2. **File Selection**:
   - Prompt for PDF file path or file dialog
   - Validate PDF format and readability

3. **Configuration Setup**:
   - Semester start date (with smart defaults)
   - Semester duration (configurable, default 16 weeks)
   - Module filtering options (optional)

4. **Processing & Preview**:
   - Show progress during PDF processing
   - Generate preview .ics for upcoming week
   - Display human-readable preview summary
   - **MANDATORY**: User must approve preview before full generation

5. **Final Generation**:
   - Create full semester .ics file
   - Provide import instructions for Google Calendar
   - Generate backup files and logs

### Error Handling Requirements
- **Graceful PDF failures**: Clear error messages with suggestions
- **Data validation**: Check for missing or malformed schedule data
- **Preview validation**: Ensure preview accurately represents full schedule
- **Import prevention**: Never allow full generation without preview approval
- **Recovery options**: Backup and rollback capabilities

## Implementation Phases

### Phase 1: Foundation (Implement First)
1. **Project Setup**:
   - Create clean directory structure
   - Set up requirements.txt with all dependencies
   - Initialize logging system
   - Create basic configuration framework

2. **PDF Analysis & Parsing**:
   - Analyze provided UP PDF samples thoroughly
   - Document exact table structure and data patterns
   - Implement robust table extraction
   - Create comprehensive test cases

### Phase 2: Core Processing
1. **Data Processing Pipeline**:
   - Clean and validate extracted data
   - Handle UP-specific format requirements
   - Implement data quality checks
   - Create standardization routines

2. **Calendar Generation**:
   - Build .ics event creation system
   - Implement timezone handling
   - Create recurring event logic
   - Optimize for Google Calendar compatibility

### Phase 3: User Interface & Safety
1. **Preview System** (CRITICAL):
   - Generate accurate one-week previews
   - Create clear approval workflow
   - Implement preview validation tools
   - Prevent accidental full generation

2. **User Interface**:
   - Design intuitive CLI prompts
   - Add progress indicators
   - Implement clear error messages
   - Create help and usage information

### Phase 4: Testing & Polish
1. **Comprehensive Testing**:
   - Unit tests for all modules
   - Integration testing with sample PDFs
   - User workflow testing
   - Error condition testing

2. **Documentation & Deployment**:
   - User installation guide
   - Usage documentation
   - Troubleshooting guide
   - Code documentation

## Critical Success Factors

### Must-Have Features
- [ ] **Zero manual file editing**: User should never edit code or config files manually
- [ ] **Mandatory preview**: System MUST require preview approval before full generation
- [ ] **Robust PDF parsing**: Handle UP's specific PDF table format reliably
- [ ] **Perfect Google Calendar import**: Generated .ics files must import flawlessly
- [ ] **Error prevention**: Comprehensive validation to prevent bad calendar imports
- [ ] **Easy configuration**: Semester dates and settings simple to modify
- [ ] **Clear feedback**: User always knows what's happening and what to do next

### Quality Standards
- **Reliability**: System should never crash or produce bad output
- **User Experience**: Complete workflow in under 5 minutes for typical user
- **Data Accuracy**: 100% accuracy in schedule event creation
- **Error Recovery**: Clear paths to fix any issues that arise
- **Future-Proof**: Handle changes in UP PDF formats gracefully

## Development Guidelines

### Code Quality
- **Type hints**: Use Python type annotations throughout
- **Documentation**: Comprehensive docstrings for all functions
- **Error handling**: Try-catch blocks with informative error messages
- **Logging**: Debug logs for troubleshooting, user logs for feedback
- **Testing**: Minimum 80% code coverage with meaningful tests

### File Organization
```
V2/
├── main.py                 # Entry point and workflow orchestration
├── pdf_parser.py          # PDF table extraction and parsing
├── data_processor.py      # Data validation and cleaning
├── calendar_generator.py  # .ics file creation and event management
├── preview_generator.py   # Preview system and validation
├── config.py             # Configuration management
├── utils.py              # Helper functions and utilities
├── requirements.txt      # Python dependencies
├── config/               # Configuration files and templates
├── tests/               # Comprehensive test suite
├── docs/                # User and developer documentation
└── samples/             # Sample input/output files
```

### UP-Specific Considerations
- **Module Codes**: Handle COS (Computer Science), STK (Statistics), SCI (Science), WST (Web Studies), etc.
- **Venue Names**: UP campus locations (IT buildings, labs, etc.)
- **Academic Calendar**: South African semester system
- **Time Zones**: Africa/Johannesburg with daylight saving considerations
- **Language**: English interface with clear, professional terminology

## Testing Requirements

### Test Coverage
- **Unit Tests**: Every function with multiple test cases
- **Integration Tests**: Full workflow with sample PDFs
- **Edge Case Tests**: Malformed PDFs, missing data, network issues
- **User Workflow Tests**: Complete end-to-end scenarios
- **Performance Tests**: Large PDF processing benchmarks

### Sample Data
- Use provided UP_MOD_XLS.pdf and UP_TST_PDF.pdf
- Create mock PDFs for edge case testing
- Generate test .ics files for validation
- Create expected output files for comparison

## Documentation Deliverables

### User Documentation
1. **Installation Guide**: Step-by-step setup instructions
2. **Usage Tutorial**: Complete workflow walkthrough
3. **Troubleshooting**: Common issues and solutions
4. **FAQ**: Frequently asked questions and answers

### Developer Documentation
1. **Code Structure**: Module descriptions and relationships
2. **API Reference**: Function and class documentation
3. **Testing Guide**: How to run and extend tests
4. **Contribution Guide**: How to modify and enhance the system

## Success Validation

### Acceptance Criteria
- [ ] Processes both sample UP PDFs successfully
- [ ] Generates perfect Google Calendar imports
- [ ] Preview system prevents all import errors
- [ ] Complete user workflow under 5 minutes
- [ ] Zero manual configuration required
- [ ] Handles semester date changes easily
- [ ] Comprehensive error handling prevents crashes
- [ ] Clear documentation enables new user success

### Final Deliverable
A complete, production-ready system that any UP student can use to convert their PDF schedule to Google Calendar with confidence, safety, and ease.

## Notes
- This is a personal tool, so broad adaptability is not required
- Focus on UP-specific requirements and format
- The preview system is absolutely critical for preventing calendar disasters
- User experience should be simple and foolproof
- Code quality should be high for maintainability and reliability
