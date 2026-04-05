import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cinetaro API - Free Movies, TV-Series & Anime Streaming API",
  description:
    "Cinetaro API provides a free, fast, and powerful streaming API to embed Movies, TV Shows, and Anime by TMDB ID. RESTful endpoints, instant video playback for developers building streaming platforms.",
  keywords: [
    "Cinetaro API", "streaming api", "movie api", "tv series api", "anime api",
    "free streaming api", "embed video api", "tmdb api", "rest api streaming",
    "movie streaming api", "anime streaming api", "video player api",
  ],
  robots: "index, follow",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FF6B6B;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%23A855F7;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%233B82F6;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='22' fill='url(%23grad)'/%3E%3Cpath d='M35 28 L35 72 L72 50 Z' fill='white'/%3E%3C/svg%3E",
  },
  openGraph: {
    title: "Cinetaro API - Free Movies, TV-Series & Anime Streaming API",
    description: "The biggest and fastest streaming API for developers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
