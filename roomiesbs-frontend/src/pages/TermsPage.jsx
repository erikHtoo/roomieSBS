import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";

const Section = ({ title, children }) => (
  <section>
    <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
    <div className="mt-2 space-y-2 leading-7 text-slate-600">{children}</div>
  </section>
);

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">UniMates policies</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Terms of use</h1>
        <p className="mt-3 text-sm text-slate-500">Effective October 3, 2026</p>

        <div className="mt-10 space-y-9 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <Section title="A community board, not a broker">
            <p>UniMates helps students discover potential roommates and rooms. We do not own, inspect, manage, or guarantee any property, listing, person, payment, or agreement. You are responsible for verifying information and deciding whether a match is suitable.</p>
          </Section>

          <Section title="Your responsibilities">
            <p>Provide accurate, current information; use only accounts and content you are authorized to use; and keep your login secure. Do not impersonate others, mislead users, scrape data, spam, harass, discriminate, request unsafe payments, or use UniMates for unlawful activity.</p>
          </Section>

          <Section title="Housing safety">
            <p>Meet safely, verify identities and property details, inspect a room before committing, and use a written agreement. Never send deposits or sensitive documents solely because someone contacted you through UniMates. UniMates does not perform background checks.</p>
          </Section>

          <Section title="Content and moderation">
            <p>You retain ownership of content you submit and give UniMates permission to host and display it as needed to operate the service. We may hide or remove content, restrict accounts, or preserve information when reasonably necessary for safety, abuse prevention, legal compliance, or service operation.</p>
          </Section>

          <Section title="Availability and liability">
            <p>The service is provided as available and may change, experience errors, or be suspended. To the extent permitted by law, UniMates and its student operators are not responsible for agreements, payments, losses, injuries, disputes, or conduct between users.</p>
          </Section>

          <Section title="Changes and contact">
            <p>We may update these terms as the service evolves. Continuing to use UniMates after an update means you accept the revised terms. Questions can be sent through the support contact shown during Google sign-in or to the UniMates operator.</p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
