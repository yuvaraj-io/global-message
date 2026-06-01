import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const CONTACT_EMAIL = "yuvarajthecoder@gmail.com";

export const DeleteAccountPage = () => (
  <main className="min-h-screen bg-wa-chatBg px-4 py-10 text-wa-text">
    <div className="mx-auto w-full max-w-3xl">
      <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-wa-subtext hover:text-wa-text">
        <FiArrowLeft /> Back
      </Link>

      <h1 className="mb-2 text-3xl font-black">Delete Your Account</h1>
      <p className="mb-8 text-sm text-wa-subtext">Global Space — account and data deletion</p>

      <div className="space-y-6 text-sm leading-relaxed text-wa-text">
        <section>
          <p>
            This page explains how to request deletion of your Global Space account and the personal data
            associated with it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">Option 1 — Delete from within the app</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-6">
            <li>Open the Global Space app and log in.</li>
            <li>Go to your <strong>Profile</strong>.</li>
            <li>Open <strong>Settings / Edit profile</strong>.</li>
            <li>Tap <strong>Delete account</strong> and confirm.</li>
          </ol>
          <p className="mt-2">Your account and associated data will be permanently removed.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">Option 2 — Request deletion by email</h2>
          <p>
            If you cannot access the app, email us from the email address registered to your account at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-wa-greenDark">{CONTACT_EMAIL}</a>{" "}
            with the subject line <strong>"Delete my account"</strong>. We will verify your identity and process
            the deletion within 30 days.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">What data is deleted</h2>
          <p>When your account is deleted, we permanently remove:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Your account information (username, email, password, Google account link).</li>
            <li>Your profile details (bio, avatar).</li>
            <li>Your posts, messages, and other user-generated content.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">Data retention</h2>
          <p>
            Account data is deleted immediately upon confirmation. Some information may be retained for a limited
            period only where required by law or for fraud prevention and security, after which it is permanently
            removed.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">Contact</h2>
          <p>
            Questions about account deletion? Email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-wa-greenDark">{CONTACT_EMAIL}</a>.
          </p>
        </section>
      </div>
    </div>
  </main>
);
