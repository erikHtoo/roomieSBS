import { FiAlertTriangle, FiCheckCircle, FiFlag, FiLock } from "react-icons/fi";
import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";
import ReportConcernLink from "../components/ReportConcernLink.jsx";
import { SUPPORT_EMAIL } from "../utils/support.js";

const SafetyCard = ({ icon: Icon, title, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-6">
    <div className="flex items-start gap-4">
      <div className="rounded-lg bg-rose-50 p-2.5 text-rose-700">
        <Icon size={21} aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <div className="mt-2 space-y-2 leading-7 text-slate-600">{children}</div>
      </div>
    </div>
  </section>
);

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Student safety</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Meet safely. Verify before you commit.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          UniMates is a community board, not a broker, landlord, or background-check service. Take these steps before sharing money, documents, or a home.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <SafetyCard icon={FiCheckCircle} title="Verify the person and property">
            <p>Meet in a public place first, use a live video call when helpful, inspect the room in person, and confirm who is legally allowed to rent or transfer it.</p>
          </SafetyCard>
          <SafetyCard icon={FiAlertTriangle} title="Slow down before paying">
            <p>Do not send a deposit because someone creates urgency. Confirm the address, terms, recipient, and written agreement. Be cautious of payments to unrelated people or accounts.</p>
          </SafetyCard>
          <SafetyCard icon={FiLock} title="Protect personal information">
            <p>Never post or send passwords, one-time codes, bank details, passport scans, or student documents through a listing. Share only the contact details you are comfortable making available.</p>
          </SafetyCard>
          <SafetyCard icon={FiFlag} title="Report suspicious content">
            <p>On a room or roommate page, use <strong>Report a concern</strong>. Include the page link and a short explanation, but do not email sensitive documents.</p>
          </SafetyCard>
        </div>

        <section className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-950">Need help?</h2>
          <p className="mt-2 leading-7 text-slate-700">
            For a UniMates safety, privacy, or abuse concern, contact{" "}
            <a className="font-semibold text-rose-800 underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            If anyone may be in immediate danger, contact local emergency services or school staff instead of waiting for an email response.
          </p>
          <ReportConcernLink className="mt-5 bg-white" />
        </section>
      </main>
      <Footer />
    </div>
  );
}
