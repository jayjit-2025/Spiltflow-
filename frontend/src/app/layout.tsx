import type { Metadata } from 'next';
import { Michroma, Inter, Space_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import WalletConnect from '@/components/WalletConnect';
import InteractiveBackground from '@/components/InteractiveBackground';
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
          <header className="sticky top-0 z-50 w-full border-b border-[rgba(255,255,255,0.08)] bg-[#050505]/90 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* Brand Logo Left */}
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-5 h-5 border border-[rgba(255,255,255,0.3)] flex items-center justify-center rotate-45 group-hover:border-[#F97316] transition-colors">
                  <div className="w-2 h-2 bg-[#F97316]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-michroma text-sm tracking-wider text-[#F5F7FA]">
                    SPLITFLOW
                  </span>
                  <span className="text-[10px] text-[#B8C0CC] mono-font hidden sm:inline">
                    II PROTOCOL
                  </span>
                </div>
              </Link>

              {/* Centered Rectangular Navigation Box */}
              <nav className="hidden lg:flex items-center bg-[#0C0D10] border border-[rgba(255,255,255,0.1)] px-1 py-1 rounded-none">
                <Link
                  href="/"
                  className="px-4 py-1 text-xs mono-font text-[#B8C0CC] hover:text-[#F5F7FA] transition-colors"
                >
                  HOME
                </Link>
                <div className="w-[1px] h-3 bg-[rgba(255,255,255,0.1)]" />
                <Link
                  href="/dashboard"
                  className="px-4 py-1 text-xs mono-font text-[#B8C0CC] hover:text-[#F5F7FA] transition-colors"
                >
                  DASHBOARD
                </Link>
                <div className="w-[1px] h-3 bg-[rgba(255,255,255,0.1)]" />
                <Link
                  href="/activity"
                  className="px-4 py-1 text-xs mono-font text-[#B8C0CC] hover:text-[#F5F7FA] transition-colors"
                >
                  EVENTS
                </Link>
                <div className="w-[1px] h-3 bg-[rgba(255,255,255,0.1)]" />
                <Link
                  href="/transactions"
                  className="px-4 py-1 text-xs mono-font text-[#B8C0CC] hover:text-[#F5F7FA] transition-colors"
                >
                  LEDGER
                </Link>
                <div className="w-[1px] h-3 bg-[rgba(255,255,255,0.1)]" />
                <Link
                  href="/analytics"
                  className="px-4 py-1 text-xs mono-font text-[#B8C0CC] hover:text-[#F5F7FA] transition-colors"
                >
                  ANALYTICS
                </Link>
                <div className="w-[1px] h-3 bg-[rgba(255,255,255,0.1)]" />
                <Link
                  href="/docs"
                  className="px-4 py-1 text-xs mono-font text-[#B8C0CC] hover:text-[#F5F7FA] transition-colors"
                >
                  DOCS
                </Link>
              </nav>

              {/* Right Action / Wallet Signer Button */}
              <div className="flex items-center gap-3">
                <WalletConnect />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col z-10">
            {children}
          </main>

          {/* Minimalist Architectural Footer */}
          <footer className="w-full border-t border-[rgba(255,255,255,0.08)] bg-[#050505] py-10 z-10 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <div className="font-michroma text-xs text-[#F5F7FA] tracking-widest">SPLITFLOW PROTOCOL</div>
                <p className="text-xs text-[#B8C0CC]">
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
