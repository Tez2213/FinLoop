import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // Import the Script component
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
  title: "Finloop - Split Expenses, Not Friendships",
  description: "Effortlessly manage group expenses with UPI integration",
  openGraph: {
    title: "Finloop - Split Expenses, Not Friendships",
    description: "Effortlessly manage group expenses with UPI integration",
    url: "https://finloop.vercel.app/", // Make sure this is your actual production URL
    siteName: "Finloop",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head> {/* Add the script within the head tag */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3743564978461381"
          crossOrigin="anonymous"
          strategy="beforeInteractive" // Loads before the page is interactive
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
