import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const LAST_UPDATED = "June 10, 2026";
const CONTACT_EMAIL = "yuvayuvaraj720444@gmail.com";

export const ChildSafetyStandardsPage = () => (
  <main className="min-h-screen bg-wa-chatBg px-4 py-10 text-wa-text">
    <div className="mx-auto w-full max-w-3xl">
      <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-wa-subtext hover:text-wa-text">
        <FiArrowLeft /> Back
      </Link>

      <h1 className="mb-2 text-3xl font-black">Child Safety Standards</h1>
      <p className="mb-8 text-sm text-wa-subtext">
        Standards against Child Sexual Abuse and Exploitation (CSAE) · Last updated: {LAST_UPDATED}
      </p>

      <div className="space-y-6 text-sm leading-relaxed text-wa-text">
        <section>
          <p>
            Global Space ("we", "us", or "the app") has zero tolerance for child sexual abuse and exploitation
            (CSAE) and child sexual abuse material (CSAM). We are committed to keeping our community safe and to
            preventing, detecting, and reporting any content or behaviour that endangers children. This page sets
            out the standards we apply across our application and website.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">1. Zero-Tolerance Policy</h2>
          <p>
            We strictly prohibit any content, conduct, or communication that sexualises, exploits, abuses, or
            endangers children. This includes, without limitation:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Child sexual abuse material (CSAM) in any form.</li>
            <li>Grooming, sextortion, or any attempt to sexualise or solicit a minor.</li>
            <li>Sharing, requesting, or facilitating access to such material.</li>
            <li>Trafficking, endangerment, or any other exploitation of children.</li>
          </ul>
          <p className="mt-2">
            Violations result in immediate removal of content, permanent account termination, and reporting to the
            relevant authorities.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">2. Minimum Age Requirement</h2>
          <p>
            Global Space is not intended for children. Users must be at least 13 years old (or the minimum digital
            age of consent in their country) to create an account. We do not knowingly allow underage users, and we
            remove accounts that we determine to belong to children below the required age.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">3. In-App Reporting and Blocking</h2>
          <p>
            Users can report child safety concerns, abusive content, or any other violation directly from within
            the app. A "Report" option is available on posts, comments, direct messages, and user profiles, and a
            dedicated "Child safety" reason is provided. Users can also block any other user to immediately stop all
            contact and hide their content. Concerns can additionally be reported by emailing us at the address
            below. We review all reports and act on credible reports of CSAE without delay; reported content and
            accounts may be removed while an investigation is carried out.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">4. Reporting to Authorities</h2>
          <p>
            Where we identify apparent CSAM or CSAE, we comply with all applicable child safety laws and report to
            the appropriate regional and national authorities, including the National Center for Missing &amp;
            Exploited Children (NCMEC) and/or local law enforcement, as required. We preserve relevant information
            as permitted by law to support investigations.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">5. Moderation and Enforcement</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>We act on user reports and remove violating content and accounts.</li>
            <li>We permanently ban users who engage in CSAE-related activity.</li>
            <li>We cooperate with law enforcement and child-safety organisations.</li>
            <li>We continually review and improve our safety practices.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">6. Point of Contact</h2>
          <p>
            Our designated child-safety point of contact can be reached at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-wa-greenDark">{CONTACT_EMAIL}</a>.
            This contact is able to respond to questions regarding our CSAM prevention practices and compliance.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">7. Compliance</h2>
          <p>
            Global Space complies with Google Play's Child Safety Standards policy and all relevant child safety
            laws. We are committed to maintaining published, up-to-date standards against child sexual abuse and
            exploitation.
          </p>
        </section>
      </div>
    </div>
  </main>
);
