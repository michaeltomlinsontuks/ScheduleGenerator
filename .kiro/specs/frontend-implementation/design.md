# Design Document - UP Schedule Generator V3 Frontend

## Overview

This design document outlines the architecture and implementation approach for the UP Schedule Generator V3 frontend. The application is built with Next.js 14+ using the App Router, styled with Tailwind CSS 4 and DaisyUI 5, and manages state with Zustand. The implementation follows an incremental approach where each major component can be viewed and reviewed in the browser before proceeding.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Pages: / | /upload | /preview | /customize | /generate ││
│  └─────────────────────────────────────────────────────────┘│
│                            │                                 │
│  ┌─────────────┐  ┌────────┴────────┐  ┌─────────────────┐ │
│  │  Components │  │  Zustand Stores │  │  Services/API   │ │
│  │  (UI Layer) │  │  (State Layer)  │  │  (Data Layer)   │ │
│  └─────────────┘  └─────────────────┘  └─────────────────┘ │
│                            │                                 │
│  ┌─────────────────────────┴───────────────────────────────┐│
│  │  localStorage (persistence) + React Query (caching)     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    Backend API (FastAPI)
```

## Components and Interfaces

### Layout Components

```typescript
// components/layout/Header.tsx
interface HeaderProps {
  showNav?: boolean;  // Hide nav on certain pages
}

// components/layout/Footer.tsx
interface FooterProps {
  minimal?: boolean;  // Compact footer variant
}

// components/layout/Stepper.tsx
interface StepperProps {
  currentStep: 1 | 2 | 3 | 4;
  completedSteps?: number[];
}

// components/layout/Container.tsx
interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';  // max-width variants
}
```

### Upload Components

```typescript
// components/upload/DropZone.tsx
interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  accept?: string;           // Default: ".pdf"
  maxSize?: number;          // Default: 10MB (10485760 bytes)
  disabled?: boolean;
  selectedFile?: File | null;
}

// components/upload/FilePreview.tsx
interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

// components/upload/UploadProgress.tsx
interface UploadProgressProps {
  progress: number;          // 0-100
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}
```

### Preview Components

```typescript
// components/preview/EventList.tsx
interface EventListProps {
  events: ParsedEvent[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  filterModule?: string;
}

// components/preview/EventCard.tsx
interface EventCardProps {
  event: ParsedEvent;
  selected: boolean;
  onToggle: () => void;
  colorHex?: string;         // Preview assigned color
}

// components/preview/EventFilter.tsx
interface EventFilterProps {
  modules: string[];
  selectedModule: string;    // 'all' or module code
  onChange: (module: string) => void;
}

// components/preview/BulkActions.tsx
interface BulkActionsProps {
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}
```

### Customize Components

```typescript
// components/customize/ModuleColorPicker.tsx
interface ModuleColorPickerProps {
  modules: string[];
  colors: Record<string, string>;  // module -> colorId
  onChange: (module: string, colorId: string) => void;
}

// components/customize/ColorSwatch.tsx
interface ColorSwatchProps {
  colorId: string;
  name: string;
  hex: string;
  selected?: boolean;
  onClick?: () => void;
}

// components/customize/DateRangePicker.tsx
interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartChange: (date: Date) => void;
  onEndChange: (date: Date) => void;
  error?: string;
}
```

### Common Components

```typescript
// components/common/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// components/common/Alert.tsx
interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  onDismiss?: () => void;
}

// components/common/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// components/common/Loading.tsx
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}
```

## Data Models

### ParsedEvent

```typescript
interface ParsedEvent {
  id: string;                // Unique identifier
  moduleCode: string;        // e.g., "COS 214"
  moduleName?: string;       // e.g., "Data Structures"
  eventType: 'lecture' | 'tutorial' | 'practical' | 'test';
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;         // "08:30"
  endTime: string;           // "10:20"
  location?: string;         // e.g., "IT 4-1"
  group?: string;            // e.g., "P01", "T02"
}
```

### ProcessingJob

```typescript
interface ProcessingJob {
  jobId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress?: number;         // 0-100
  events?: ParsedEvent[];    // Available when complete
  error?: string;            // Available when failed
  createdAt: string;
  completedAt?: string;
}
```

### GenerateRequest

```typescript
interface GenerateRequest {
  events: ParsedEvent[];
  moduleColors: Record<string, string>;  // module -> Google color ID
  semesterStart: string;     // ISO date
  semesterEnd: string;       // ISO date
  outputType: 'ics' | 'google';
  calendarId?: string;       // For Google Calendar
}
```

### Google Calendar Colors

```typescript
export const GOOGLE_CALENDAR_COLORS = [
  { id: "1", name: "Lavender", hex: "#7986cb" },
  { id: "2", name: "Sage", hex: "#33b679" },
  { id: "3", name: "Grape", hex: "#8e24aa" },
  { id: "4", name: "Flamingo", hex: "#e67c73" },
  { id: "5", name: "Banana", hex: "#f6bf26" },
  { id: "6", name: "Tangerine", hex: "#f4511e" },
  { id: "7", name: "Peacock", hex: "#039be5" },
  { id: "8", name: "Graphite", hex: "#616161" },
  { id: "9", name: "Blueberry", hex: "#3f51b5" },
  { id: "10", name: "Basil", hex: "#0b8043" },
  { id: "11", name: "Tomato", hex: "#d50000" },
] as const;
```

## State Management

### Event Store

```typescript
// stores/eventStore.ts
interface EventState {
  events: ParsedEvent[];
  selectedIds: Set<string>;
  jobId: string | null;
  jobStatus: ProcessingJob['status'] | null;
}

interface EventActions {
  setEvents: (events: ParsedEvent[]) => void;
  setJobId: (jobId: string) => void;
  setJobStatus: (status: ProcessingJob['status']) => void;
  toggleEvent: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  getSelectedEvents: () => ParsedEvent[];
  reset: () => void;
}
```

### Config Store

```typescript
// stores/configStore.ts
interface ConfigState {
  semesterStart: Date | null;
  semesterEnd: Date | null;
  moduleColors: Record<string, string>;
  theme: 'light' | 'dark';
}

interface ConfigActions {
  setSemesterStart: (date: Date) => void;
  setSemesterEnd: (date: Date) => void;
  setModuleColor: (module: string, colorId: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
  reset: () => void;
}
```

## Custom Theme Configuration

```css
/* src/styles/globals.css */
@import "tailwindcss";
@plugin "daisyui";

/* Light Theme - Clean professional with electric blue accent */
@plugin "daisyui/theme" {
  name: "schedule-light";
  default: true;
  color-scheme: light;

  --color-base-100: oklch(100% 0 0);
  --color-base-200: oklch(97% 0.005 240);
  --color-base-300: oklch(94% 0.01 240);
  --color-base-content: oklch(25% 0.02 240);
  --color-primary: oklch(65% 0.19 220);
  --color-primary-content: oklch(100% 0 0);
  --color-secondary: oklch(55% 0.03 240);
  --color-secondary-content: oklch(100% 0 0);
  --color-accent: oklch(65% 0.19 220);
  --color-accent-content: oklch(100% 0 0);
  --color-neutral: oklch(35% 0.02 240);
  --color-neutral-content: oklch(98% 0 0);
  --color-info: oklch(70% 0.15 230);
  --color-info-content: oklch(100% 0 0);
  --color-success: oklch(65% 0.2 145);
  --color-success-content: oklch(100% 0 0);
  --color-warning: oklch(80% 0.18 85);
  --color-warning-content: oklch(25% 0.05 85);
  --color-error: oklch(60% 0.22 25);
  --color-error-content: oklch(100% 0 0);

  --radius-selector: 0.5rem;
  --radius-field: 0.375rem;
  --radius-box: 0.5rem;
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;
  --depth: 1;
  --noise: 0;
}

/* Dark Theme - Deep blacks with electric blue accent */
@plugin "daisyui/theme" {
  name: "schedule-dark";
  prefersdark: true;
  color-scheme: dark;

  --color-base-100: oklch(15% 0.015 250);
  --color-base-200: oklch(20% 0.02 250);
  --color-base-300: oklch(25% 0.025 250);
  --color-base-content: oklch(92% 0.01 240);
  --color-primary: oklch(70% 0.19 220);
  --color-primary-content: oklch(15% 0.02 220);
  --color-secondary: oklch(60% 0.03 250);
  --color-secondary-content: oklch(15% 0.02 250);
  --color-accent: oklch(70% 0.19 220);
  --color-accent-content: oklch(15% 0.02 220);
  --color-neutral: oklch(30% 0.02 250);
  --color-neutral-content: oklch(90% 0.01 250);
  --color-info: oklch(70% 0.15 230);
  --color-info-content: oklch(15% 0.02 230);
  --color-success: oklch(70% 0.2 145);
  --color-success-content: oklch(15% 0.02 145);
  --color-warning: oklch(80% 0.18 85);
  --color-warning-content: oklch(20% 0.05 85);
  --color-error: oklch(65% 0.22 25);
  --color-error-content: oklch(15% 0.02 25);

  --radius-selector: 0.5rem;
  --radius-field: 0.375rem;
  --radius-box: 0.5rem;
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;
  --depth: 1;
  --noise: 0;
}
```

## Error Handling

### Error Types and Messages

| Error Code | User Message | Recovery Action |
|------------|--------------|-----------------|
| `INVALID_FILE_TYPE` | "Please upload a PDF file" | Reset DropZone, show alert |
| `FILE_TOO_LARGE` | "File must be under 10MB" | Reset DropZone, show alert |
| `UPLOAD_FAILED` | "Upload failed. Please try again" | Show retry button |
| `PROCESSING_FAILED` | "Failed to process PDF. Please try again" | Show retry button |
| `NETWORK_ERROR` | "Connection lost. Retrying..." | Auto-retry with exponential backoff |
| `INVALID_DATE_RANGE` | "End date must be after start date" | Highlight date inputs |
| `GENERATION_FAILED` | "Failed to generate calendar. Please try again" | Show retry button |

### Error Handling Strategy

```typescript
// utils/errorHandler.ts
interface AppError {
  code: string;
  message: string;
  recoverable: boolean;
  retryAction?: () => void;
}

function handleApiError(error: AxiosError): AppError {
  if (!error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Connection lost. Retrying...',
      recoverable: true,
    };
  }
  // Map status codes to user-friendly errors
  // ...
}
```

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific functionality and property-based tests for universal correctness guarantees.

**Unit Testing (Vitest + React Testing Library)**
- Component rendering and interaction tests
- Utility function tests
- Store action tests
- API service mocking tests

**Property-Based Testing (fast-check)**
- Data transformation invariants
- State management consistency
- Input validation across all valid inputs



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme persistence round-trip

*For any* theme selection (light or dark), saving to localStorage and then loading should return the same theme value.

**Validates: Requirements 1.4**

### Property 2: Stepper state styling consistency

*For any* step number and current step, the step should be styled correctly: completed steps show checkmark with primary color, current step is highlighted with primary color, and future steps are muted/neutral.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 3: File validation rejects invalid files

*For any* file that is not a PDF or exceeds 10MB, the DropZone should reject it and display an appropriate error message.

**Validates: Requirements 5.5, 5.6, 12.3**

### Property 4: Valid PDF displays correct information

*For any* valid PDF file (correct type, under 10MB), the FilePreview should display the exact filename and correct file size.

**Validates: Requirements 5.4**

### Property 5: Event summary shows correct counts

*For any* array of ParsedEvents, the summary should display the exact total count and the exact count of unique modules.

**Validates: Requirements 6.2**

### Property 6: Events grouped by day correctly

*For any* array of ParsedEvents, grouping by day should result in each event appearing exactly once under its correct day of week.

**Validates: Requirements 6.3**

### Property 7: Event card displays all required fields

*For any* ParsedEvent, the EventCard should render the module code, event type, time range (start-end), and location if present.

**Validates: Requirements 6.4**

### Property 8: Bulk selection operations

*For any* array of events, "Select All" should result in all events being selected (selectedIds.size === events.length), and "Deselect All" should result in zero selections (selectedIds.size === 0).

**Validates: Requirements 6.6, 6.7**

### Property 9: Module filter shows only matching events

*For any* module filter value and array of events, the filtered result should contain only events where moduleCode matches the filter (or all events if filter is "all").

**Validates: Requirements 6.8**

### Property 10: Unique modules have color pickers

*For any* array of ParsedEvents, the customize page should display exactly one color picker for each unique moduleCode.

**Validates: Requirements 7.2**

### Property 11: Color selection updates swatch

*For any* module and color selection, the color swatch displayed should match the hex value of the selected Google Calendar color.

**Validates: Requirements 7.4**

### Property 12: Date range validation

*For any* pair of dates, validation should return an error if and only if the end date is before or equal to the start date.

**Validates: Requirements 7.6**

### Property 13: Color preferences localStorage round-trip

*For any* module-to-color mapping, saving to localStorage and loading should return an equivalent mapping.

**Validates: Requirements 7.7, 7.8, 10.3, 10.4**

### Property 14: Generate summary shows correct values

*For any* configuration (selected events, module colors, date range), the summary should display the exact selected event count, unique module count, and formatted date range.

**Validates: Requirements 8.2**

### Property 15: Button variant applies correct classes

*For any* button variant (primary, secondary, ghost, outline), the rendered button should include the corresponding DaisyUI class (btn-primary, btn-secondary, btn-ghost, btn-outline).

**Validates: Requirements 9.1**

### Property 16: Alert type applies correct styling

*For any* alert type (info, success, warning, error), the rendered alert should include the corresponding DaisyUI class (alert-info, alert-success, alert-warning, alert-error).

**Validates: Requirements 9.4**

### Property 17: Loading size applies correct classes

*For any* loading size (sm, md, lg), the rendered loading spinner should include the corresponding DaisyUI size class.

**Validates: Requirements 9.5**

### Property 18: Event store maintains selection state

*For any* sequence of toggle operations on events, the selectedIds set should accurately reflect which events have been toggled an odd number of times.

**Validates: Requirements 10.1**

### Property 19: API errors transform to user-friendly messages

*For any* API error response, the error handler should return a non-empty, user-friendly message string (not raw error codes or stack traces).

**Validates: Requirements 11.5**
