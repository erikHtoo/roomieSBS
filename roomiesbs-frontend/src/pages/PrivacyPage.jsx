import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";

const Section = ({ title, children }) => (
  <section>
    <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
    <div className="mt-2 space-y-2 leading-7 text-slate-600">{children}</div>
  </section>
);

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">UniMates policies</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Privacy policy</h1>
        <p className="mt-3 text-sm text-slate-500">Effective October 3, 2026</p>

        <div className="mt-10 space-y-9 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <Section title="What UniMates collects">
            <p>We collect the account information you use to sign in, such as your email address, display name, and Google account identifier when you choose Google sign-in.</p>
            <p>We also store information you submit to roommate profiles and room posts, including descriptions, preferences, budgets, locations, contact methods, and uploaded photos.</p>
          </Section>

          <Section title="How information is shown">
            <p>Profile and listing summaries may be visible publicly so students can browse available matches. Direct contact details are limited to signed-in users. Do not post identification documents, financial details, passwords, or other sensitive information.</p>
          </Section>

          <Section title="How information is used">
            <p>We use this information to operate sign-in, display and manage posts, help students find potential roommates or rooms, prevent abuse, and troubleshoot the service. We do not sell personal information.</p>
          </Section>

          <Section title="Service providers">
            <p>UniMates relies on service providers including Supabase for authentication, database, and file storage, and Vercel for hosting, performance monitoring, and basic site analytics. Those providers process data under their own privacy and security terms.</p>
          </Section>

          <Section title="Retention and your choices">
            <p>Information remains available while your account, profile, or post is active. You can edit or remove your roommate profile and room posts from your account. To request account deletion or help with personal data, use the support email shown on the Google consent screen or contact the UniMates operator.</p>
          </Section>

          <Section title="Safety and updates">
            <p>Internet services cannot guarantee absolute security. Use the in-app controls to limit what you share and report suspicious activity. We may update this policy as UniMates changes; the effective date above will be revised when we do.</p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
