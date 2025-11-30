export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-600 mb-8">Last updated: November 30, 2024</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
          <p>
            By accessing and using UP Schedule Generator ("the Service"), you accept and agree to be bound 
            by the terms and provisions of this agreement. If you do not agree to these terms, please do 
            not use the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
          <p>
            UP Schedule Generator is a web application that converts University of Pretoria (UP) class 
            schedule PDF files into Google Calendar events. The Service allows you to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Upload PDF schedule files</li>
            <li>Extract and preview calendar events</li>
            <li>Customize event details</li>
            <li>Sync events to your Google Calendar</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">User Responsibilities</h2>
          <p>You agree to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide accurate information when using the Service</li>
            <li>Use the Service only for lawful purposes</li>
            <li>Not attempt to gain unauthorized access to the Service or its systems</li>
            <li>Not upload malicious files or content</li>
            <li>Not abuse, harass, or overload the Service</li>
            <li>Keep your Google account credentials secure</li>
            <li>Verify the accuracy of extracted calendar events before syncing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Google Calendar Access</h2>
          <p>
            By authorizing Google Calendar access, you permit the Service to create calendar events in 
            your Google Calendar on your behalf. You understand that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Events are created only when you explicitly click "Sync to Calendar"</li>
            <li>You can revoke this access at any time through your Google Account settings</li>
            <li>You are responsible for managing and deleting events in your calendar</li>
            <li>The Service does not modify or delete existing calendar events</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Processing and Privacy</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy. Key points:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Uploaded PDF files are processed and deleted immediately after processing</li>
            <li>We do not permanently store your schedule data</li>
            <li>Extracted events are stored temporarily in your browser session only</li>
            <li>Calendar events are created directly in your Google Calendar</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Accuracy and Verification</h2>
          <p>
            While we strive for accuracy in extracting schedule information from PDF files:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>The Service uses automated PDF parsing which may not be 100% accurate</li>
            <li>You are responsible for verifying all extracted information before syncing</li>
            <li>We recommend reviewing the preview page carefully</li>
            <li>The Service is provided for convenience and should not be your sole source of schedule information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
          <p>
            The Service, including its original content, features, and functionality, is owned by 
            UP Schedule Generator and is protected by international copyright, trademark, and other 
            intellectual property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
          <p>
            The Service is provided "as is" without warranties of any kind, either express or implied. 
            To the fullest extent permitted by law:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not warrant that the Service will be uninterrupted or error-free</li>
            <li>We are not liable for any damages arising from use of the Service</li>
            <li>We are not responsible for errors in extracted schedule information</li>
            <li>We are not liable for missed classes or events due to incorrect calendar entries</li>
            <li>You use the Service at your own risk</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
          <p>
            We strive to maintain high availability but:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>The Service may be temporarily unavailable due to maintenance or technical issues</li>
            <li>We reserve the right to modify or discontinue the Service at any time</li>
            <li>We are not liable for any interruption of service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">User Content</h2>
          <p>
            Regarding files you upload:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You retain all rights to your uploaded PDF files</li>
            <li>You grant us a temporary license to process your files for the purpose of providing the Service</li>
            <li>Files are deleted immediately after processing</li>
            <li>We do not claim ownership of your content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Termination</h2>
          <p>
            We may terminate or suspend your access to the Service immediately, without prior notice or 
            liability, for any reason, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Breach of these Terms</li>
            <li>Abusive or harmful behavior</li>
            <li>Violation of applicable laws</li>
          </ul>
          <p className="mt-4">
            You may also terminate your use of the Service at any time by revoking Google Calendar access 
            through your Google Account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, 
            we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes 
            a material change will be determined at our sole discretion.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of South Africa, 
            without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
          <p>
            Any disputes arising from these Terms or use of the Service shall be resolved through good 
            faith negotiation. If negotiation fails, disputes shall be resolved in the courts of South Africa.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Severability</h2>
          <p>
            If any provision of these Terms is held to be unenforceable or invalid, such provision will be 
            changed and interpreted to accomplish the objectives of such provision to the greatest extent 
            possible under applicable law, and the remaining provisions will continue in full force and effect.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p className="mt-2">
            <strong>Email:</strong> <a href="mailto:legal@upschedule.com" className="text-blue-600 hover:underline">legal@upschedule.com</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Acknowledgment</h2>
          <p>
            By using the Service, you acknowledge that you have read these Terms of Service and agree to 
            be bound by them.
          </p>
        </section>
      </div>
    </div>
  );
}
