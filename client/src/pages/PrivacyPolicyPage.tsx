import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const LAST_UPDATED = "June 1, 2026";
const CONTACT_EMAIL = "yuvarajthecoder@gmail.com";

export const PrivacyPolicyPage = () => (
  <main className="min-h-screen bg-wa-chatBg px-4 py-10 text-wa-text">
    <div className="mx-auto w-full max-w-3xl">
      <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-wa-subtext hover:text-wa-text">
        <FiArrowLeft /> Back
      </Link>

      <h1 className="mb-2 text-3xl font-black">Privacy Policy</h1>
      <p className="mb-8 text-sm text-wa-subtext">Last updated: {LAST_UPDATED}</p>

      <div className="space-y-6 text-sm leading-relaxed text-wa-text">
        <section>
          <p>
            This Privacy Policy explains how Global Space ("we", "us", or "the app") collects, uses, and protects
            your information when you use our mobile application and website. By using Global Space, you agree to
            the practices described in this policy.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">1. Information We Collect</h2>
          <p>We collect the following information that you provide or that is generated when you use Global Space:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li><strong>Account information:</strong> username, email address, and password (passwords are stored encrypted).</li>
            <li><strong>Google Sign-In data:</strong> if you sign in with Google, we receive your name, email address, Google account ID, and profile picture.</li>
            <li><strong>Profile information:</strong> any bio, avatar, or profile details you choose to add.</li>
            <li><strong>Content:</strong> posts, messages, and other content you create or send within the app.</li>
            <li><strong>Usage data:</strong> basic technical information needed to operate the service, such as session activity.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">2. How We Use Your Information</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>To create and manage your account and authenticate you.</li>
            <li>To enable core features such as messaging, posting, and profiles.</li>
            <li>To send transactional emails such as password reset links.</li>
            <li>To maintain the security and integrity of the service.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">3. How We Share Your Information</h2>
          <p>
            We do not sell your personal information. We only share data with third-party services that are
            necessary to operate the app, including:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li><strong>Google</strong> — for Google Sign-In authentication.</li>
            <li><strong>Email provider (Resend)</strong> — to deliver transactional emails such as password resets.</li>
          </ul>
          <p className="mt-2">
            We may also disclose information if required by law or to protect the rights and safety of our users.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">4. Data Retention</h2>
          <p>
            We retain your account information and content for as long as your account is active. When you delete
            your account, we remove your personal data from our active systems.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">5. Data Security</h2>
          <p>
            We use industry-standard measures to protect your data, including encrypted passwords and secure
            session-based authentication. No method of transmission or storage is completely secure, but we work to
            protect your information.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">6. Your Rights</h2>
          <p>
            You may access, update, or delete your account information at any time from within the app. To request
            full deletion of your data, contact us at the email below.
          </p>
        </section>
        
        <section>
          <h2 className="mb-2 text-lg font-bold">7. Children's Privacy</h2>
          <p>
            Global Space is not intended for children under 13. We do not knowingly collect personal information
            from children under 13.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
            "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-wa-greenDark">{CONTACT_EMAIL}</a>.
          </p>
        </section>
      </div>
    </div>
  </main>
);
