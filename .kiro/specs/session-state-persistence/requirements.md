# Requirements Document

## Introduction

The UP Schedule Generator frontend currently lacks proper state persistence, causing data loss when users refresh pages or navigate using browser back/forward buttons. This feature will implement sessionStorage-based state management to maintain user workflow state throughout their browser session while automatically clearing data when the browser closes.

## Glossary

- **Frontend**: Next.js web application for the UP Schedule Generator
- **SessionStorage**: Browser-native storage API that persists data only for the current browser tab session
- **EventStore**: Zustand store managing parsed events, selections, and job state
- **ConfigStore**: Zustand store managing semester dates, module colors, and theme preferences
- **AuthStore**: Zustand store managing authentication state
- **Workflow State**: The complete user state including events, selections, configuration, and job tracking
- **Browser Session**: The lifetime of a browser tab from opening to closing
- **Navigation Flow**: The sequence of pages: Upload → Preview → Customize → Generate
- **Job Resume**: Ability to continue tracking a PDF processing job after page refresh

## Requirements

### Requirement 1

**User Story:** As a user, I want my event data and selections to persist when I refresh the page, so that I don't lose my work during the calendar creation process.

#### Acceptance Criteria

1. WHEN a user refreshes any page in the workflow THEN the System SHALL restore all event data and selections from sessionStorage
2. WHEN a user navigates using browser back/forward buttons THEN the System SHALL maintain all workflow state without data loss
3. WHEN a user closes the browser tab THEN the System SHALL automatically clear all stored workflow state
4. WHEN a user opens the application in a new tab THEN the System SHALL start with a fresh empty state
5. WHEN stored data becomes corrupted or invalid THEN the System SHALL gracefully handle errors and reset to initial state

### Requirement 2

**User Story:** As a user, I want to be able to resume a PDF processing job if I refresh the page during upload, so that I don't have to re-upload my file.

#### Acceptance Criteria

1. WHEN a PDF processing job is in progress THEN the System SHALL store the job ID in sessionStorage
2. WHEN a user refreshes during job processing THEN the System SHALL restore the job ID and continue polling for status
3. WHEN a job completes successfully THEN the System SHALL store the resulting events in sessionStorage
4. WHEN a job fails THEN the System SHALL clear the job state from sessionStorage
5. WHEN a user navigates away from upload page THEN the System SHALL maintain job tracking state

### Requirement 3

**User Story:** As a user, I want my module color customizations to persist across browser sessions, so that I don't have to reconfigure them each time.

#### Acceptance Criteria

1. WHEN a user sets module colors THEN the System SHALL store them in localStorage for cross-session persistence
2. WHEN a user sets semester dates THEN the System SHALL store them in localStorage for cross-session persistence
3. WHEN a user selects a Google Calendar THEN the System SHALL store the selection in localStorage
4. WHEN a user changes theme preference THEN the System SHALL store it in localStorage
5. WHEN configuration data is loaded THEN the System SHALL properly deserialize Date objects from stored strings

### Requirement 4

**User Story:** As a user, I want my workflow state to be cleared after I successfully generate a calendar, so that I can start fresh for my next schedule.

#### Acceptance Criteria

1. WHEN a user successfully downloads an ICS file THEN the System SHALL clear event data from sessionStorage
2. WHEN a user successfully syncs to Google Calendar THEN the System SHALL clear event data from sessionStorage
3. WHEN a user clicks "Upload Another PDF" THEN the System SHALL clear all workflow state from sessionStorage
4. WHEN workflow state is cleared THEN the System SHALL maintain configuration preferences in localStorage
5. WHEN state is cleared THEN the System SHALL redirect user to the upload page

### Requirement 5

**User Story:** As a user, I want the application to handle storage errors gracefully, so that I can continue using the app even if storage fails.

#### Acceptance Criteria

1. WHEN sessionStorage is unavailable or full THEN the System SHALL fall back to in-memory state management
2. WHEN stored data fails to parse THEN the System SHALL log the error and reset to initial state
3. WHEN storage quota is exceeded THEN the System SHALL clear old data and retry the operation
4. WHEN a storage operation fails THEN the System SHALL display a user-friendly warning message
5. WHEN running in private/incognito mode THEN the System SHALL detect storage limitations and adapt accordingly

### Requirement 6

**User Story:** As a developer, I want proper serialization of complex data types, so that state is correctly restored after page refresh.

#### Acceptance Criteria

1. WHEN storing Set objects THEN the System SHALL convert them to Arrays for JSON serialization
2. WHEN restoring Set objects THEN the System SHALL convert Arrays back to Sets
3. WHEN storing Date objects THEN the System SHALL serialize them as ISO strings
4. WHEN restoring Date objects THEN the System SHALL deserialize ISO strings back to Date instances
5. WHEN storing nested objects THEN the System SHALL maintain data structure integrity through serialization

### Requirement 7

**User Story:** As a user, I want proper navigation guards on workflow pages, so that I'm redirected appropriately when accessing pages without required data.

#### Acceptance Criteria

1. WHEN a user accesses preview page without events THEN the System SHALL redirect to upload page
2. WHEN a user accesses customize page without selected events THEN the System SHALL redirect to preview page
3. WHEN a user accesses generate page without selected events THEN the System SHALL redirect to customize page
4. WHEN a user has valid workflow state THEN the System SHALL allow access to all workflow pages
5. WHEN checking for required data THEN the System SHALL first attempt to restore from sessionStorage

### Requirement 8

**User Story:** As a developer, I want comprehensive tests for state persistence, so that I can ensure reliability across different scenarios.

#### Acceptance Criteria

1. WHEN testing store persistence THEN the System SHALL verify data survives simulated page refresh
2. WHEN testing serialization THEN the System SHALL verify all data types are correctly converted
3. WHEN testing error handling THEN the System SHALL verify graceful degradation when storage fails
4. WHEN testing state clearing THEN the System SHALL verify all workflow data is removed
5. WHEN testing navigation guards THEN the System SHALL verify proper redirects for missing data
