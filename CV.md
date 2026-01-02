# Tuks Schedule Generator - Development Journey

## V1: Problem Discovery (Late 2024 → Early 2025)

### The Problem
- University schedules distributed as PDF files compiled from LaTeX
- Manual calendar entry was tedious and error-prone
- Existing PDF-to-CSV tools made parsing mistakes

### Initial Solution
- Built a Python script to convert extracted CSV data into .ics calendar files
- Learned PDF structure and how LaTeX compiles to formatted output

### Limitations Identified
- No support for recurring events
- No colour-coding for different class types
- Still relied on third-party PDF extraction tools

---

## V2: CLI Tool & API Integration (Late 2025)

### Goals
- Eliminate all external dependencies
- Direct integration with Google Calendar API
- Reliable, repeatable PDF parsing

### Technical Implementation
- Reverse-engineered LaTeX-compiled PDF structure for accurate column extraction
- Implemented Google OAuth 2.0 authentication flow (unverified - personal use only)
- Built CLI interface with full test coverage

### API Lessons Learned
- Initial App Script approach hit Google rate limits
- Redesigned to handle API throttling gracefully
- Understood OAuth scopes and token management

### Results
- Fully automated schedule-to-calendar pipeline
- Support for recurring events and colour-coding
- Robust error handling for edge cases in PDF parsing

---

## V3: Web Application & DevOps (Late 2025 → Present)

### Motivation
- Make the tool accessible to other students
- Learn production deployment and infrastructure
- Build portfolio piece demonstrating full-stack skills

### Architecture Evolution
- Initial over-engineered design: NestJS API, Python PDF container, S3, BullMQ, Postgres, Redis
- Recognized complexity exceeded requirements for ~20k potential users
- Simplified to synchronous processing with Fly.io's built-in scaling

### Infrastructure & DevOps
- Containerized services deployed on Fly.io
- Configured SSL certificates and custom domain
- Managed environment secrets across development and production

### OAuth Production Verification
- Completed Google OAuth verification process for public access
- Navigated strict requirements (privacy policy, terms of service, scope justification)
- Learned about Google's security review process

### Key Learnings
- Trade-offs between architectural complexity and operational overhead
- DNS configuration nuances: OAuth domains, SSL certificates, environment parity
- Importance of iterating on UI based on real user feedback
- Used AI-assisted development (Antigravity) for rapid frontend prototyping
