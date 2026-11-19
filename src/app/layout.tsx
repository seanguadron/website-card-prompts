import type { Metadata, Viewport } from "next";
import { Geist_Mono, Open_Sans } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { ThemeScript } from "@/components/theme-script";
import "./globals.css";

const sans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Card Prompts",
    template: "%s | Card Prompts",
  },
  description:
    "Build language, image, and sound prompts with the CRAFT, PICTURE, and SONIC card decks.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f8" },
    { media: "(prefers-color-scheme: dark)", color: "#151820" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable}`}
    >
      <body>
        {/* Renders null here; its script is server-inserted into <head>. */}
        <ThemeScript />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
