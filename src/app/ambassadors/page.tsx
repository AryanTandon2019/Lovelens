import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Heart, Users, Zap, Gift, DollarSign, CheckCircle2, HelpCircle, MessageCircle, Lightbulb, Target, Award, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Brand Ambassador Program — LoveLens",
  description:
    "Join the LoveLens Brand Ambassador Program. Earn 25% commission on every referral, get lifetime Premium free, and grow with us long-term.",
};

export default function AmbassadorsPage() {
  return (
    <main className="min-h-screen bg-[#FFF7F7] text-slate-800 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-white/80 px-4 py-2 text-xs font-black text-slate-600 shadow-sm hover:text-rose-500 transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to LoveLens
        </Link>

        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <Heart size={22} className="fill-rose-500" />
            </span>
            <h1 className="text-3xl font-black tracking-tight">Become a LoveLens Brand Ambassador &#10084;&#65039;</h1>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Join our early creator community and earn recurring commissions by introducing your audience to LoveLens.
          </p>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl mt-2">
            We&apos;re looking for creators who genuinely enjoy making engaging relationship and lifestyle content and want to grow with us long-term.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-xs font-bold text-slate-500">
            <span>No joining fee</span>
            <span className="text-slate-300">&#183;</span>
            <span>Lifetime Premium included</span>
            <span className="text-slate-300">&#183;</span>
            <span>Unlimited earning potential</span>
          </div>
        </div>

        {/* About LoveLens */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-2">What is LoveLens?</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            LoveLens is a relationship-focused app that helps people explore, understand, and strengthen their relationships through engaging, interactive experiences. Upload a WhatsApp chat and instantly discover who texts more, who replies faster, and who&apos;s really more invested.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            Our mission is to build the world&apos;s most loved relationship companion — a community that values authentic connections and makes self-reflection fun.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            We partner with creators because authentic recommendations drive the strongest growth. If your audience cares about relationships, dating, or couple content, LoveLens is a natural fit.
          </p>
          <p className="text-sm text-slate-500 mt-3">
            Website: <a href="https://getlovelens.com" className="text-rose-500 font-bold underline">getlovelens.com</a>
          </p>
        </section>

        {/* Why Join */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Gift size={18} className="text-rose-500" /> Why Join LoveLens?
          </h2>
          <div className="rounded-3xl border border-rose-100/60 bg-white/70 p-5 space-y-3">
            {[
              { emoji: "&#10084;&#65039;", text: "Lifetime LoveLens Premium — completely free" },
              { emoji: "&#128176;", text: "25% recurring commission on every eligible Premium subscription" },
              { emoji: "&#128200;", text: "Unlimited earnings — no cap, ever" },
              { emoji: "&#128640;", text: "Early access to new features and updates" },
              { emoji: "&#127873;", text: "Performance rewards — top creators unlock higher rates" },
              { emoji: "&#129309;", text: "Long-term partnership — grow with us as we scale" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-sm flex-shrink-0 mt-0.5" dangerouslySetInnerHTML={{ __html: item.emoji }} />
                <span className="text-sm text-slate-600 leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Why Revenue Sharing */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-500" /> Why Revenue Sharing?
          </h2>
          <div className="rounded-3xl border border-amber-100/60 bg-amber-50/20 p-5 space-y-3">
            <p className="text-sm text-slate-600 leading-relaxed">
              Many creators ask why we don&apos;t pay a fixed amount per post. Here&apos;s our reasoning:
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Instead of paying once for a promotion, we prefer long-term revenue sharing. This means you continue earning as long as people subscribe through your referral — not just the day you post.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              The better your content performs over time, the more you earn. This creates a genuine partnership rather than a one-time transaction.
            </p>
            <p className="text-sm text-slate-700 font-semibold">
              We want creators who grow with us — and we want your earnings to grow too.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Zap size={18} className="text-indigo-500" /> How It Works
          </h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Apply", desc: "Send us a DM on Instagram expressing your interest." },
              { step: "2", title: "Review", desc: "Our team reviews your profile and content. This usually takes 24\u201348 hours." },
              { step: "3", title: "Approval", desc: "Once approved, we create your ambassador account and activate your Lifetime Premium." },
              { step: "4", title: "Receive Your Link", desc: "Get your unique referral link and promo code — ready to share immediately." },
              { step: "5", title: "Create Content", desc: "Share LoveLens through authentic content on Instagram Reels, TikTok, YouTube Shorts, Stories, or posts. Create in your own style — we value authenticity over scripted promotions." },
              { step: "6", title: "Earn Monthly Commissions", desc: "Every time someone purchases Premium through your referral, you earn 25%. Commissions are paid out monthly." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <span className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-800">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Commission */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
            <DollarSign size={18} className="text-green-500" /> Commission
          </h2>
          <div className="rounded-3xl border border-green-100/60 bg-green-50/30 p-5 space-y-3">
            <p className="text-sm text-slate-700 font-semibold">
              25% commission on every eligible Premium subscription purchased through your referral.
            </p>
            <p className="text-sm text-slate-600">
              There is no earning limit. The more Premium subscribers you refer, the more you earn.
            </p>
            <p className="text-sm text-slate-600">
              Higher commission tiers may be available for outstanding ambassadors based on consistent performance and volume.
            </p>
          </div>
        </section>

        {/* Referral Tracking */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-3">Referral Tracking</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-2">Every ambassador receives:</p>
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1.5">
            <li>A unique referral link</li>
            <li>A unique promo code</li>
          </ul>
          <p className="text-sm text-slate-500 mt-3">
            Eligible purchases are automatically tracked through our payment and affiliate system. You don&apos;t need to track anything manually — just share your link and let the system handle the rest.
          </p>
        </section>

        {/* Payout Information */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-3">Payout Information</h2>
          <div className="rounded-3xl border border-white/60 bg-white/70 p-5 space-y-4">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Payout Schedule</span>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">Monthly</p>
            </div>
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Minimum Payout</span>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">&#8377;500</p>
            </div>
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Payment Methods</span>
              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">India</p>
                  <ul className="text-sm text-slate-600 space-y-0.5">
                    <li>UPI</li>
                    <li>Bank Transfer</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">International</p>
                  <ul className="text-sm text-slate-600 space-y-0.5">
                    <li>PayPal</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100">
              Payment details will be collected after your application is approved.
            </p>
          </div>
        </section>

        {/* Ambassador Benefits */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
            <Users size={18} className="text-rose-500" /> Ambassador Benefits
          </h2>
          <p className="text-sm text-slate-600 mb-3">Every approved ambassador receives:</p>
          <div className="rounded-3xl border border-rose-100/60 bg-white/70 p-5 space-y-2.5">
            {[
              "Lifetime LoveLens Premium",
              "Personal referral link and promo code",
              "Access to content ideas and inspiration",
              "Early feature access",
              "Priority consideration for future paid campaigns",
              "Exclusive creator opportunities",
              "Opportunity to be featured on LoveLens social media",
              "Dedicated creator support",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 size={14} className="text-rose-500 flex-shrink-0" />
                <span className="text-sm text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Who We're Looking For */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
            <Target size={18} className="text-indigo-500" /> Who We&apos;re Looking For
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            We&apos;d love to collaborate with creators who make:
          </p>
          <div className="rounded-3xl border border-indigo-100/60 bg-indigo-50/20 p-5">
            <div className="flex flex-wrap gap-2">
              {[
                "Relationship content",
                "Couple content",
                "Lifestyle",
                "Comedy",
                "POV videos",
                "Dating content",
                "Instagram Reels",
                "TikTok",
                "YouTube Shorts",
              ].map((tag, i) => (
                <span key={i} className="rounded-full bg-white border border-indigo-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-4 leading-relaxed">
              No minimum follower requirement. We value authenticity and engagement over follower count.
            </p>
          </div>
        </section>

        {/* Content Ideas */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-rose-500" /> Content Ideas
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Need inspiration? Here are some content angles that work well:
          </p>
          <div className="rounded-3xl border border-rose-100/60 bg-white/70 p-5 space-y-2">
            {[
              "POV: This app exposed my relationship \uD83D\uDE02",
              "My boyfriend wasn\u2019t expecting this\u2026",
              "Rating our relationship with LoveLens",
              "Relationship green flags \u2705",
              "Relationship red flags \uD83D\uDEA9",
              "Testing LoveLens with my partner",
              "Funny couple challenge",
              "Trend remix featuring LoveLens",
              "Story time + LoveLens results",
              "Relationship memes",
              "Honest review of LoveLens",
              "Lifestyle vlog featuring LoveLens",
            ].map((idea, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                <span className="text-sm text-slate-600">{idea}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-3">
            These are suggestions — you&apos;re free to create in any style that fits your audience.
          </p>
        </section>

        {/* Creator Checklist */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-3">Creator Checklist</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">Before posting, make sure to:</p>
          <div className="rounded-3xl border border-green-100/60 bg-green-50/20 p-5 space-y-3">
            {[
              "Tag @getlovelens in every LoveLens post or Reel",
              "Mention LoveLens naturally in your content",
              "Use your referral link whenever possible",
              "Keep content authentic and true to your style",
              "Do not make misleading claims about the product",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Content Guidelines */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-3">Content Guidelines</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            We encourage creators to make authentic content that reflects their own personality and audience.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-green-100/60 bg-green-50/20 p-4">
              <p className="text-xs font-black text-green-600 uppercase tracking-wider mb-2">Encouraged</p>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>Reels and short-form videos</li>
                <li>Stories and lifestyle content</li>
                <li>Relationship tips and comedy</li>
                <li>Funny relationship memes</li>
                <li>Honest app reviews</li>
                <li>Your own creative spin</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-red-100/60 bg-red-50/20 p-4">
              <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-2">Please avoid</p>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>Misleading claims</li>
                <li>Spam or mass messaging</li>
                <li>Fake reviews</li>
                <li>Paid traffic without approval</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <HelpCircle size={18} className="text-indigo-500" /> Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Do I need to pay to join?",
                a: "No. Joining the Brand Ambassador Program is completely free.",
              },
              {
                q: "Do I need Premium first?",
                a: "No. Approved ambassadors receive Lifetime LoveLens Premium for free as part of the program.",
              },
              {
                q: "Who can become a LoveLens Brand Ambassador?",
                a: "Anyone with an engaged audience and a passion for creating authentic relationship or lifestyle content.",
              },
              {
                q: "Do I need a minimum number of followers?",
                a: "No. We value engagement, creativity, and authenticity more than follower count.",
              },
              {
                q: "How do referrals work?",
                a: "You share your unique referral link or promo code with your audience. When someone purchases Premium through your referral, you earn a commission.",
              },
              {
                q: "How are commissions tracked?",
                a: "All eligible purchases are automatically tracked through our payment and affiliate system. You don\u2019t need to track anything manually.",
              },
              {
                q: "How much commission do I earn?",
                a: "25% of every eligible Premium subscription purchased through your referral.",
              },
              {
                q: "Is there an earning limit?",
                a: "No. Your earnings depend entirely on the number of successful referrals you generate. There is no cap.",
              },
              {
                q: "When do I get paid?",
                a: "Commissions are paid out monthly once your balance reaches the minimum payout threshold (\u20B9500).",
              },
              {
                q: "What payment methods are available?",
                a: "UPI, Bank Transfer (India), and PayPal (International).",
              },
              {
                q: "Can my commission increase?",
                a: "Yes. Top-performing ambassadors may receive higher commission rates and exclusive partnership opportunities.",
              },
              {
                q: "Can I create content in my own style?",
                a: "Absolutely. We encourage you to create content that feels natural to your audience. No scripts, no templates — just be yourself.",
              },
              {
                q: "What if I have questions?",
                a: "Send us a DM on Instagram @getlovelens. Our team is happy to help with anything.",
              },
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/60 bg-white/70 p-4">
                <h3 className="text-sm font-black text-slate-800 mb-1">{faq.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Top Ambassador Rewards */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
            <Award size={18} className="text-amber-500" /> Top Ambassador Rewards
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Outstanding ambassadors may receive:
          </p>
          <div className="rounded-3xl border border-amber-100/60 bg-amber-50/20 p-5 space-y-2.5">
            {[
              "Higher commission rates",
              "Exclusive paid campaigns",
              "Early feature access",
              "Priority creator support",
              "Feature on LoveLens social media",
              "Future paid collaborations",
              "Special rewards and bonuses",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-sm text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mb-10">
          <div className="rounded-3xl border border-rose-200/60 bg-gradient-to-br from-rose-50/50 to-indigo-50/30 p-6 text-center">
            <h2 className="text-xl font-black text-slate-800 mb-2">Ready to Join LoveLens?</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-5">
              If you&apos;d like to become a LoveLens Brand Ambassador, simply send us a message on Instagram. We&apos;ll review your profile, answer your questions, and guide you through the onboarding process.
            </p>
            <a
              href="https://instagram.com/getlovelens"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-400 hover:opacity-95 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-rose-200 active:scale-[0.98] transition-all"
            >
              <MessageCircle size={16} /> Message @getlovelens on Instagram
            </a>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-10 border-t border-rose-100 pt-6 space-y-3">
          <p className="text-xs text-slate-500 font-semibold">
            Still have questions? Send us a DM on Instagram{" "}
            <a
              href="https://instagram.com/getlovelens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-500 font-bold underline"
            >
              @getlovelens
            </a>{" "}
            and our team will be happy to help.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            LoveLens is an independent tool and is not affiliated with or endorsed by WhatsApp. WhatsApp is a registered trademark of its respective owner.
          </p>
        </div>
      </div>
    </main>
  );
}
