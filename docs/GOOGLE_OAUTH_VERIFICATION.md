# Google OAuth Verification Guide for Schedule Generator

This guide outlines the steps required to get your "Schedule Generator" application approved by Google for OAuth, specifically for the sensitive scopes required (Calendar access).

## Prerequisites

1.  **Privacy Policy**: You must have a privacy policy hosted at a publicly accessible URL (e.g., `https://schedgen-frontend.fly.dev/privacy`).
2.  **Terms of Service**: You must have a terms of service page hosted at a publicly accessible URL (e.g., `https://schedgen-frontend.fly.dev/terms`).
3.  **Domain Verification**: You must verify ownership of your domain (e.g., `schedgen-frontend.fly.dev`) in the Google Search Console.

## Steps to Verification

### 1. Configure Consent Screen

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project.
3.  Navigate to **APIs & Services** > **OAuth consent screen**.
4.  **User Type**: Select **External**.
5.  **App Information**:
    *   **App name**: Schedule Generator (or your specific branding).
    *   **User support email**: Your email address.
    *   **App logo**: Upload your application logo (optional but recommended).
6.  **App Domain**:
    *   **Application home page**: `https://schedgen-frontend.fly.dev`
    *   **Privacy policy link**: `https://schedgen-frontend.fly.dev/privacy`
    *   **Terms of service link**: `https://schedgen-frontend.fly.dev/terms`
7.  **Authorized Domains**: Add `fly.dev` (or your custom domain).
8.  **Developer Contact Information**: Enter your email address.

### 2. Add Scopes

1.  Click **Save and Continue** to go to the **Scopes** section.
2.  Click **Add or Remove Scopes**.
3.  Search for and select:
    *   `.../auth/userinfo.email` (email) - *Non-sensitive*
    *   `.../auth/userinfo.profile` (profile) - *Non-sensitive*
    *   `.../auth/calendar` (See, edit, share, and permanently delete all the calendars you can access using Google Calendar) - **Sensitive**
    *   `.../auth/calendar.events` (View and edit events on all your calendars) - **Sensitive**
4.  Click **Update**.
5.  **Justification**: You will be asked to explain *why* you need these sensitive scopes.
    *   *Explanation*: "The application takes university schedule PDFs uploaded by the user, parses them, and automatically creates calendar events on the user's chosen Google Calendar. Write access is required to create these events."

### 3. Test Users (While in Testing)

While your app is in "Testing" mode, only users listed here can log in.
1.  Add your own email address.
2.  Add any other testers.

### 4. Submit for Verification

1.  Once you are ready for the public to use it, click **Publish App** on the OAuth consent screen summary page.
2.  Because you are requesting **Sensitive Scopes** (`calendar`, `calendar.events`), Google will require a verification process.
3.  **Video Demo**: You will likely be asked to provide a YouTube video demonstrating the OAuth flow.
    *   Show the URL bar to prove it's the correct Client ID.
    *   Show the login process.
    *   Show the consent screen requesting permissions.
    *   Show the application using the permission (creating a calendar event).
4.  **Wait**: Verification can take several days to weeks. Google may email you with questions.

## Common Rejection Reasons

*   **Missing Privacy Policy**: Content must clearly explain what data is collected and how it's used.
*   **Branding Mismatch**: The logo or app name on the consent screen doesn't match the live application.
*   **Homepage Not Accessible**: The provided homepage URL returns an error.
*   **Insufficient Justification**: You didn't clearly explain why the sensitive scope is needed.

## Notes for Fly.io

Ensure your callback URL in the Google Cloud Console credentials matches exactly what is in your backend `fly.toml`:
`https://api.tuks-pdf-calendar.co.za/api/auth/google/callback`
