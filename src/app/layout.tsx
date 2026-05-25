import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import ThemeToggle from "./ThemeToggle";
import AboutMe from "./AboutMe";
import MobileMenu from "./MobileMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "GetInstantPlay",
  description: "A small collection of browser games, instantly playable.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stored = (await cookies()).get("instantplay-theme")?.value;
  const dataTheme =
    stored === "light" || stored === "dark" ? stored : undefined;

  return (
    <html
      lang="en"
      data-theme={dataTheme}
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
            <Link
              href="/"
              className="font-serif text-2xl tracking-tight text-foreground"
            >
              GetInstant<span className="italic text-accent">play</span>
            </Link>
            <div className="hidden items-center gap-6 sm:flex">
              <Link
                href="/"
                className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground"
              >
                All games
              </Link>
              <AboutMe />
              <ThemeToggle />
            </div>
            <MobileMenu />
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted sm:px-10">
            <span>© {new Date().getFullYear()} GetInstantPlay</span>
            <span className="font-mono">v0.1</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
