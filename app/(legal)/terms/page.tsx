import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Logo size="md" />
        </div>

        <h1 className="font-syne text-3xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-text-3 font-mono mb-10">Last updated: February 2026</p>

        <div className="flex flex-col gap-8 text-sm text-text-2 leading-relaxed">
          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">1. Acceptance of Terms</h2>
            <p>By creating an account and using NYXUS, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the platform. NYXUS is a partnership intelligence tool for Web3 projects — not financial, legal, or investment advice.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">2. What NYXUS Does</h2>
            <p>NYXUS aggregates publicly available information from Telegram channels and social platforms to help Web3 founders and BD managers discover partnership opportunities. All data shown is sourced from public channels. NYXUS does not guarantee accuracy, completeness, or fitness for any particular purpose.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">3. Your Account</h2>
            <p>You are responsible for maintaining the security of your account credentials. You may create multiple project profiles under a single account. You may not share accounts or resell access to the platform. We reserve the right to suspend accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">4. Acceptable Use</h2>
            <p>You agree not to use NYXUS to spam, harass, or send unsolicited communications to projects discovered on the platform. You agree not to scrape, copy, or redistribute NYXUS data without permission. You agree not to use the platform for any unlawful purpose.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">5. Subscriptions & Billing</h2>
            <p>NYXUS offers paid subscription plans. Subscriptions are billed monthly or annually depending on the plan chosen. All payments are non-refundable except where required by applicable law. We reserve the right to change pricing with 30 days notice to existing subscribers.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">6. Intellectual Property</h2>
            <p>NYXUS and its underlying technology, branding, and original content are owned by NYXUS. The data shown on the platform is aggregated from public sources and is not exclusively owned by NYXUS. Your project data remains yours — we do not sell it.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">7. Limitation of Liability</h2>
            <p>NYXUS is provided "as is". We are not liable for any damages arising from your use of the platform, missed partnership opportunities, or decisions made based on data shown on the platform. Our total liability shall not exceed the amount you paid in the 3 months prior to any claim.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">8. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms. We will notify active subscribers of material changes via email.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">9. Contact</h2>
            <p>Questions about these terms? Contact us at <a href="mailto:legal@nyxus.xyz" className="text-accent hover:underline">legal@nyxus.xyz</a></p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
          <Link href="/privacy" className="text-xs text-accent hover:underline">Privacy Policy →</Link>
          <Link href="/auth/login" className="text-xs text-text-3 hover:text-text-2">Back to app</Link>
        </div>
      </div>
    </div>
  );
}
