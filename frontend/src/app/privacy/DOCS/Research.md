<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/app/privacy
researched_at_commit: 54ff10ec3c1c30794b2631b06cb113f52787a575
sources:
  - path: frontend/src/app/privacy/page.tsx
    blob_sha: 5a43fed1c00af119ee5ad69f9c4f71c61edf2275
-->

# Research: frontend/src/app/privacy

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-app-privacy.173cc638`

The unit frontend/src/app/privacy contains a single source file, frontend/src/app/privacy/page.tsx, which exports a default PrivacyPage component.

- `frontend/src/app/privacy/page.tsx` L1-L159 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.06d54963`

The PrivacyPage component renders a static Privacy Policy page for the Tuks Schedule Generator service, headed by the title 'Privacy Policy'.

- `frontend/src/app/privacy/page.tsx` L1-L4 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.a786a279`

The PrivacyPage component is a presentational component that takes no props, holds no state, and performs no data fetching; its body is a single JSX return of static content.

- `frontend/src/app/privacy/page.tsx` L1-L2 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275
- `frontend/src/app/privacy/page.tsx` L158-L159 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.9b291345`

The page opens with a 'What you need to know (TL;DR)' summary card listing four key points: PDFs are deleted immediately after processing (zero data retention), email/name/profile picture are held only temporarily for the active session and never saved to a database, events live in the user's Google Calendar rather than on the service's servers, and data is not shared with anyone except Google for the calendar sync.

- `frontend/src/app/privacy/page.tsx` L7-L42 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.828771e3`

The page displays the text 'Last updated: December 2025' beneath the summary card.

- `frontend/src/app/privacy/page.tsx` L44-L44 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.a7c28641`

The page's 'Introduction' section identifies the service as Tuks Schedule Generator ("we", "our", "us") and states the page informs users of the policies regarding the collection, use, and disclosure of personal data when using the service.

- `frontend/src/app/privacy/page.tsx` L46-L52 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.08b22396`

The page's 'Information We Collect' section lists Google Account Information (email address, name, and profile picture when signing in with Google), Uploaded Files (PDF schedule files temporarily stored during processing), and Session Data (temporary session information stored in the browser).

- `frontend/src/app/privacy/page.tsx` L54-L62 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.ddc51185`

The page's 'How We Use Your Information' section states the collected information is used to authenticate the user's identity via Google OAuth, to process uploaded PDF schedule files, to create calendar events in the user's Google Calendar, and to provide and maintain the service.

- `frontend/src/app/privacy/page.tsx` L64-L73 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.b0ee3492`

The page's 'Data Storage and Retention' section states the service does not permanently store data after processing is complete: PDF files are deleted immediately after processing (typically within minutes), extracted events are stored temporarily in the browser session only, user account data is stored temporarily in the session for authentication, and calendar events are created directly in the user's Google Calendar and remain there until the user deletes them.

- `frontend/src/app/privacy/page.tsx` L75-L84 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.29d65031`

The page's 'Data Security' section states the service implements industry-standard security measures: all data transmission uses HTTPS encryption, uploaded files are processed in isolated secure environments, files are automatically deleted after processing, and data is not shared with third parties except as required to provide the service (Google Calendar API).

- `frontend/src/app/privacy/page.tsx` L86-L97 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.094bff10`

The page's 'Third-Party Services' section lists Google OAuth & Calendar API as the third-party service used for authentication and creating calendar events, and links to Google's privacy policy at https://policies.google.com/privacy.

- `frontend/src/app/privacy/page.tsx` L99-L106 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.1eafdc5c`

The page's 'Your Rights' section states users can request information about any data the service holds (noting the service does not store any), that there is no account to delete since data is not stored, that Google Calendar access can be revoked at any time through Google Account settings, and that calendar events remain in the user's Google Calendar and can be exported using Google's tools.

- `frontend/src/app/privacy/page.tsx` L108-L117 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.2d3ab8cb`

The page's 'Cookies and Local Storage' section states the service uses browser local storage to maintain the session and temporarily store extracted events, and that this data is stored only in the browser and is not transmitted to the service's servers except when the user explicitly chooses to sync events to the calendar.

- `frontend/src/app/privacy/page.tsx` L119-L126 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.f5d5f7e7`

The page's 'Children's Privacy' section states the service is intended for university students and does not knowingly collect information from children under 13, and asks users to contact the service immediately if they believe information from a child under 13 has been collected.

- `frontend/src/app/privacy/page.tsx` L128-L135 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.f35515be`

The page's 'Changes to This Policy' section states the Privacy Policy may be updated from time to time, and that users will be notified of any changes by posting the new Privacy Policy on the page and updating the 'Last updated' date.

- `frontend/src/app/privacy/page.tsx` L137-L143 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

### `research.frontend-src-app-privacy.b9a38460`

The page's 'Contact Us' section provides the email address michael@tomlinson.co.za for questions about the Privacy Policy.

- `frontend/src/app/privacy/page.tsx` L145-L153 @5a43fed1c00af119ee5ad69f9c4f71c61edf2275

## Open questions

None.
