import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "VPN Gate Client - Free VPN Servers | OpenVPN Profiles Download",
  description:
    "Access free VPN servers from VPN Gate Academic Project. Download OpenVPN profiles for Android, filter by country, speed, and ping. No registration required - instant VPN access.",
  keywords: [
    "VPN Gate",
    "free VPN",
    "OpenVPN",
    "VPN servers",
    "Android VPN",
    "VPN profiles",
    "download VPN",
    "free internet",
    "bypass restrictions",
    "VPN Gate client",
    "OpenVPN Connect",
    "VPN configuration",
    "Japan VPN",
    "Korea VPN",
    "USA VPN",
    "Europe VPN",
    "no logging VPN",
    "academic VPN project",
    "University of Tsukuba",
    "Suhail Akhtar",
  ],
  authors: [{ name: "Suhail Akhtar", url: "https://www.linkedin.com/in/im-suhail-akhtar" }],
  creator: "Suhail Akhtar",
  publisher: "Suhail Akhtar",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vpn-gate-client.vercel.app",
    title: "VPN Gate Client - Free VPN Servers & OpenVPN Profiles",
    description:
      "Access free VPN servers from VPN Gate Academic Project. Download OpenVPN profiles for Android with detailed server information, favorites, and smart filtering.",
    siteName: "VPN Gate Client",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VPN Gate Client - Free VPN Servers Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VPN Gate Client - Free VPN Servers",
    description:
      "Access free VPN servers from VPN Gate. Download OpenVPN profiles for Android with smart filtering and favorites.",
    images: ["/og-image.png"],
    creator: "@suhailakhtar",
  },
  alternates: {
    canonical: "https://vpn-gate-client.vercel.app",
  },
  category: "Technology",
  classification: "VPN Client Application",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://vpn-gate-client.vercel.app"),
  verification: {
    google: "your-google-verification-code", // Add your Google Search Console verification code
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  other: {
    "application-name": "VPN Gate Client",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "VPN Gate Client",
    "theme-color": "#3b82f6",
    "color-scheme": "light",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Favicon and App Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Additional SEO Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "VPN Gate Client",
              description: "Free VPN client for accessing VPN Gate servers with OpenVPN profile downloads",
              url: "https://vpn-gate-client.vercel.app",
              applicationCategory: "NetworkingApplication",
              operatingSystem: "Web Browser, Android",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Person",
                name: "Suhail Akhtar",
                url: "https://www.linkedin.com/in/im-suhail-akhtar",
              },
              creator: {
                "@type": "Person",
                name: "Suhail Akhtar",
                url: "https://github.com/gitsambhal",
              },
              featureList: [
                "Free VPN server access",
                "OpenVPN profile downloads",
                "Server filtering by country and performance",
                "Favorites system",
                "Real-time server information",
                "Android OpenVPN Connect integration",
              ],
              screenshot: "https://vpn-gate-client.vercel.app/og-image.png",
            }),
          }}
        />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://www.vpngate.net" />
        <link rel="dns-prefetch" href="https://www.vpngate.net" />
      </head>
      <body>{children}
        <Analytics />
      </body>
    </html>
  )
}
