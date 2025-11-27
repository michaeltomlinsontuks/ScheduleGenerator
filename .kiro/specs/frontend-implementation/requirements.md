# Requirements Document

## Introduction

This document specifies the requirements for implementing the UP Schedule Generator V3 frontend - a Next.js 14+ application with DaisyUI 5 components. The application enables users to upload UP PDF schedules, preview parsed events, customize colors and dates, and export to ICS files or Google Calendar. The implementation follows a component-by-component approach where each major feature can be viewed and reviewed in the browser before proceeding.

## Glossary

- **Frontend**: The Next.js web application providing the user interface
- **DaisyUI**: A Tailwind CSS component library providing pre-styled UI components
- **Stepper**: A visual progress indicator showing the current step in a multi-step process
- **DropZone**: A drag-and-drop file upload area
- **ParsedEvent**: A schedule event extracted from the PDF (module, day, time, location, type)
- **Module**: A university course code (e.g., COS 214, STK 220)
- **ICS**: iCalendar file format for calendar events
- **Google Calendar Colors**: The 11 predefined colors available in Google Calendar API

## Requirements

### Requirement 1: Project Setup and Theme Configuration

**User Story:** As a developer, I want the Next.js project properly configured with DaisyUI theming, so that I have a consistent design foundation.

#### Acceptance Criteria

1. WHEN the project is initialized THEN the Frontend SHALL include Next.js 14+ with App Router, TypeScript, Tailwind CSS 4, and DaisyUI 5
2. WHEN the application loads THEN the Frontend SHALL apply a custom light theme based on corporate with electric blue (#0ea5e9) as primary, neutral greys for secondary elements, and clean whites for backgrounds
3. WHEN the application loads in dark mode THEN the Frontend SHALL apply a custom dark theme based on black with electric blue (#0ea5e9) as primary and dark greys/navy tones for surfaces
4. WHEN a user clicks the theme toggle THEN the Frontend SHALL switch between light and dark themes and persist the preference to localStorage
5. WHEN the project structure is created THEN the Frontend SHALL follow the directory structure defined in SPEC_FRONTEND.md

### Requirement 2: Layout Components (Header, Footer, Container)

**User Story:** As a user, I want consistent navigation and page structure, so that I can easily move through the application.

#### Acceptance Criteria

1. WHEN any page loads THEN the Frontend SHALL display a Header with the application logo/title, navigation links, theme toggle, and optional user avatar
2. WHEN any page loads THEN the Frontend SHALL display a Footer with copyright and relevant links
3. WHEN the Header renders THEN the Frontend SHALL use DaisyUI navbar component with navbar-start, navbar-center, and navbar-end sections
4. WHEN the theme toggle is clicked THEN the Frontend SHALL use DaisyUI swap component to animate between sun and moon icons
5. WHEN page content renders THEN the Frontend SHALL wrap content in a Container component with consistent max-width and padding

### Requirement 3: Stepper Component

**User Story:** As a user, I want to see my progress through the upload workflow, so that I know which step I'm on and what comes next.

#### Acceptance Criteria

1. WHEN the Stepper renders THEN the Frontend SHALL display 4 steps: Upload, Preview, Customize, Generate
2. WHEN a step is completed THEN the Frontend SHALL mark that step with a checkmark icon and step-primary color
3. WHEN a step is current THEN the Frontend SHALL highlight that step with step-primary color
4. WHEN a step is future THEN the Frontend SHALL display that step in neutral/muted styling
5. WHEN the Stepper renders THEN the Frontend SHALL use DaisyUI steps component with steps-horizontal direction

### Requirement 4: Home/Landing Page

**User Story:** As a user, I want to understand what the tool does and start the process, so that I can convert my schedule.

#### Acceptance Criteria

1. WHEN the home page loads THEN the Frontend SHALL display a hero section with title, description, and "Get Started" button
2. WHEN the home page loads THEN the Frontend SHALL display 3 feature cards explaining Upload, Preview, and Export steps
3. WHEN the "Get Started" button is clicked THEN the Frontend SHALL navigate to the /upload page
4. WHEN the home page renders THEN the Frontend SHALL use DaisyUI hero and card components
5. WHEN the feature cards render THEN the Frontend SHALL use card-border style with subtle hover effects

### Requirement 5: Upload Page with DropZone

**User Story:** As a user, I want to upload my PDF schedule file, so that it can be processed into calendar events.

#### Acceptance Criteria

1. WHEN the upload page loads THEN the Frontend SHALL display the Stepper with step 1 active
2. WHEN the DropZone renders THEN the Frontend SHALL accept drag-and-drop or click-to-browse for PDF files only
3. WHEN a file is dragged over the DropZone THEN the Frontend SHALL show visual feedback with border color change
4. WHEN a valid PDF is selected THEN the Frontend SHALL display the filename, size, and a remove button
5. WHEN an invalid file type is selected THEN the Frontend SHALL display an error alert and reject the file
6. WHEN a file exceeds 10MB THEN the Frontend SHALL display an error alert indicating the size limit
7. WHEN the "Upload & Process" button is clicked THEN the Frontend SHALL show upload progress using DaisyUI progress component
8. WHEN processing completes successfully THEN the Frontend SHALL navigate to /preview with the job results

### Requirement 6: Preview Page with Event List

**User Story:** As a user, I want to see and select which events to include in my calendar, so that I can customize my schedule.

#### Acceptance Criteria

1. WHEN the preview page loads THEN the Frontend SHALL display the Stepper with step 2 active
2. WHEN events are loaded THEN the Frontend SHALL display a summary showing total events and module count
3. WHEN events render THEN the Frontend SHALL group events by day of week (Monday through Friday)
4. WHEN an event card renders THEN the Frontend SHALL display module code, event type, time range, and location
5. WHEN an event card renders THEN the Frontend SHALL include a checkbox for selection using DaisyUI checkbox component
6. WHEN "Select All" is clicked THEN the Frontend SHALL check all event checkboxes
7. WHEN "Deselect All" is clicked THEN the Frontend SHALL uncheck all event checkboxes
8. WHEN the module filter dropdown changes THEN the Frontend SHALL show only events matching the selected module
9. WHEN the "Continue" button is clicked THEN the Frontend SHALL navigate to /customize with selected events

### Requirement 7: Customize Page with Color Picker and Date Range

**User Story:** As a user, I want to assign colors to my modules and set semester dates, so that my calendar looks organized.

#### Acceptance Criteria

1. WHEN the customize page loads THEN the Frontend SHALL display the Stepper with step 3 active
2. WHEN modules render THEN the Frontend SHALL display each unique module with a color dropdown
3. WHEN the color dropdown renders THEN the Frontend SHALL show all 11 Google Calendar colors with their actual hex values and names
4. WHEN a color is selected THEN the Frontend SHALL display a color swatch preview next to the module name
5. WHEN the date range picker renders THEN the Frontend SHALL show start date and end date inputs
6. WHEN dates are selected THEN the Frontend SHALL validate that end date is after start date
7. WHEN color preferences change THEN the Frontend SHALL persist them to localStorage
8. WHEN the page loads THEN the Frontend SHALL restore previously saved color preferences from localStorage
9. WHEN the "Generate" button is clicked THEN the Frontend SHALL navigate to /generate with configuration

### Requirement 8: Generate Page with Output Options

**User Story:** As a user, I want to download my calendar or sync to Google, so that I can use my schedule.

#### Acceptance Criteria

1. WHEN the generate page loads THEN the Frontend SHALL display the Stepper with step 4 active
2. WHEN the summary renders THEN the Frontend SHALL show selected event count, module count, and date range
3. WHEN output options render THEN the Frontend SHALL display two cards: "Download ICS" and "Add to Google Calendar"
4. WHEN "Download ICS" is clicked THEN the Frontend SHALL trigger a file download of the generated .ics file
5. WHEN generation succeeds THEN the Frontend SHALL display a success alert with event count
6. WHEN generation fails THEN the Frontend SHALL display an error alert with retry option
7. WHEN "Upload Another PDF" is clicked THEN the Frontend SHALL navigate back to /upload and reset state

### Requirement 9: Common UI Components

**User Story:** As a developer, I want reusable UI components, so that the interface is consistent throughout the application.

#### Acceptance Criteria

1. WHEN a Button component renders THEN the Frontend SHALL support variants: primary, secondary, ghost, and outline using DaisyUI btn classes
2. WHEN a Card component renders THEN the Frontend SHALL use DaisyUI card with card-body and optional card-border
3. WHEN a Modal component renders THEN the Frontend SHALL use DaisyUI modal with proper backdrop and close functionality
4. WHEN an Alert component renders THEN the Frontend SHALL support info, success, warning, and error variants
5. WHEN a Loading component renders THEN the Frontend SHALL display DaisyUI loading-spinner with configurable size

### Requirement 10: State Management with Zustand

**User Story:** As a developer, I want centralized state management, so that data flows predictably through the application.

#### Acceptance Criteria

1. WHEN events are loaded THEN the Frontend SHALL store them in the eventStore with selection state
2. WHEN configuration changes THEN the Frontend SHALL update the configStore with dates, colors, and calendar selection
3. WHEN the application loads THEN the Frontend SHALL hydrate stores from localStorage where applicable
4. WHEN state changes THEN the Frontend SHALL persist relevant data to localStorage for session continuity

### Requirement 11: API Service Layer

**User Story:** As a developer, I want a clean API abstraction, so that components don't directly handle HTTP concerns.

#### Acceptance Criteria

1. WHEN API calls are made THEN the Frontend SHALL use an Axios instance with base URL configuration
2. WHEN uploading a PDF THEN the Frontend SHALL use multipart/form-data with progress tracking
3. WHEN polling job status THEN the Frontend SHALL retry every 1 second until complete or failed
4. WHEN generating ICS THEN the Frontend SHALL handle blob response for file download
5. WHEN API errors occur THEN the Frontend SHALL transform them into user-friendly error messages

### Requirement 12: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when something goes wrong, so that I know how to proceed.

#### Acceptance Criteria

1. WHEN a network error occurs THEN the Frontend SHALL display "Connection lost. Retrying..." with auto-retry
2. WHEN PDF processing fails THEN the Frontend SHALL display "Failed to process PDF. Please try again" with retry button
3. WHEN an invalid file is uploaded THEN the Frontend SHALL display specific validation error (type or size)
4. WHEN an operation succeeds THEN the Frontend SHALL display a brief success toast or alert
5. WHEN loading data THEN the Frontend SHALL display appropriate skeleton or spinner states
