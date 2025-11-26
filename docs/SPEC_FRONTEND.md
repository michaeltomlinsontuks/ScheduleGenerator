# Frontend Specification - UP Schedule Generator V3

## Overview

Next.js 14+ application with DaisyUI components providing the user interface for PDF upload, event preview, color customization, and calendar generation.

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14+ | React framework with App Router |
| React | 18+ | UI library |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3+ | Utility-first CSS |
| DaisyUI | 4+ | Component library |
| Zustand | 4+ | Lightweight state management |
| React Query | 5+ | Server state management |
| Axios | 1+ | HTTP client |
| date-fns | 3+ | Date manipulation |

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Home/landing page
│   │   ├── upload/
│   │   │   └── page.tsx          # PDF upload page
│   │   ├── preview/
│   │   │   └── page.tsx          # Event preview & filtering
│   │   ├── customize/
│   │   │   └── page.tsx          # Color & date configuration
│   │   ├── generate/
│   │   │   └── page.tsx          # Generation & download
│   │   └── api/                  # API route handlers (if needed)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx        # Navigation header
│   │   │   ├── Footer.tsx        # Footer with links
│   │   │   ├── Stepper.tsx       # Progress stepper
│   │   │   └── Container.tsx     # Page container
│   │   │
│   │   ├── upload/
│   │   │   ├── DropZone.tsx      # Drag & drop file upload
│   │   │   ├── FilePreview.tsx   # Selected file display
│   │   │   ├── UploadProgress.tsx # Upload/processing progress
│   │   │   └── PdfTypeSelector.tsx # Schedule vs Test selector
│   │   │
│   │   ├── preview/
│   │   │   ├── EventList.tsx     # List of parsed events
│   │   │   ├── EventCard.tsx     # Individual event display
│   │   │   ├── EventFilter.tsx   # Filter by module/day
│   │   │   ├── CalendarPreview.tsx # Week view calendar
│   │   │   └── BulkActions.tsx   # Select all/none buttons
│   │   │
│   │   ├── customize/
│   │   │   ├── ModuleColorPicker.tsx  # Color assignment per module
│   │   │   ├── ColorSwatch.tsx        # Individual color option
│   │   │   ├── DateRangePicker.tsx    # Semester date selection
│   │   │   └── CalendarSelector.tsx   # Google Calendar picker
│   │   │
│   │   ├── auth/
│   │   │   ├── GoogleLoginButton.tsx  # OAuth login button
│   │   │   ├── UserAvatar.tsx         # Logged in user display
│   │   │   └── AuthGuard.tsx          # Protected route wrapper
│   │   │
│   │   └── common/
│   │       ├── Button.tsx        # Styled button variants
│   │       ├── Card.tsx          # Content card
│   │       ├── Modal.tsx         # Dialog modal
│   │       ├── Alert.tsx         # Success/error alerts
│   │       ├── Loading.tsx       # Loading spinner
│   │       └── Tooltip.tsx       # Info tooltips
│   │
│   ├── hooks/
│   │   ├── useUpload.ts          # PDF upload logic
│   │   ├── useJobStatus.ts       # Poll job status
│   │   ├── useEvents.ts          # Event state management
│   │   ├── useColorPrefs.ts      # localStorage color prefs
│   │   ├── useAuth.ts            # Google auth state
│   │   └── useCalendars.ts       # Fetch user calendars
│   │
│   ├── stores/
│   │   ├── eventStore.ts         # Zustand store for events
│   │   ├── configStore.ts        # Date range, calendar selection
│   │   └── authStore.ts          # Auth state
│   │
│   ├── services/
│   │   ├── api.ts                # Axios instance config
│   │   ├── uploadService.ts      # Upload API calls
│   │   ├── jobService.ts         # Job status API calls
│   │   ├── calendarService.ts    # Calendar API calls
│   │   └── authService.ts        # Auth API calls
│   │
│   ├── types/
│   │   ├── event.ts              # ParsedEvent interface
│   │   ├── job.ts                # ProcessingJob interface
│   │   ├── calendar.ts           # Calendar types
│   │   └── api.ts                # API response types
│   │
│   ├── utils/
│   │   ├── colors.ts             # Google Calendar color definitions
│   │   ├── dates.ts              # Date formatting helpers
│   │   ├── validation.ts         # Form validation
│   │   └── storage.ts            # localStorage helpers
│   │
│   └── styles/
│       └── globals.css           # Global styles, Tailwind imports
│
├── public/
│   ├── favicon.ico
│   └── images/
│
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── package.json
└── Dockerfile
```

---

## Pages

### 1. Home Page (`/`)

**Purpose**: Landing page with tool introduction and start button

**Components**:
- Hero section with tool description
- Feature highlights (3-4 cards)
- "Get Started" CTA button
- Optional: Google login button for returning users

**Layout**:
```
┌─────────────────────────────────────┐
│            Header                   │
├─────────────────────────────────────┤
│                                     │
│     UP Schedule Generator           │
│     Convert your UP PDF schedule    │
│     to Google Calendar in minutes   │
│                                     │
│     [Get Started]  [Login with Google]
│                                     │
├─────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │Upload│  │Preview│ │Export│        │
│  │ PDF  │  │Events │ │ Cal  │        │
│  └─────┘  └─────┘  └─────┘         │
├─────────────────────────────────────┤
│            Footer                   │
└─────────────────────────────────────┘
```

---

### 2. Upload Page (`/upload`)

**Purpose**: PDF file upload with validation

**Components**:
- Stepper (Step 1 of 4 active)
- DropZone for drag & drop
- File type indicator (auto-detected or manual)
- Upload button
- Processing status

**User Flow**:
1. User drags PDF or clicks to browse
2. File validated client-side (size, extension)
3. User clicks "Upload & Process"
4. Progress bar shows upload
5. Polling shows processing status
6. On complete, redirect to `/preview`

**State**:
- Selected file
- Upload progress (0-100)
- Job ID (after upload)
- Job status (pending/processing/complete/failed)
- Error message (if any)

---

### 3. Preview Page (`/preview`)

**Purpose**: Display parsed events, allow filtering

**Components**:
- Stepper (Step 2 of 4 active)
- Event list grouped by day
- Checkbox per event for selection
- Bulk select/deselect buttons
- Filter dropdown (by module)
- Event count summary
- "Continue" button

**Layout**:
```
┌─────────────────────────────────────┐
│  Stepper: [1]─[2●]─[3]─[4]          │
├─────────────────────────────────────┤
│  Found 24 events from 5 modules     │
│  [Select All] [Deselect All]        │
│  Filter: [All Modules ▼]            │
├─────────────────────────────────────┤
│  ── Monday ──                       │
│  ☑ COS 214 Lecture    08:30-10:20  │
│  ☑ COS 214 Tutorial   10:30-12:20  │
│  ☐ COS 214 Prac P01   14:00-16:50  │
│  ☑ COS 214 Prac P02   14:00-16:50  │
│                                     │
│  ── Tuesday ──                      │
│  ☑ STK 220 Lecture    08:30-09:20  │
│  ...                                │
├─────────────────────────────────────┤
│  Selected: 18 of 24 events          │
│                    [Continue →]     │
└─────────────────────────────────────┘
```

**State**:
- Events array (from job result)
- Selected event IDs
- Filter value

---

### 4. Customize Page (`/customize`)

**Purpose**: Color assignment and date configuration

**Components**:
- Stepper (Step 3 of 4 active)
- Module list with color pickers
- Date range picker (start/end)
- Calendar selector (if Google authenticated)
- "Generate" button

**Layout**:
```
┌─────────────────────────────────────┐
│  Stepper: [1]─[2]─[3●]─[4]          │
├─────────────────────────────────────┤
│  Module Colors                      │
│  ┌─────────────────────────────┐   │
│  │ COS 214  [🔵 Blueberry ▼]   │   │
│  │ COS 226  [🟢 Basil ▼]       │   │
│  │ STK 220  [🟡 Banana ▼]      │   │
│  │ WTW 285  [🟣 Grape ▼]       │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  Semester Dates                     │
│  Start: [July 21, 2025    📅]      │
│  End:   [November 14, 2025 📅]     │
├─────────────────────────────────────┤
│  Target Calendar (Google users)     │
│  [Primary Calendar ▼]               │
│  [ ] Create new calendar            │
├─────────────────────────────────────┤
│  [← Back]           [Generate →]    │
└─────────────────────────────────────┘
```

**State**:
- Module color map (persisted to localStorage)
- Semester start date
- Semester end date
- Selected calendar ID

---

### 5. Generate Page (`/generate`)

**Purpose**: Final generation and download/sync

**Components**:
- Stepper (Step 4 of 4 active)
- Summary of what will be generated
- Output options (ICS download / Google Calendar)
- Progress indicator
- Success/error message
- "Upload Another" button

**Layout**:
```
┌─────────────────────────────────────┐
│  Stepper: [1]─[2]─[3]─[4●]          │
├─────────────────────────────────────┤
│  Ready to Generate                  │
│                                     │
│  • 18 events selected               │
│  • 5 modules with colors            │
│  • Recurring: Jul 21 - Nov 14       │
│                                     │
│  Choose output:                     │
│  ┌─────────────┐ ┌─────────────┐   │
│  │ Download    │ │ Add to      │   │
│  │ .ics File   │ │ Google Cal  │   │
│  └─────────────┘ └─────────────┘   │
├─────────────────────────────────────┤
│  ✓ Success! 18 events added         │
│                                     │
│  [Upload Another PDF]               │
└─────────────────────────────────────┘
```

---

## Components Detail

### DropZone
```typescript
interface DropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;           // Default: ".pdf"
  maxSize?: number;          // Default: 10MB
  disabled?: boolean;
}
```

### EventCard
```typescript
interface EventCardProps {
  event: ParsedEvent;
  selected: boolean;
  onToggle: (id: string) => void;
  colorPreview?: string;     // Show assigned color
}
```

### ModuleColorPicker
```typescript
interface ModuleColorPickerProps {
  modules: string[];
  colors: Record<string, string>;
  onChange: (module: string, color: string) => void;
}
```

### DateRangePicker
```typescript
interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartChange: (date: Date) => void;
  onEndChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}
```

---

## Google Calendar Colors

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
];
```

---

## State Management

### Event Store (Zustand)
```typescript
interface EventStore {
  events: ParsedEvent[];
  selectedIds: Set<string>;
  
  setEvents: (events: ParsedEvent[]) => void;
  toggleEvent: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  getSelectedEvents: () => ParsedEvent[];
}
```

### Config Store (Zustand)
```typescript
interface ConfigStore {
  semesterStart: Date;
  semesterEnd: Date;
  targetCalendarId: string | null;
  moduleColors: Record<string, string>;
  
  setSemesterDates: (start: Date, end: Date) => void;
  setTargetCalendar: (id: string) => void;
  setModuleColor: (module: string, color: string) => void;
  loadColorsFromStorage: () => void;
  saveColorsToStorage: () => void;
}
```

---

## localStorage Schema

```typescript
// Key: "up-schedule-colors"
interface StoredColorPrefs {
  version: 1;
  colors: Record<string, string>;
  updatedAt: string;  // ISO date
}

// Key: "up-schedule-dates"
interface StoredDatePrefs {
  version: 1;
  semesterStart: string;  // ISO date
  semesterEnd: string;    // ISO date
}
```

---

## API Integration

### Upload PDF
```typescript
async function uploadPdf(file: File): Promise<{ jobId: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progress) => {
      // Update progress state
    }
  });
  
  return response.data;
}
```

### Poll Job Status
```typescript
async function pollJobStatus(jobId: string): Promise<ProcessingJob> {
  // Poll every 1 second until complete or failed
  // Use React Query with refetchInterval
}
```

### Generate ICS
```typescript
async function generateIcs(request: GenerateRequest): Promise<Blob> {
  const response = await api.post('/api/generate/ics', request, {
    responseType: 'blob'
  });
  return response.data;
}
```

---

## Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- DropZone: Full width on mobile, centered on desktop
- Event list: Single column on mobile, grid on desktop
- Color picker: Horizontal scroll on mobile, grid on desktop

---

## Accessibility

- All interactive elements keyboard accessible
- ARIA labels on buttons and inputs
- Color contrast meets WCAG AA
- Focus indicators visible
- Screen reader announcements for status changes

---

## Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| Invalid file type | "Please upload a PDF file" | Show alert, reset dropzone |
| File too large | "File must be under 10MB" | Show alert |
| PDF not recognized | "This doesn't look like a UP schedule" | Show alert with help link |
| Processing failed | "Failed to process PDF. Please try again" | Show retry button |
| Network error | "Connection lost. Retrying..." | Auto-retry with backoff |
| Google auth failed | "Could not connect to Google" | Show retry button |

---

## Testing Strategy

- Unit tests for utility functions
- Component tests with React Testing Library
- Integration tests for user flows
- E2E tests with Playwright (optional for MVP)

---

## Performance Considerations

- Lazy load preview calendar component
- Debounce color picker changes
- Memoize event list rendering
- Use React Query for caching API responses
