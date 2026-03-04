import Link from "next/link";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AuthButton } from "@/components/auth/auth-button";
import { MainNav } from "@/components/layout/main-nav";
import { AppLogo } from "@/components/layout/app-logo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono"
});

export const metadata: Metadata = {
  title: "JobTrackr",
  description: "Track applications, improve ATS score, and automate cold emails.",
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    shortcut: ["/icon"],
    apple: [{ url: "/apple-icon", type: "image/png" }]
  },
  manifest: "/manifest.webmanifest"
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tracker", label: "Tracker", showReminderBadge: true },
  { href: "/timeline", label: "Timeline" },
  { href: "/resumes", label: "Resumes" },
  { href: "/referrals", label: "Referrals" },
  { href: "/career-explorer", label: "Career Explorer" },
  { href: "/ats-checker", label: "ATS Checker" },
  { href: "/cold-email", label: "Cold Email" }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} min-h-screen bg-background text-foreground antialiased`}>
        <Providers>
          <div className="min-h-screen">
            <header className="sticky top-0 z-30 border-b-2 border-slate-900 bg-[#FAF9F6]/95 backdrop-blur">
              <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 lg:px-8">
                <Link href="/" className="logo-link">
                  <AppLogo size="sm" />
                </Link>
                <MainNav items={navItems} />
                <AuthButton />
              </div>
            </header>
            <main className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
