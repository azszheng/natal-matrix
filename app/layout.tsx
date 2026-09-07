import type { Metadata, Viewport } from "next";
import { Newsreader, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const SITE_URL = "https://www.natalmatrix.com";
const DESCRIPTION = "Rigorously accurate Western + Vedic natal charts with on-demand AI interpretation.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Natal Matrix",
  description: DESCRIPTION,
  keywords: [
    "natal chart",
    "birth chart",
    "astrology",
    "vedic astrology",
    "western astrology",
    "synastry",
    "human design",
    "AI astrology reading",
  ],
  openGraph: {
    title: "Natal Matrix",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Natal Matrix",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Natal Matrix",
    description: DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Natal Matrix",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0a08",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${hankenGrotesk.variable} ${ibmPlexMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
