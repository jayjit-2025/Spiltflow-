import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import WalletConnect from '@/components/WalletConnect';
import Link from 'next/link';
import { Activity, LayoutDashboard, Settings, TrendingUp, Compass, History, Menu } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SplitFlow - Decentralized Royalty Distribution System',
  description: 'Automate revenue sharing and royalties transparently and trustlessly on the Stellar network.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${inter.className} min-h-full flex flex-col bg-background text-foreground antialiased pb-16 md:pb-0`}>
        <Providers>
          {/* Top Header */}
          <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 group">
                <Compass className="h-6 w-6 text-primary group-hover:rotate-45 transition-transform duration-300" />
                <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  SPLIT<span className="text-primary">FLOW</span>
                </span>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-primary/80" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/activity"
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Activity className="h-4 w-4 text-primary/80" />
                  <span>Activity Feed</span>
                </Link>
                <Link
                  href="/transactions"
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <History className="h-4 w-4 text-primary/80" />
                  <span>Tx Center</span>
                </Link>
                <Link
                  href="/analytics"
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <TrendingUp className="h-4 w-4 text-primary/80" />
                  <span>Analytics</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="h-4 w-4 text-primary/80" />
                  <span>Settings</span>
                </Link>
              </nav>

              {/* Wallet Connection */}
              <div className="flex items-center gap-2 md:gap-4">
                <WalletConnect />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col">
            {children}
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-45 md:hidden h-16 bg-background/95 border-t border-border flex items-center justify-around px-2 backdrop-blur-lg">
            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center flex-1 text-center py-1 text-muted-foreground hover:text-primary active:text-primary transition-colors"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">Dashboard</span>
            </Link>
            <Link
              href="/activity"
              className="flex flex-col items-center justify-center flex-1 text-center py-1 text-muted-foreground hover:text-primary active:text-primary transition-colors"
            >
              <Activity className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">Activity</span>
            </Link>
            <Link
              href="/transactions"
              className="flex flex-col items-center justify-center flex-1 text-center py-1 text-muted-foreground hover:text-primary active:text-primary transition-colors"
            >
              <History className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">History</span>
            </Link>
            <Link
              href="/analytics"
              className="flex flex-col items-center justify-center flex-1 text-center py-1 text-muted-foreground hover:text-primary active:text-primary transition-colors"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">Analytics</span>
            </Link>
            <Link
              href="/settings"
              className="flex flex-col items-center justify-center flex-1 text-center py-1 text-muted-foreground hover:text-primary active:text-primary transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">Settings</span>
            </Link>
          </div>

          {/* Footer */}
          <footer className="w-full border-t border-border bg-background py-6 text-center text-xs text-muted-foreground mb-16 md:mb-0">
            <div className="max-w-7xl mx-auto px-4">
              <p>&copy; {new Date().getFullYear()} SplitFlow. Built on the Stellar Network. Production-grade Orange Belt Protocol.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
