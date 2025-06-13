import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://finloop.vercel.app"; // Your production URL

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl), // Important for resolving relative Open Graph URLs
  title: {
    default: "Finloop - Split Expenses, Not Friendships",
    template: "%s | Finloop", // For page-specific titles
  },
  description:
    "Effortlessly manage group expenses with UPI integration. Track contributions, split bills, and settle up instantly with Finloop.",
  keywords: [
    "expense management",
    "group expenses",
    "split bills",
    "upi payments",
    "shared funds",
    "fintech",
    "finloop",
  ],
  authors: [{ name: "Finloop Team", url: siteUrl }],
  creator: "Finloop Team",
  publisher: "Finloop",

  openGraph: {
    title: "Finloop - Split Expenses, Not Friendships",
    description:
      "Effortlessly manage group expenses with UPI integration. Track contributions, split bills, and settle up instantly.",
    url: siteUrl,
    siteName: "Finloop",
    images: [
      {
        url: `${siteUrl}/og-image.png`, // Replace with your actual OG image path
        width: 1200,
        height: 630,
        alt: "Finloop - Shared Expense Management",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Finloop - Split Expenses, Not Friendships",
    description:
      "Effortlessly manage group expenses with UPI integration. Track contributions, split bills, and settle up instantly.",
    // siteId: "YourTwitterSiteID", // If you have one
    creator: "@YourTwitterHandle", // Replace with your Twitter handle
    images: [`${siteUrl}/twitter-image.png`], // Replace with your actual Twitter image path
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png", // Or your preferred shortcut icon
    apple: "/apple-touch-icon.png", // Create an apple-touch-icon.png (e.g., 180x180)
  },
  alternates: {
    canonical: siteUrl,
  },
  // manifest: "/site.webmanifest", // If you have a PWA manifest
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3743564978461381"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <Script
          async
          custom-element="amp-ad"
          src="https://cdn.ampproject.org/v0/amp-ad-0.1.js"
          strategy="beforeInteractive" // Or "afterInteractive" depending on priority
        />
        {/* You can add other global head elements here if needed, like verification tags */}
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
