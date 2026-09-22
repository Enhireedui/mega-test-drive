import type { Metadata, Viewport } from "next";

import { datesLabel, eventConfig, venueLabel, weekdaysLabel } from "@/lib/config";

import "./globals.css";

/** Subsets that paint above the fold. Declared in app/fonts.css. */
const PRELOADED_FONTS = [
  "oswald-latin",
  "oswald-cyrillic",
  "oswald-cyrillic-ext",
  "inter-cyrillic",
  "inter-cyrillic-ext",
] as const;

const { title, editionName, hours, presenter, siteUrl, poster } = eventConfig;

const fullName = `${title} — ${editionName}`;

const description =
  `${fullName}. ${datesLabel()} (${weekdaysLabel()}), ${hours.label} — ${venueLabel()}. ` +
  `${presenter.name}, ${presenter.role.toLowerCase()}. Онлайнаар бүртгүүлээрэй.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${fullName} · ${presenter.name}`,
    template: `%s · ${title}`,
  },
  description,
  applicationName: title,
  keywords: [
    presenter.name,
    title,
    "MEGA EVENT TEST DRIVE",
    editionName,
    "Дархан",
    "туршилтын жолоодлого",
    "тест драйв",
    venueLabel(),
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "mn_MN",
    url: siteUrl,
    siteName: presenter.name,
    title: `${fullName} · ${presenter.name}`,
    description,
    /* The poster, whose baked-in typography is an asset in a social card and a
       liability everywhere else — which is why it is never painted on the page. */
    images: [{ url: poster.src, width: poster.width, height: poster.height, alt: fullName }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${fullName} · ${presenter.name}`,
    description,
    images: [poster.src],
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* One dark surface throughout, so the browser chrome should match the indigo
     ground rather than framing it in white. */
  colorScheme: "dark",
  themeColor: "#090d1c",
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
      <body className="min-h-svh">
        {/*
         * Everything on the page paints without JavaScript — the entrance is a
         * CSS animation, and the identity, the facts, the marque index and the
         * plates are markup. The form is the exception: it submits through a
         * server action, so without a bundle the button genuinely cannot work,
         * and saying so is more use than leaving someone tapping it.
         */}
        <noscript>
          <p className="border-b border-rule px-6 py-3 text-center text-[0.8125rem] text-slate">
            Бүртгэлийн формыг ажиллуулахын тулд JavaScript-ийг зөвшөөрнө үү.
          </p>
        </noscript>
        {children}
      </body>
    </html>
  );
}
