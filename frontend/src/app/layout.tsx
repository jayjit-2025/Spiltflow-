import type { Metadata } from 'next';
import { Michroma, Inter, Space_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import InteractiveBackground from '@/components/InteractiveBackground';
import BrandLogo from '@/components/BrandLogo';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const michroma = Michroma({
  subsets: ['latin'],
  variable: '--font-michroma',
  weight: ['400'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'SPLITFLOW — Decentralized Royalty Infrastructure Protocol',
  description: 'Automated revenue-sharing and royalty splits directly on Stellar Soroban smart contracts.',
  icons: {
    icon: '/logo-mark.svg',
    shortcut: '/logo-mark.svg',
    apple: '/logo-mark.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full dark ${michroma.variable} ${inter.variable} ${spaceMono.variable}`}
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-[#F5F7FA] antialiased relative font-sans">
        <Providers>
          {/* Layered Interactive Atmosphere & Moving Light Beams Background */}
          <InteractiveBackground />

          {/* Minimal Architectural Navigation Header */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col z-10">
            {children}
          </main>

          {/* Minimalist Architectural Footer */}
          <footer className="w-full border-t border-[rgba(255,255,255,0.08)] bg-[#050505] py-10 z-10 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <BrandLogo variant="full" />
                <p className="text-xs text-[#B8C0CC] max-w-md">
                  Automated trustless revenue sharing built on Stellar Soroban smart contracts.
                </p>
              </div>
              <div className="text-xs mono-font text-[#B8C0CC] text-center md:text-right">
                &copy; {new Date().getFullYear()} SPLITFLOW. ALL RIGHTS RESERVED.
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
