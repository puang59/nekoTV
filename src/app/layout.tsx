import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "NekoTV",
  description: "Where anime streams, not ads!",
  openGraph: {
    title: "NekoTV",
    description: "Where anime streams, not ads!",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Banner Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NekoTV",
    description: "Where anime streams, not ads!",
    images: ["/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-accent`}
      >
        {children}
      </body>
    </html>
  );
}
