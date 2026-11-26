import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CCISLSG Hub — Local Student Government Portal",
  description:
    "Official Local Student Government Hub for the College of Computing and Information Sciences (CCISLSG).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=IBM+Plex+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-ccis-cream/45 text-ccis-ink"
      >
        {children}
      </body>
    </html>
  );
}
