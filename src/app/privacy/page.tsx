import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — LoveLens",
  description:
    "How LoveLens handles your data. Short version: your WhatsApp chats are parsed entirely in your browser and never uploaded to us.",
};

const updated = "June 2026";

export default function PrivacyPage() {
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
          <span className="h-11 w-11 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 flex items-center justify-center">
            <ShieldCheck size={22} />
          </span>
          <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
        </div>
        <p className="text-xs font-semibold text-slate-400 mb-8">Last updated: {updated}</p>

        <div className="rounded-3xl border border-green-200/60 bg-green-50/40 p-5 mb-8">
          <p className="text-sm font-bold text-green-800 leading-relaxed">
            The short version: your WhatsApp chat file is read and analyzed <strong>entirely inside your own web browser</strong>.
            It is never uploaded to our servers, stored, or shared. You can even turn off your internet after the page loads and
            the analysis still works.
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-600 [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-slate-800 [&_h2]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
          <section>
            <h2>1. Your chat data never leaves your device</h2>
            <p>
              LoveLens is a client-side tool. When you upload a <code>.txt</code> or <code>.zip</code> chat export, the file is
              processed locally in your browser using JavaScript. We do not receive, transmit, log, or store the contents of your
              conversations. To save you from re-uploading after a refresh, a summary of your results (aggregated stats only — never
              your actual messages) may be kept in your browser&apos;s local storage on your own device. You can erase it anytime with
              the &quot;Start Over&quot; button or by clearing your browser data.
            </p>
          </section>

          <section>
            <h2>2. Information we do collect</h2>
            <ul>
              <li>
                <strong>Payment information:</strong> If you purchase the premium report, payments are processed by our payment
                provider (Lemon Squeezy, acting as Merchant of Record). They handle your card details directly — we never see or
                store your full card number.
              </li>
              <li>
                <strong>Anonymous usage analytics:</strong> We use privacy-friendly, cookie-less analytics to understand aggregate
                traffic (e.g. page views, country, referrer). This does not identify you and does not track you across other sites.
              </li>
              <li>
                <strong>Support emails:</strong> If you email us, we keep that correspondence to respond to you.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Cookies</h2>
            <p>
              LoveLens does not use advertising or tracking cookies. Our analytics are cookie-less. Our payment provider may set
              cookies that are strictly necessary to complete a purchase.
            </p>
          </section>

          <section>
            <h2>4. Third-party services</h2>
            <p>We rely on a small number of trusted providers:</p>
            <ul>
              <li><strong>Lemon Squeezy</strong> — payment processing.</li>
              <li><strong>Our analytics provider</strong> — anonymous, aggregate traffic stats.</li>
              <li><strong>Our hosting provider</strong> — serves the website.</li>
            </ul>
          </section>

          <section>
            <h2>5. Data retention</h2>
            <p>
              We do not retain your chat data because we never receive it. Payment records are retained by our payment provider as
              required for tax and accounting.
            </p>
          </section>

          <section>
            <h2>6. Your rights</h2>
            <p>
              Depending on where you live (e.g. under GDPR or similar laws), you may have rights to access, correct, or delete the
              limited personal data we hold (such as a support email or payment record). Contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2>7. Children</h2>
            <p>LoveLens is not directed to children under 13, and we do not knowingly collect data from them.</p>
          </section>

          <section>
            <h2>8. Changes to this policy</h2>
            <p>We may update this policy from time to time. We will revise the &quot;last updated&quot; date above when we do.</p>
          </section>

          <section>
            <h2>9. Contact</h2>
            <p>
              Questions about privacy? Email us at{" "}
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
