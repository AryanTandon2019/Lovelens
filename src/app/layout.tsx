import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://getlovelens.com"),
  title: "LoveLens — WhatsApp Chat Analyzer & Relationship Stats",
  description:
    "Upload your WhatsApp chat and instantly see who texts more, who replies faster, who said 'I love you' first, and who's more into who. A beautiful, shareable, 100% private relationship report parsed entirely in your browser.",
  keywords: [
    "whatsapp chat analyzer",
    "relationship stats",
    "who texts more",
    "chat wrapped",
    "couple compatibility",
    "text message analysis",
  ],
  applicationName: "LoveLens",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://getlovelens.com",
    siteName: "LoveLens",
    title: "LoveLens — Who's really more into who? 💘",
    description:
      "Upload your WhatsApp chat and get instant, private relationship stats: who texts more, who replies faster, who's more invested. Shareable in seconds.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LoveLens — Who's really more into who? 💘",
    description:
      "Instant, private WhatsApp relationship stats. Who texts more, who replies faster, who's more into who.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5628SM77EJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5628SM77EJ');
          `}
        </Script>
        {/* Affonso affiliate/referral tracking — attributes creator referral links so
            commissions can be calculated automatically. Only loads once a program ID
            is configured (see NEXT_PUBLIC_AFFONSO_PROGRAM_ID in .env.local). */}
        {process.env.NEXT_PUBLIC_AFFONSO_PROGRAM_ID && (
          <Script
            async
            defer
            src="https://cdn.affonso.io/js/pixel.min.js"
            data-affonso={process.env.NEXT_PUBLIC_AFFONSO_PROGRAM_ID}
            data-cookie_duration="30"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
