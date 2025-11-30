# Google OAuth Verification Quick Checklist

Fast-track checklist for Google OAuth verification.

## Quick Decision

```
Do you have 100+ users? ──No──> Stay in Testing Mode
         │
        Yes
         │
         ▼
Ready to spend 4-8 weeks? ──No──> Stay in Testing Mode
         │
        Yes
         │
         ▼
    Apply for Verification
```

## Pre-Flight Check (5 minutes)

- [ ] Application deployed on custom domain (not localhost)
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Application is functional and tested
- [ ] You own the domain

**If any are unchecked, stop here and complete them first.**

## Required Pages (2-3 hours)

Create these pages on your domain:

### 1. Privacy Policy
- [ ] `https://yourdomain.com/privacy` exists
- [ ] Explains what data you collect
- [ ] Explains how you use data
- [ ] Explains how users can delete data
- [ ] Includes contact email
- [ ] Mentions Google Calendar API usage

**Template:** See [full guide](./GOOGLE_OAUTH_VERIFICATION_GUIDE.md#1-privacy-policy-template)

### 2. Terms of Service
- [ ] `https://yourdomain.com/terms` exists
- [ ] Describes the service
- [ ] Explains user responsibilities
- [ ] Includes limitation of liability
- [ ] Includes contact email

**Template:** See [full guide](./GOOGLE_OAUTH_VERIFICATION_GUIDE.md#2-terms-of-service-template)

### 3. Homepage
- [ ] `https://yourdomain.com` exists
- [ ] Clearly describes your app
- [ ] Links to privacy policy
- [ ] Links to terms of service
- [ ] Shows support contact

## OAuth Consent Screen (30 minutes)

Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → OAuth consent screen

### App Information
- [ ] App name: `UP Schedule Generator`
- [ ] User support email: `support@yourdomain.com`
- [ ] App logo uploaded (120x120 PNG)

### App Domain
- [ ] Application home page: `https://yourdomain.com`
- [ ] Privacy policy link: `https://yourdomain.com/privacy`
- [ ] Terms of service link: `https://yourdomain.com/terms`

### Authorized Domains
- [ ] Added: `yourdomain.com`

### Developer Contact
- [ ] Email: `developer@yourdomain.com`

### Scopes
- [ ] Added: `https://www.googleapis.com/auth/userinfo.email`
- [ ] Added: `https://www.googleapis.com/auth/userinfo.profile`
- [ ] Added: `https://www.googleapis.com/auth/calendar.events`

## Domain Verification (15 minutes)

Go to [Google Search Console](https://search.google.com/search-console)

- [ ] Domain added
- [ ] Verification method chosen (DNS recommended)
- [ ] Verification completed
- [ ] Verification status: ✅ Verified

**DNS Verification:**
```
Type: TXT
Name: @
Value: google-site-verification=XXXXXXXXXXXXX
```

## Video Demonstration (1-2 hours)

Record a 2-3 minute video showing:

- [ ] Homepage and app description
- [ ] User clicking "Sign in with Google"
- [ ] OAuth consent screen with permissions
- [ ] User completing sign in
- [ ] User uploading a PDF
- [ ] Events being extracted
- [ ] Events being synced to Google Calendar
- [ ] Opening Google Calendar to show created events
- [ ] Where user email/profile is displayed
- [ ] How to revoke access (Google Account settings)

**Upload to:**
- [ ] YouTube (unlisted)
- [ ] Video link ready: `https://youtube.com/watch?v=XXXXX`

## Scope Justifications (30 minutes)

Prepare detailed explanations:

### calendar.events
```
Required to create calendar events in the user's Google Calendar 
based on their uploaded class schedule PDF. Users explicitly 
authorize this to sync their schedule. Events are created only 
when the user clicks "Sync to Calendar" button.
```

### userinfo.email
```
Required to identify users and associate uploaded schedules with 
their account. Used for authentication and account management. 
Displayed in the user profile section of the application.
```

### userinfo.profile
```
Required to display the user's name in the application interface 
for personalization. Shown in the header and profile page.
```

## Security Questionnaire (1-2 hours)

Be ready to answer:

- [ ] How do you store user data? (Encrypted PostgreSQL database)
- [ ] Where are servers located? (AWS region)
- [ ] Do you share data with third parties? (No, except Google Calendar API)
- [ ] How do users delete their data? (Account deletion page)
- [ ] What security measures do you have? (HTTPS, encrypted storage, secure sessions)
- [ ] How do you handle API credentials? (Environment variables, not in code)
- [ ] Do you log user data? (Only for debugging, no sensitive data)

## Submit for Verification (15 minutes)

In Google Cloud Console:

1. [ ] Click "Publish App"
2. [ ] Click "Prepare for Verification"
3. [ ] Complete verification form:
   - [ ] Application name
   - [ ] Application type: Web Application
   - [ ] Application description (2-3 sentences)
   - [ ] Why you need user data (2-3 sentences)
   - [ ] Scope justifications (paste from above)
   - [ ] Video demonstration link
   - [ ] Privacy policy link
   - [ ] Terms of service link
4. [ ] Submit application

## Post-Submission (2-6 weeks)

- [ ] Check email daily for Google responses
- [ ] Respond to questions within 24 hours
- [ ] Provide additional documentation if requested
- [ ] Complete security assessment if required

## Testing Mode Alternative

If you're not ready for verification:

- [ ] Keep app in "Testing" mode
- [ ] Add test users (up to 100):
   - Go to OAuth consent screen
   - Click "Add Users"
   - Enter email addresses
- [ ] Test users won't see warning screen
- [ ] Apply for verification when ready

## Common Mistakes to Avoid

❌ Using localhost in redirect URIs  
❌ Privacy policy missing data retention info  
❌ Video doesn't show actual data usage  
❌ Domain not verified  
❌ Scope justifications too vague  
❌ Terms of service missing  
❌ Support email not working  
❌ App not deployed before applying  

## Timeline

```
Week 1: Prepare documentation
Week 2: Configure OAuth, record video
Week 3: Submit application
Weeks 4-8: Google review process
Week 9+: Approved and live
```

## Cost Estimate

**Minimum:**
- Domain: $10-15/year
- Time: 8-12 hours
- Total: ~$15

**If Security Assessment Required:**
- Assessment: $15,000-$75,000
- Legal review: $500-$2,000
- Total: $15,500-$77,000

**For UP Schedule Generator:** Likely $15 (no paid assessment needed)

## Quick Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
- [Google Search Console](https://search.google.com/search-console)
- [Full Verification Guide](./GOOGLE_OAUTH_VERIFICATION_GUIDE.md)

## Need Help?

- **Detailed guide:** [Google OAuth Verification Guide](./GOOGLE_OAUTH_VERIFICATION_GUIDE.md)
- **Google docs:** [OAuth Verification Requirements](https://support.google.com/cloud/answer/9110914)
- **Questions:** Create GitHub issue

---

**Checklist Version:** 1.0  
**Last Updated:** 2024-11-30  
**Estimated Time:** 8-12 hours preparation + 2-6 weeks review
