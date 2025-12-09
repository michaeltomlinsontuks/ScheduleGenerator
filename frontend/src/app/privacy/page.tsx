export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none">
        <div className="card bg-base-200 shadow-sm mb-8 not-prose border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-primary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              What you need to know (TL;DR)
            </h2>
            <ul className="space-y-2 mt-2">
              <li className="flex gap-2 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Zero Data Retention:</strong> We delete your PDF immediately after processing.</span>
              </li>
              <li className="flex gap-2 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Privacy First:</strong> Your email, name, and profile picture are only held temporarily for your active session and are never saved to a database.</span>
              </li>
              <li className="flex gap-2 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>You Control Data:</strong> Events live in your Google Calendar, not on our servers.</span>
              </li>
              <li className="flex gap-2 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Secure:</strong> We don't share your data with anyone (except Google for the calendar sync).</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-8">Last updated: November 30, 2024</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p>
            UP Schedule Generator ("we", "our", "us") operates this website. This page informs you of our
            policies regarding the collection, use, and disclosure of personal data when you use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p>We collect the following information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Google Account Information:</strong> Email address, name, and profile picture when you sign in with Google</li>
            <li><strong>Uploaded Files:</strong> PDF schedule files you upload (temporarily stored during processing)</li>
            <li><strong>Session Data:</strong> Temporary session information stored in your browser</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To authenticate your identity via Google OAuth</li>
            <li>To process your uploaded PDF schedule files</li>
            <li>To create calendar events in your Google Calendar</li>
            <li>To provide and maintain our service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Storage and Retention</h2>
          <p><strong>Important:</strong> We do not permanently store your data after processing is complete.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>PDF Files:</strong> Deleted immediately after processing (typically within minutes)</li>
            <li><strong>Extracted Events:</strong> Stored temporarily in your browser session only</li>
            <li><strong>User Account Data:</strong> Your Google account email, name, and profile picture are stored temporarily in your session for authentication</li>
            <li><strong>Calendar Events:</strong> Created directly in your Google Calendar and remain there until you delete them</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>All data transmission uses HTTPS encryption</li>
            <li>Uploaded files are processed in isolated, secure environments</li>
            <li>Files are automatically deleted after processing</li>
            <li>We do not share your data with third parties except as required to provide the service (Google Calendar API)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Google OAuth & Calendar API:</strong> For authentication and creating calendar events</li>
            <li><strong>Google's Privacy Policy:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://policies.google.com/privacy</a></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p>You have the following rights regarding your data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> You can request information about the data we store</li>
            <li><strong>Deletion:</strong> You can request deletion of your account and associated data</li>
            <li><strong>Revoke Access:</strong> You can revoke Google Calendar access at any time through your Google Account settings</li>
            <li><strong>Data Portability:</strong> Calendar events remain in your Google Calendar and can be exported using Google's tools</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cookies and Local Storage</h2>
          <p>
            We use browser local storage to maintain your session and temporarily store extracted events.
            This data is stored only in your browser and is not transmitted to our servers except when
            you explicitly choose to sync events to your calendar.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
          <p>
            Our service is intended for university students and does not knowingly collect information
            from children under 13. If you believe we have collected information from a child under 13,
            please contact us immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by
            posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mt-2">
            <strong>Email:</strong> <a href="mailto:michael@tomlinson.co.za" className="text-blue-600 hover:underline">michael@tomlinson.co.za</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">GDPR Compliance</h2>
          <p>
            If you are located in the European Economic Area (EEA), you have certain data protection rights.
            We aim to take reasonable steps to allow you to correct, amend, delete, or limit the use of your
            personal data.
          </p>
        </section>
      </div>
    </div>
  );
}
