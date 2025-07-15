# University of Pretoria Schedule Generator V2 - Development Plan

## Project Overview
V2 is a complete rebuild of the schedule generator, addressing all limitations found in the V1 prototype. The goal is to create a robust, user-friendly system that can directly process UP PDF schedules and automatically integrate with Google Calendar.

## Lessons Learned from V1
- **PDF parsing is complex**: Direct table extraction from PDFs requires sophisticated parsing
- **Manual processes are error-prone**: Need to automate PDF-to-Excel conversion
- **Error handling is critical**: Must prevent mass calendar import disasters
- **User experience matters**: Need better interface than command-line editing
- **Preview functionality is essential**: Absolutely critical before full import
- **Configuration should be easy**: Semester dates, duration should be simple to set

## Development Phases

### Phase 1: Foundation & Analysis (Week 1-2)
**Goal**: Understand UP PDF structure and set up robust foundation

#### Step 1.1: PDF Structure Analysis
- [ ] Analyze both UP_MOD_XLS.pdf and UP_TST_PDF.pdf in detail
- [ ] Document exact table structure, column headers, and data formats
- [ ] Identify patterns in module codes, time formats, venue names
- [ ] Map relationship between PDF structure and required calendar data
- [ ] Create test data extraction samples

#### Step 1.2: Technology Stack Selection
- [ ] Choose PDF parsing library (compare pdfplumber vs PyMuPDF vs tabula-py)
- [ ] Select calendar library (icalendar vs ics - determine best for Google Calendar)
- [ ] Decide on configuration format (JSON, YAML, or Python config)
- [ ] Choose testing framework (pytest)
- [ ] Plan project structure and module organization

#### Step 1.3: Project Setup
- [ ] Create clean V2 directory structure
- [ ] Set up virtual environment
- [ ] Create comprehensive requirements.txt
- [ ] Initialize git repository for V2
- [ ] Set up logging framework
- [ ] Create configuration management system

### Phase 2: Core PDF Processing (Week 3-4)
**Goal**: Build robust PDF parsing that can handle UP's table format

#### Step 2.1: PDF Table Extraction
- [ ] Implement table detection and extraction
- [ ] Handle multi-page schedules
- [ ] Parse table headers and map to data fields
- [ ] Extract: Module, Activity, Group, Day, Time, Venue
- [ ] Handle edge cases (merged cells, split times, special characters)

#### Step 2.2: Data Validation & Cleaning
- [ ] Validate extracted module codes (COS, STK, etc.)
- [ ] Parse and validate time formats
- [ ] Standardize venue names
- [ ] Handle day name variations (Mon/Monday, etc.)
- [ ] Implement data quality checks

#### Step 2.3: Testing Framework
- [ ] Create unit tests for PDF parsing
- [ ] Test with both sample PDFs
- [ ] Create mock data for edge case testing
- [ ] Implement regression testing
- [ ] Add performance benchmarks

### Phase 3: Calendar Generation Engine (Week 5-6)
**Goal**: Create reliable calendar file generation with proper error handling

#### Step 3.1: Calendar Event Creation
- [ ] Design event data structure
- [ ] Implement timezone handling (Africa/Johannesburg)
- [ ] Create recurring event logic
- [ ] Handle semester date calculations
- [ ] Format events for optimal Google Calendar display

#### Step 3.2: Preview System
- [ ] Generate single-week preview calendars
- [ ] Create preview validation tools
- [ ] Implement preview comparison with full schedule
- [ ] Add preview export in multiple formats (.ics, human-readable)

#### Step 3.3: Full Schedule Generation
- [ ] Implement semester-long recurring events
- [ ] Handle academic calendar integration
- [ ] Add holiday/break exclusions
- [ ] Create schedule conflict detection
- [ ] Implement batch processing for multiple modules

### Phase 4: User Interface & Experience (Week 7-8)
**Goal**: Create intuitive interface that eliminates manual file editing

#### Step 4.1: Command Line Interface
- [ ] Design user-friendly CLI with clear prompts
- [ ] Implement file selection dialogs
- [ ] Add progress indicators for long operations
- [ ] Create interactive configuration setup
- [ ] Add help system and usage examples

#### Step 4.2: Configuration Management
- [ ] Create semester configuration system
- [ ] Implement user preference storage
- [ ] Add semester date templates (UP academic calendar)
- [ ] Create module filtering options
- [ ] Add timezone and locale settings

#### Step 4.3: Error Handling & User Feedback
- [ ] Implement comprehensive error catching
- [ ] Create user-friendly error messages
- [ ] Add recovery suggestions for common issues
- [ ] Implement logging for debugging
- [ ] Create validation reports

### Phase 5: Google Calendar Integration (Week 9-10)
**Goal**: Automate calendar import and management

#### Step 5.1: Google Apps Script Development
- [ ] Create Google Apps Script for calendar automation
- [ ] Implement OAuth authentication flow
- [ ] Add calendar creation and event management
- [ ] Create duplicate event detection
- [ ] Implement bulk event operations

#### Step 5.2: Integration API
- [ ] Design API between Python script and Google Apps Script
- [ ] Implement secure data transfer
- [ ] Add calendar synchronization features
- [ ] Create backup and restore functionality
- [ ] Handle API rate limiting

#### Step 5.3: Alternative Export Options
- [ ] Ensure robust .ics file generation
- [ ] Add Outlook calendar format support
- [ ] Create Excel export for manual review
- [ ] Implement CSV export for data analysis
- [ ] Add print-friendly schedule formats

### Phase 6: Testing & Optimization (Week 11-12)
**Goal**: Ensure reliability and performance

#### Step 6.1: Comprehensive Testing
- [ ] End-to-end testing with real UP PDFs
- [ ] User acceptance testing
- [ ] Performance testing with large schedules
- [ ] Cross-platform testing (Windows, macOS, Linux)
- [ ] Integration testing with Google Calendar

#### Step 6.2: Documentation & Deployment
- [ ] Create comprehensive user documentation
- [ ] Write developer documentation
- [ ] Create installation scripts
- [ ] Package for distribution
- [ ] Create troubleshooting guide

#### Step 6.3: Future-Proofing
- [ ] Design for UP PDF format changes
- [ ] Create update mechanism
- [ ] Plan for new academic calendar formats
- [ ] Design plugin architecture for extensions
- [ ] Document maintenance procedures

## Technical Specifications

### Core Requirements
- **Input**: UP PDF schedule files (any format UP uses)
- **Output**: Google Calendar-compatible .ics files
- **Preview**: Mandatory single-week preview before full generation
- **Configuration**: Easy semester date and duration setup
- **Error Prevention**: Comprehensive validation to prevent mass import errors

### Architecture Decisions
- **Modular Design**: Separate PDF parsing, calendar generation, and UI
- **Configuration-Driven**: All settings externalized from code
- **Test-Driven**: Unit tests for all core functionality
- **Logging**: Comprehensive logging for debugging and user feedback
- **Error Recovery**: Graceful handling of malformed input data

### Performance Targets
- **PDF Processing**: < 30 seconds for typical UP schedule PDF
- **Calendar Generation**: < 10 seconds for full semester
- **Memory Usage**: < 100MB for typical operations
- **File Size**: Generated .ics files optimized for quick import

### Success Criteria
- [ ] Zero manual file editing required
- [ ] Processes any UP PDF schedule format
- [ ] Generates perfect Google Calendar imports
- [ ] Preview prevents all import errors
- [ ] User can complete full workflow in under 5 minutes
- [ ] Handles semester date configuration easily
- [ ] Robust error handling prevents crashes
- [ ] Clear documentation enables new user success

## Risk Mitigation
- **PDF Format Changes**: Design flexible parsing with fallback options
- **Google API Changes**: Maintain .ics export as primary method
- **User Error**: Comprehensive validation and clear error messages
- **Data Loss**: Always backup original data and provide recovery options
- **Performance Issues**: Implement progress tracking and optimization

## Deliverables
1. **V2 Python Application**: Complete rewrite with all features
2. **Google Apps Script**: Optional automation integration
3. **User Documentation**: Installation and usage guide
4. **Developer Documentation**: Code structure and API reference
5. **Test Suite**: Comprehensive automated testing
6. **Distribution Package**: Ready-to-install application

## Timeline: 12 weeks total
- **Weeks 1-2**: Foundation & Analysis
- **Weeks 3-4**: Core PDF Processing
- **Weeks 5-6**: Calendar Generation Engine
- **Weeks 7-8**: User Interface & Experience
- **Weeks 9-10**: Google Calendar Integration
- **Weeks 11-12**: Testing & Optimization

## Next Immediate Steps
1. Analyze the UP_MOD_XLS.pdf and UP_TST_PDF.pdf files in detail
2. Set up V2 project structure
3. Begin PDF structure analysis and documentation
4. Create initial technology stack proof-of-concept
