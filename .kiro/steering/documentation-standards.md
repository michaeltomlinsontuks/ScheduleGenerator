---
inclusion: always
---

# Documentation Standards for UP Schedule Generator

## Purpose
This steering document defines the standards for all documentation in the UP Schedule Generator project. All documentation should be consistent, comprehensive, and accessible to both humans and LLMs.

## Documentation Principles

### 1. Dual Audience
- **Human-readable**: Clear, concise, well-structured for developers and users
- **LLM-readable**: Structured with clear sections, consistent formatting, explicit relationships

### 2. Consistency
- Use consistent terminology across all documents
- Follow the same structure for similar document types
- Maintain uniform formatting and style

### 3. Completeness
- Every component should have documentation
- Include purpose, architecture, API, and examples
- Document both happy paths and error cases

### 4. Maintainability
- Keep documentation close to code when possible
- Update documentation with code changes
- Use references instead of duplication

## Document Types

### Architecture Documents
**Purpose**: Explain system design and component relationships
**Location**: `docs/architecture/`
**Structure**:
- Overview
- System Context
- Component Diagram
- Data Flow
- Technology Choices
- Design Decisions

### Component Documentation
**Purpose**: Detail individual components/services
**Location**: `docs/components/`
**Structure**:
- Purpose
- Responsibilities
- Architecture
- API/Interface
- Dependencies
- Configuration
- Error Handling
- Examples

### API Documentation
**Purpose**: Document REST APIs and interfaces
**Location**: Service-specific (e.g., `backend/API_DOCUMENTATION.md`)
**Structure**:
- Endpoint list
- Request/Response schemas
- Authentication
- Error codes
- Examples

### User Guides
**Purpose**: Help end users accomplish tasks
**Location**: `docs/guides/`
**Structure**:
- Prerequisites
- Step-by-step instructions
- Screenshots/examples
- Troubleshooting
- FAQ

### Development Guides
**Purpose**: Help developers work with the codebase
**Location**: `docs/development/`
**Structure**:
- Setup instructions
- Development workflow
- Testing guidelines
- Contribution guidelines
- Code standards

## Formatting Standards

### Markdown Structure
```markdown
# Document Title

Brief description (1-2 sentences)

## Table of Contents (for long docs)

## Section 1
Content...

### Subsection 1.1
Content...

## Examples
Concrete examples with code blocks

## References
Links to related documentation
```

### Code Blocks
- Always specify language: ```typescript, ```python, ```bash
- Include comments for complex code
- Show both input and output where relevant

### Diagrams
- Use Mermaid for architecture diagrams
- Use ASCII art for simple flows
- Include alt text for accessibility

### Links
- Use relative links for internal documentation
- Use descriptive link text (not "click here")
- Verify links are not broken

## Terminology Standards

### System Components
- **Frontend**: Next.js web application
- **Backend**: NestJS API server
- **PDF Worker**: Python FastAPI service for PDF parsing
- **Database**: PostgreSQL database
- **Cache/Queue**: Redis for caching and job queues
- **Object Storage**: MinIO for file storage
- **Reverse Proxy**: Traefik for routing and TLS

### Common Terms
- **Job**: Asynchronous PDF processing task
- **Event**: Calendar event extracted from PDF
- **Module**: University course (e.g., COS 214)
- **Activity**: Event type (Lecture, Tutorial, Practical, Test)
- **Venue**: Physical location of event
- **Recurring Event**: Weekly repeating calendar event
- **One-time Event**: Single occurrence (tests, exams)

### File Types
- **Weekly Schedule PDF**: Contains recurring lectures/tutorials
- **Test Schedule PDF**: Contains one-time test events
- **Exam Schedule PDF**: Contains one-time exam events

## Documentation Maintenance

### When to Update
- When adding new features
- When changing APIs or interfaces
- When fixing bugs that affect documented behavior
- When deprecating functionality
- When receiving user feedback about unclear docs

### Review Process
- Documentation changes should be reviewed with code changes
- Check for broken links and outdated information
- Verify examples still work
- Update version numbers and dates

## File Organization

```
docs/
├── architecture/          # System design documents
│   ├── overview.md
│   ├── data-flow.md
│   └── deployment.md
├── components/           # Component-specific docs
│   ├── frontend.md
│   ├── backend.md
│   ├── pdf-worker.md
│   └── infrastructure.md
├── api/                  # API reference
│   ├── rest-api.md
│   └── websockets.md
├── guides/              # User guides
│   ├── getting-started.md
│   ├── uploading-pdfs.md
│   └── troubleshooting.md
└── development/         # Developer guides
    ├── setup.md
    ├── testing.md
    └── contributing.md
```

## Quality Checklist

Before considering documentation complete, verify:
- [ ] Purpose is clearly stated
- [ ] Target audience is identified
- [ ] All sections are complete
- [ ] Code examples are tested and work
- [ ] Links are valid
- [ ] Diagrams are clear and accurate
- [ ] Terminology is consistent
- [ ] Grammar and spelling are correct
- [ ] Document is properly formatted
- [ ] Related documents are cross-referenced
