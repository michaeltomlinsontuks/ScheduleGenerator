# Frontend Documentation

Next.js frontend implementation details and guides.

```mermaid
graph TD
    A[Frontend] --> B[Architecture]
    A --> C[Features]
    A --> D[State Management]
    
    C --> C1[Authentication]
    C --> C2[File Upload]
    C --> C3[Event Management]
    C --> C4[Calendar Export]
    
    D --> D1[Zustand Stores]
    D --> D2[LocalStorage Persistence]
    D --> D3[Session State]
    
    D1 --> D1A[Event Store]
    D1 --> D1B[Config Store]
    D1 --> D1C[Auth Store]
```

## Implementation Guides

### Core Features
- [State Management](./state-management.md) - Zustand store architecture
- [Storage Handling](./storage-handling.md) - LocalStorage persistence
- [Session Persistence](./session-persistence.md) - Cross-session state

### Components
- [Upload Flow](./upload-flow.md) - PDF upload workflow
- [Event Management](./event-management.md) - Event editing and filtering
- [Calendar Export](./calendar-export.md) - ICS and Google Calendar

### Testing
- [Component Testing](./testing-components.md) - React component tests
- [Store Testing](./testing-stores.md) - State management tests
- [Storage Testing](./testing-storage.md) - LocalStorage tests

## Architecture

```mermaid
flowchart TB
    subgraph Pages
        A[Home]
        B[Upload]
        C[Events]
        D[Export]
    end
    
    subgraph Stores
        E[Event Store]
        F[Config Store]
        G[Auth Store]
    end
    
    subgraph Utils
        H[Storage]
        I[API Client]
        J[Toast]
    end
    
    subgraph Backend
        K[API]
    end
    
    A --> E
    B --> E
    B --> I
    C --> E
    D --> E
    
    E --> H
    F --> H
    G --> H
    
    I --> K
```

## State Flow

```mermaid
sequenceDiagram
    participant U as User
    participant P as Page
    participant S as Store
    participant L as LocalStorage
    participant A as API
    
    U->>P: Upload PDF
    P->>A: POST /upload
    A-->>P: Job ID
    P->>S: Update State
    S->>L: Persist
    
    U->>P: Navigate Away
    P->>L: Save State
    
    U->>P: Return
    L->>S: Restore State
    S->>P: Render
```

## Quick Reference

### Development
```bash
# Start dev server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Build production
npm run build
```

### Key Files
- `src/stores/` - Zustand stores
- `src/utils/storage.ts` - Storage utilities
- `src/app/` - Next.js pages
- `src/components/` - React components

## Configuration

Environment variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - OAuth client ID

See [Environment Configuration](../../docs/development/environment.md)
