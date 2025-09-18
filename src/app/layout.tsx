import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Drata Marketing Demo",
  description: "Modern SaaS marketing site demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div aria-hidden className="fixed inset-0 -z-10 bg-[radial-gradient(60rem_60rem_at_top_right,oklch(0.98_0.02_240/_60%)_0%,transparent_55%),radial-gradient(40rem_40rem_at_bottom_left,oklch(0.92_0.03_200/_45%)_0%,transparent_55%)] dark:bg-[radial-gradient(60rem_60rem_at_top_right,oklch(0.22_0.03_280/_50%)_0%,transparent_55%),radial-gradient(40rem_40rem_at_bottom_left,oklch(0.28_0.04_220/_45%)_0%,transparent_55%)]" />
          <SiteNavbar />
          <main className="min-h-[calc(100svh-56px)]">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
