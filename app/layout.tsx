import type { Metadata, Viewport } from "next";

import { Backdrop } from "@/components/Backdrop";
import { MotionProvider } from "@/components/MotionProvider";
import {
  eventConfig,
  eventDateRangeLabel,
  eventHoursLabel,
  eventWeekdayLabel,
} from "@/lib/config";

import "./globals.css";

/** Subsets that paint above the fold. Declared in app/fonts.css. */
const PRELOADED_FONTS = [
  "montserrat-latin",
  "montserrat-cyrillic",
  "montserrat-cyrillic-ext",
  "inter-cyrillic",
  "inter-cyrillic-ext",
] as const;

const description =
  `${eventConfig.stats.brandCount} брэндийн ${eventConfig.stats.modelCountLabel} загвар — ` +
  `${eventDateRangeLabel()} (${eventWeekdayLabel()}), ${eventConfig.venue.name}, ` +
  `${eventHoursLabel()}. ${eventConfig.title} өдөрлөгт онлайнаар бүртгүүлээд суудлаа бариарай.`;

export const metadata: Metadata = {
  metadataBase: new URL(eventConfig.siteUrl),
  title: {
    default: `${eventConfig.title} · ${eventConfig.distributor}`,
    template: `%s · ${eventConfig.distributor}`,
  },
  description,
  applicationName: eventConfig.title,
  keywords: [
    "SAIN MOTORS",
    "MEGA TEST DRIVE",
    "туршилтын жолоодлого",
    "test drive Mongolia",
    ...eventConfig.brands,
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "mn_MN",
    url: eventConfig.siteUrl,
    siteName: eventConfig.distributor,
    title: `${eventConfig.title} · ${eventConfig.distributor}`,
    description,
    images: [
      {
        url: "/event/fleet.jpg",
        width: 1772,
        height: 1772,
        alt: eventConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${eventConfig.title} · ${eventConfig.distributor}`,
    description,
    images: ["/event/fleet.jpg"],
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#070B16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <head>
        {PRELOADED_FONTS.map((file) => (
          <link
            key={file}
            rel="preload"
            href={`/fonts/${file}.woff2`}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
        {/* If the bundle never arrives, scroll-revealed content must not stay hidden. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="relative min-h-svh antialiased">
        <Backdrop />
        <MotionProvider>
          <div className="relative z-10">{children}</div>
        </MotionProvider>
      </body>
    </html>
  );
}
