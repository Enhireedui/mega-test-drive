import type { Metadata, Viewport } from "next";

import { Backdrop } from "@/components/ui/Backdrop";
import { MotionProvider } from "@/components/ui/MotionProvider";
import {
  brandCount,
  eventConfig,
  eventDateRangeLabel,
  eventWeekdayLabel,
  venueLabel,
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
  `${brandCount} брэндийн шинэ загваруудыг туршин жолоодох ${eventConfig.title} — ` +
  `${eventDateRangeLabel()} (${eventWeekdayLabel()}), ${venueLabel()}. ` +
  `${eventConfig.host.name}-ийн хүрээнд. Онлайнаар бүртгүүлээд цагаа бариарай.`;

export const metadata: Metadata = {
  metadataBase: new URL(eventConfig.siteUrl),
  title: {
    default: `${eventConfig.title} · ${eventConfig.presenter.name}`,
    template: `%s · ${eventConfig.title}`,
  },
  description,
  applicationName: eventConfig.title,
  keywords: [
    eventConfig.presenter.name,
    eventConfig.title,
    "MEGA TEST DRIVE",
    "ШИЛИЙН БОГД",
    "туршилтын жолоодлого",
    "test drive Mongolia",
    ...eventConfig.brands.map((brand) => brand.name),
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "mn_MN",
    url: eventConfig.siteUrl,
    siteName: eventConfig.presenter.name,
    title: `${eventConfig.title} · ${eventConfig.presenter.name}`,
    description,
    /* The poster, whose baked-in typography is an asset in a social card and a
       liability everywhere else on the site. */
    images: [
      {
        url: eventConfig.poster.src,
        width: eventConfig.poster.width,
        height: eventConfig.poster.height,
        alt: eventConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${eventConfig.title} · ${eventConfig.presenter.name}`,
    description,
    images: [eventConfig.poster.src],
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* One dark surface throughout, so the browser chrome should match it rather
     than framing it in white. */
  colorScheme: "dark",
  themeColor: "#06070a",
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
      </head>
      <body className="relative min-h-svh">
        <Backdrop />
        {/*
         * Everything on this page paints without JavaScript — the entrances are
         * CSS animations, not scripted ones. The form is the exception: it opens
         * on React state and submits through a server action, so without a
         * bundle the button genuinely cannot work, and saying so is more use than
         * leaving someone tapping it.
         */}
        <noscript>
          <p className="border-b border-edge px-6 py-3 text-center text-[0.8125rem] text-white/70">
            Бүртгэлийн формыг ажиллуулахын тулд JavaScript-ийг зөвшөөрнө үү.
          </p>
        </noscript>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
