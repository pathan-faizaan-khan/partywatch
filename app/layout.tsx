import type { Metadata, Viewport } from "next";
import { DM_Sans, Unbounded } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/constants";
import { AuthProvider } from "@/lib/auth-context";
import { LoadingBarProvider } from "@/components/ui/LoadingBar";

const display = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "watch party",
    "YouTube watch party",
    "watch YouTube together",
    "synced video playback",
    "synchronized video",
    "PartyWatch",
    "online watch party",
    "virtual movie night",
  ],
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name}: ${SITE.tagline}`,
    description: SITE.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name}: ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#070726",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Synchronized YouTube video playback across devices",
    "Host, Moderator, and Participant role management",
    "Real-time synchronized chat and emoji reactions",
    "Full-screen theater mode and invite link sharing",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <div aria-hidden className="stars pointer-events-none fixed inset-0 -z-10" />
        <LoadingBarProvider>
          <AuthProvider>{children}</AuthProvider>
        </LoadingBarProvider>
      </body>
    </html>
  );
}
