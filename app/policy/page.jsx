export const metadata = {
  title: 'Asimos Privacy Policy',
  description: 'Privacy Policy for Asimos',
};

export default function PolicyPage() {
  return (
    <main className="policyPage">
      <div className="policyCard">
        <h1>Privacy Policy</h1>
        <p className="updated">Last updated: February 2026</p>

        <p>
          This Privacy Policy explains how Asimos collects, uses, and protects information when you use our
          mobile application and website.
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li>Account details (such as name, email, phone number) if you provide them.</li>
          <li>Usage information (feature interactions, basic diagnostics, crash logs).</li>
          <li>Device information (device model, OS version, app version).</li>
        </ul>

        <h2>2. How We Use Information</h2>
        <ul>
          <li>To provide and improve app functionality.</li>
          <li>To communicate with you about updates or support requests.</li>
          <li>To maintain security and prevent abuse.</li>
        </ul>

        <h2>3. Data Sharing</h2>
        <p>
          We do not sell your personal data. We may share limited information with service providers used for
          hosting, analytics, crash reporting, and infrastructure support, only as needed to operate the app.
        </p>

        <h2>4. Data Retention</h2>
        <p>
          We retain information only as long as necessary for service operation, legal obligations, or dispute
          resolution.
        </p>

        <h2>5. Your Rights</h2>
        <p>
          Depending on your region, you may request access, correction, or deletion of your personal data. You
          may contact us using the email below.
        </p>

        <h2>6. Children&apos;s Privacy</h2>
        <p>
          Asimos is not intended for children under the age required by local law without parental consent. We
          do not knowingly collect personal information from children in violation of applicable law.
        </p>

        <h2>7. Contact</h2>
        <p>
          If you have any privacy questions, contact us at: <a href="mailto:asimos.org@gmail.com">asimos.org@gmail.com</a>
        </p>
      </div>
    </main>
  );
}
