# Design Document: Frontend API Integration

## Overview

This design covers the implementation of API service modules, authentication UI components, and React hooks that connect the existing UP Schedule Generator frontend to the NestJS backend. The frontend currently has all UI pages built with simulated data - this integration will replace mock implementations with real API calls.

## Architecture

```mermaid
graph TB
    subgraph Frontend
        Pages[Pages: Upload, Preview, Customize, Generate]
        Hooks[Custom Hooks: useAuth, useUpload, useJobStatus, useCalendars]
        Services[API Services: api, auth, upload, calendar]
        Stores[Zustand Stores: eventStore, configStore, authStore]
        Components[Auth Components: GoogleLoginButton, UserAvatar, CalendarSelector]
    end
    
    subgraph Backend
        AuthAPI[/api/auth/*]
        UploadAPI[/api/upload]
        JobsAPI[/api/jobs/:id]
        CalendarAPI[/api/calendars/*]
        GenerateAPI[/api/generate/ics]
    end
    
    Pages --> Hooks
    Hooks --> Services
    Hooks --> Stores
    Services --> AuthAPI
    Services --> UploadAPI
    Services --> JobsAPI
    Services --> CalendarAPI
    Services --> GenerateAPI
    Components --> Hooks
```

## Components and Interfaces

### API Service Layer

#### Base API Client (`services/api.ts`)
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    throw new Error(message);
  }
);
```

#### Auth Service (`services/authService.ts`)
```typescript
export interface AuthUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: AuthUser;
}

export const authService = {
  getLoginUrl: () => `${api.defaults.baseURL}/api/auth/google`,
  getStatus: () => api.get<AuthStatus>('/api/auth/status'),
  logout: () => api.post('/api/auth/logout'),
};
```

#### Upload Service (`services/uploadService.ts`)
```typescript
export interface UploadResponse {
  jobId: string;
  message: string;
}

export const uploadService = {
  uploadPdf: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<UploadResponse>('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
  },
};
```

#### Job Service (`services/jobService.ts`)
```typescript
export interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pdfType: 'weekly' | 'test';
  result?: ParsedEvent[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export const jobService = {
  getStatus: (jobId: string) => api.get<JobStatus>(`/api/jobs/${jobId}`),
};
```

#### Calendar Service (`services/calendarService.ts`)
```typescript
export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
}

export interface GenerateIcsRequest {
  events: EventConfig[];
  semesterStart: string;
  semesterEnd: string;
}

export interface AddEventsRequest extends GenerateIcsRequest {
  calendarId: string;
}

export const calendarService = {
  listCalendars: () => api.get<{ calendars: Calendar[] }>('/api/calendars'),
  createCalendar: (name: string, description?: string) => 
    api.post<Calendar>('/api/calendars', { name, description }),
  addEvents: (request: AddEventsRequest) => 
    api.post<{ message: string; count: number }>('/api/calendars/events', request),
  generateIcs: (request: GenerateIcsRequest) => 
    api.post('/api/generate/ics', request, { responseType: 'blob' }),
};
```

### Auth Store (`stores/authStore.ts`)
```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  checkStatus: () => Promise<void>;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
  reset: () => void;
}
```

### Custom Hooks

#### useAuth Hook
```typescript
export function useAuth() {
  const { isAuthenticated, user, isLoading, error, checkStatus, logout } = useAuthStore();
  
  useEffect(() => {
    checkStatus();
  }, []);
  
  const login = () => {
    window.location.href = authService.getLoginUrl();
  };
  
  return { isAuthenticated, user, isLoading, error, login, logout };
}
```

#### useUpload Hook
```typescript
export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setJobId = useEventStore((s) => s.setJobId);
  
  const upload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const response = await uploadService.uploadPdf(file, setProgress);
      setJobId(response.data.jobId);
      return response.data.jobId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };
  
  return { upload, progress, isUploading, error };
}
```

#### useJobStatus Hook
```typescript
export function useJobStatus(jobId: string | null) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const setEvents = useEventStore((s) => s.setEvents);
  
  useEffect(() => {
    if (!jobId) return;
    
    setIsPolling(true);
    const interval = setInterval(async () => {
      const response = await jobService.getStatus(jobId);
      setStatus(response.data);
      
      if (response.data.status === 'completed') {
        clearInterval(interval);
        setIsPolling(false);
        if (response.data.result) {
          setEvents(response.data.result);
        }
      } else if (response.data.status === 'failed') {
        clearInterval(interval);
        setIsPolling(false);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [jobId]);
  
  return { status, isPolling };
}
```

#### useCalendars Hook
```typescript
export function useCalendars() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchCalendars = async () => {
    setIsLoading(true);
    try {
      const response = await calendarService.listCalendars();
      setCalendars(response.data.calendars);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendars');
    } finally {
      setIsLoading(false);
    }
  };
  
  const createCalendar = async (name: string) => {
    const response = await calendarService.createCalendar(name);
    setCalendars((prev) => [...prev, response.data]);
    return response.data;
  };
  
  return { calendars, isLoading, error, fetchCalendars, createCalendar };
}
```

### Auth Components

#### GoogleLoginButton
```typescript
interface GoogleLoginButtonProps {
  className?: string;
}

export function GoogleLoginButton({ className }: GoogleLoginButtonProps) {
  const { login, isLoading } = useAuth();
  
  return (
    <Button 
      variant="outline" 
      onClick={login} 
      loading={isLoading}
      className={className}
    >
      <GoogleIcon /> Sign in with Google
    </Button>
  );
}
```

#### UserAvatar
```typescript
interface UserAvatarProps {
  user: AuthUser;
  onLogout: () => void;
}

export function UserAvatar({ user, onLogout }: UserAvatarProps) {
  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} className="avatar">
        <img src={user.picture} alt={user.firstName} />
      </div>
      <ul className="dropdown-content menu">
        <li><span>{user.email}</span></li>
        <li><button onClick={onLogout}>Logout</button></li>
      </ul>
    </div>
  );
}
```

#### CalendarSelector
```typescript
interface CalendarSelectorProps {
  calendars: Calendar[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
  isLoading: boolean;
}

export function CalendarSelector({ 
  calendars, 
  selectedId, 
  onSelect, 
  onCreate,
  isLoading 
}: CalendarSelectorProps) {
  // Renders dropdown with calendars, primary highlighted
  // Includes option to create new calendar
}
```

## Data Models

### EventConfig (for API requests)
```typescript
interface EventConfig {
  id: string;
  summary: string;        // "COS 214 - Lecture"
  location: string;       // Venue
  startTime: string;      // "08:30"
  endTime: string;        // "10:20"
  day?: string;           // "Monday" (for recurring)
  date?: string;          // ISO date (for single events)
  isRecurring: boolean;
  colorId: string;        // Google Calendar color ID
}
```

### Mapping ParsedEvent to EventConfig
```typescript
function mapEventToConfig(
  event: ParsedEvent, 
  moduleColors: Record<string, string>
): EventConfig {
  return {
    id: event.id,
    summary: `${event.moduleCode} - ${capitalize(event.eventType)}`,
    location: event.location || '',
    startTime: event.startTime,
    endTime: event.endTime,
    day: event.dayOfWeek,
    isRecurring: true,
    colorId: moduleColors[event.moduleCode] || '1',
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following properties can be verified through property-based testing:

### Property 1: API Error Response Parsing
*For any* API error response containing a message field, the error interceptor should extract and throw that message as the error.
**Validates: Requirements 1.4**

### Property 2: ICS Request Payload Formatting
*For any* set of selected events, module colors, and semester dates, the ICS generation request should contain all events mapped to EventConfig format with correct color IDs.
**Validates: Requirements 5.1**

### Property 3: Calendar Events Request Formatting
*For any* set of selected events and a calendar ID, the add events request should contain properly formatted EventConfig objects with the specified calendar ID.
**Validates: Requirements 6.1**

### Property 4: useAuth Hook Interface Consistency
*For any* authentication state (authenticated or not), the useAuth hook should return an object with isAuthenticated boolean, user (or null), login function, and logout function.
**Validates: Requirements 8.1**

### Property 5: useUpload Hook Interface Consistency
*For any* upload state, the useUpload hook should return an object with upload function, progress number (0-100), isUploading boolean, and error (or null).
**Validates: Requirements 8.2**

### Property 6: useCalendars Hook Interface Consistency
*For any* calendar fetch state, the useCalendars hook should return an object with calendars array, isLoading boolean, error (or null), fetchCalendars function, and createCalendar function.
**Validates: Requirements 8.4**

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Network failure | Display "Connection lost" alert with retry option |
| 401 Unauthorized | Redirect to login or show re-auth prompt |
| 400 Bad Request | Display validation error message from response |
| 500 Server Error | Display generic error with retry option |
| Upload timeout | Show timeout message, allow retry |
| Job polling failure | Stop polling, show error, allow manual retry |

### Error Display Component
```typescript
function ApiErrorAlert({ error, onRetry, onDismiss }: ApiErrorAlertProps) {
  return (
    <Alert type="error" onDismiss={onDismiss}>
      <p>{error}</p>
      {onRetry && <Button size="sm" onClick={onRetry}>Retry</Button>}
    </Alert>
  );
}
```

## Testing Strategy

### Dual Testing Approach

This implementation uses both unit tests and property-based tests:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property-based tests**: Verify universal properties that should hold across all inputs

### Property-Based Testing Framework

The project uses **fast-check** for property-based testing, which is already installed in the frontend dependencies.

Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with a comment referencing the correctness property from this design document
- Use the format: `**Feature: frontend-api-integration, Property {number}: {property_text}**`

### Unit Test Coverage

| Module | Test Focus |
|--------|------------|
| `services/api.ts` | Axios configuration, error interceptor |
| `services/authService.ts` | Login URL generation, status parsing |
| `services/uploadService.ts` | FormData construction, progress callback |
| `services/calendarService.ts` | Request payload formatting |
| `hooks/useAuth.ts` | State transitions, login/logout flows |
| `hooks/useUpload.ts` | Progress tracking, error handling |
| `hooks/useJobStatus.ts` | Polling behavior, completion detection |
| `hooks/useCalendars.ts` | Fetch and create operations |
| `stores/authStore.ts` | State management, persistence |

### Test File Structure
```
frontend/src/
├── services/
│   ├── api.ts
│   ├── api.test.ts
│   ├── authService.ts
│   ├── authService.test.ts
│   └── ...
├── hooks/
│   ├── useAuth.ts
│   ├── useAuth.test.ts
│   └── ...
└── stores/
    ├── authStore.ts
    ├── authStore.test.ts
    └── ...
```

### Mocking Strategy

- Use `vitest` mock functions for API calls in unit tests
- Use `msw` (Mock Service Worker) for integration tests if needed
- Property tests should test pure transformation functions without mocking
