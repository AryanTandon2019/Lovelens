import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — LoveLens",
  description: "The terms for using LoveLens, the private WhatsApp chat analyzer.",
};

const updated = "June 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FFF7F7] text-slate-800 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-white/80 px-4 py-2 text-xs font-black text-slate-600 shadow-sm hover:text-rose-500 transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to LoveLens
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <span className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-200 text-rose-500 flex items-center justify-center">
            <FileText size={22} />
          </span>
          <h1 className="text-3xl font-black tracking-tight">Terms of Service</h1>
        </div>
        <p className="text-xs font-semibold text-slate-400 mb-8">Last updated: {updated}</p>

        <div className="space-y-8 text-sm leading-relaxed text-slate-600 [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-slate-800 [&_h2]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
          <section>
            <h2>1. Acceptance</h2>
            <p>
              By using LoveLens (the &quot;Service&quot;), you agree to these Terms. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2>2. What LoveLens is</h2>
            <p>
              LoveLens analyzes a WhatsApp chat export you provide and generates fun statistics and a relationship report. The
              results are produced by automated text analysis and are intended for <strong>entertainment and informational
              purposes only</strong>. They are estimates, not facts, and are not relationship, psychological, legal, or professional
              advice. Don&apos;t make important life decisions based on a LoveLens score.
            </p>
          </section>

          <section>
            <h2>3. Your responsibilities</h2>
            <ul>
              <li>Only upload chats you have the right to analyze.</li>
              <li>Respect the privacy of the other people in your conversations.</li>
              <li>Do not use the Service for any unlawful, harassing, or harmful purpose.</li>
            </ul>
          </section>

          <section>
            <h2>4. Purchases &amp; pricing</h2>
            <p>
              The premium report is a one-time purchase that unlocks the premium features for your report. Prices are shown at
              checkout and may vary by region. Payments are processed by Lemon Squeezy, our Merchant of Record, whose terms also
              apply to the transaction.
            </p>
          </section>

          <section>
            <h2>5. Refunds</h2>
            <p>
              Because the premium features are revealed instantly and digitally, sales are generally final. If something didn&apos;t
              work as described, email us within 7 days at{" "}
              <a className="text-rose-500 font-bold underline" href="mailto:hello@getlovelens.com">hello@getlovelens.com</a>{" "}
              and we&apos;ll make it right.
            </p>
          </section>

          <section>
            <h2>6. Intellectual property</h2>
            <p>
              The LoveLens name, design, and software are owned by us. You may freely share the report cards and images you
              generate. You may not copy, resell, or redistribute the Service itself.
            </p>
          </section>

          <section>
            <h2>7. Disclaimer &amp; limitation of liability</h2>
            <p>
              The Service is provided &quot;as is&quot;, without warranties of any kind. To the maximum extent permitted by law, we are
              not liable for any indirect or consequential damages, or for any decisions or outcomes resulting from your use of the
              Service. Our total liability for any claim will not exceed the amount you paid us in the past 12 months.
            </p>
          </section>

          <section>
            <h2>8. Changes</h2>
            <p>We may update these Terms. Continued use of the Service after changes means you accept the updated Terms.</p>
          </section>

          <section>
            <h2>9. Contact</h2>
            <p>
              Questions? Email{" "}
              <a className="text-rose-500 font-bold underline" href="mailto:hello@getlovelens.com">hello@getlovelens.com</a>.
            </p>
          </section>
        </div>

        <p className="mt-10 text-[11px] text-slate-400 leading-relaxed border-t border-rose-100 pt-6">
          LoveLens is an independent tool and is not affiliated with or endorsed by WhatsApp. WhatsApp is a registered trademark of
          its respective owner.
        </p>
      </div>
    </main>
  );
}
