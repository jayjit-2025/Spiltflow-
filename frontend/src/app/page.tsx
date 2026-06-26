'use client';

import React from 'react';
import Link from 'next/link';
import { useWalletStore } from '@/store/useWalletStore';
import { ArrowRight, Compass, Shield, Zap, Sparkles, Coins } from 'lucide-react';

export default function LandingPage() {
  const { isConnected, isConnecting } = useWalletStore();

  return (
    <div className="flex flex-col gap-20 py-10">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center max-w-4xl mx-auto gap-8 pt-12">
        {/* Background Glows */}
        <div className="absolute top-0 -z-10 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-0 -z-10 h-[250px] w-[250px] rounded-full bg-orange-600/5 blur-[80px]" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-wider uppercase animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Automated Trustless Splits</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
          Decentralized Royalties,{' '}
          <span className="orange-gradient-text">Distributed Instantly.</span>
        </h1>

        <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          SplitFlow is a next-generation revenue-sharing platform built on the Stellar network. 
          Register digital assets, specify contributors, and distribute royalties instantly at the protocol level—no middleman, no delays, and total transparency.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          {isConnected ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-orange-600 text-white font-bold rounded-xl shadow-xl transition-all duration-300 orange-glow-btn cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-orange-600 text-white font-bold rounded-xl shadow-xl transition-all duration-300 orange-glow-btn cursor-pointer"
            >
              <span>Launch App</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <a
            href="#features"
            className="px-8 py-3.5 bg-secondary hover:bg-secondary/80 border border-border font-bold text-foreground rounded-xl transition-all duration-200"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto w-full">
        {[
          { label: 'Total Volume Split', value: '1.2M XLM' },
          { label: 'Registered Assets', value: '14,820+' },
          { label: 'Instant Payees', value: '45,210' },
          { label: 'Average Split Fee', value: '< 0.0001 XLM' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl glass-panel border border-border text-center glass-card-glow">
            <div className="text-3xl font-extrabold text-foreground tracking-tight">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-2 uppercase tracking-wider font-semibold">
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* Features Section */}
      <section id="features" className="flex flex-col gap-12 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
          <h2 className="text-3xl font-black tracking-tight">Built for the Creator Economy</h2>
          <p className="text-sm text-muted-foreground">
            Eliminate traditional royalty accounting bottlenecks with automated, ledger-enforced splits.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl bg-secondary/30 border border-border flex flex-col gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Instant Distributions</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Royalty payments are processed on-chain in real-time. As soon as a transaction hits the distributor, contributors receive their split instantly.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-secondary/30 border border-border flex flex-col gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Tamper-Proof Metadata</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Asset configurations, contributors, and percentages are locked in the `royalty_manager` smart contract, ensuring immutable revenue terms.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-secondary/30 border border-border flex flex-col gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Coins className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Dust-Free Division</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our advanced division algorithms calculate exact fractions using basis points, routing any loose stroops/remainders back to the asset creator.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto w-full p-8 rounded-3xl bg-gradient-to-br from-secondary/40 to-background border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 h-[150px] w-[150px] rounded-full bg-primary/5 blur-[60px]" />
        <div className="flex-1 flex flex-col gap-6">
          <h2 className="text-3xl font-black tracking-tight">How it Works</h2>
          <div className="flex flex-col gap-4">
            {[
              { step: '1', title: 'Register Asset', desc: 'Specify an asset ID, owner, and up to 10 contributor addresses and their shares.' },
              { step: '2', title: 'Route Payments', desc: 'Direct your product checkout or streaming service payouts to our Royalty Distributor contract.' },
              { step: '3', title: 'Split Instantly', desc: 'Our distributor pulls the asset configurations and splits incoming funds directly into payees\' wallets.' }
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-sm">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full md:w-[350px] aspect-square rounded-2xl bg-secondary/50 border border-border flex items-center justify-center p-6 text-center relative overflow-hidden shrink-0">
          <div className="flex flex-col gap-3 items-center">
            <Compass className="h-12 w-12 text-primary animate-spin" style={{ animationDuration: '20s' }} />
            <div className="font-extrabold text-sm text-foreground">Soroban Engine Online</div>
            <div className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
              SplitFlow is powered by high-performance Rust smart contracts on the Stellar Network.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
