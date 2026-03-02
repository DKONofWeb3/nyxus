import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Logo size="md" />
        </div>

        <h1 className="font-syne text-3xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-text-3 font-mono mb-10">Last updated: February 2026</p>

        <div className="flex flex-col gap-8 text-sm text-text-2 leading-relaxed">
          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">1. What We Collect</h2>
            <p>We collect your email address and password (hashed) when you create an account. We collect the project information you provide during onboarding (name, category, narrative, goals). We collect usage data (pages visited, features used) to improve the product. We do not collect payment details directly — payments are handled by our payment processor.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">2. How We Use Your Data</h2>
            <p>Your account data is used to authenticate you and personalise your experience. Your project data is used to power the matching engine — it is never shared with or sold to third parties. Usage analytics help us understand which features are most valuable and where to improve.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">3. Data Storage</h2>
            <p>Your data is stored securely on Supabase (PostgreSQL), hosted on infrastructure in the EU/US. All data is encrypted at rest and in transit. We retain your data for as long as your account is active. You can request deletion at any time.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">4. Third-Party Services</h2>
            <p>NYXUS uses Supabase for database and authentication, and Vercel for hosting. We may use analytics tools (e.g. Plausible) that are privacy-respecting and do not track individuals. We do not use Google Analytics or Facebook Pixel. We do not sell your data to advertisers.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">5. Discovered Project Data</h2>
            <p>NYXUS aggregates data from public Telegram channels and social platforms. This data includes project names, descriptions, and community sizes that are publicly available. If you believe your project's data has been collected in error or you wish it removed, contact us at <a href="mailto:privacy@nyxus.xyz" className="text-accent hover:underline">privacy@nyxus.xyz</a>.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data at any time. You can export your data from Settings. You can delete your account from Settings — this permanently removes all your data within 30 days. For GDPR or CCPA requests, email <a href="mailto:privacy@nyxus.xyz" className="text-accent hover:underline">privacy@nyxus.xyz</a>.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">7. Cookies</h2>
            <p>We use a single session cookie for authentication. We use a preference cookie for your dark/light mode setting. We do not use tracking cookies or third-party advertising cookies. You can disable cookies in your browser but authentication will not work without the session cookie.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-base text-text mb-2">8. Contact</h2>
            <p>For privacy questions or data requests: <a href="mailto:privacy@nyxus.xyz" className="text-accent hover:underline">privacy@nyxus.xyz</a></p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
          <Link href="/terms" className="text-xs text-accent hover:underline">Terms of Service →</Link>
          <Link href="/auth/login" className="text-xs text-text-3 hover:text-text-2">Back to app</Link>
        </div>
      </div>
    </div>
  );
}
