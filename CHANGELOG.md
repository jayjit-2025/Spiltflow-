# 📜 SplitFlow Release Changelog

All notable changes to the **SplitFlow** Decentralized Royalty Distribution Platform are documented in this file.

---

## 🚀 [v2.1.0] — 2026-08-13 (100th Commit Milestone 🎉)

### 🌟 Milestone Summary
With this release, SplitFlow achieves its **100th git commit milestone**, delivering a production-ready, audited, and visually stunning royalty engine built on Stellar Soroban v2.1.0 smart contracts.

---

### 🎨 Visual & Brand Assets System
- **Brand Identity**: Added vector SVG brand logos (`splitflow_logo_banner.svg`, `splitflow_logo_primary.svg`, `splitflow_logo_mark.svg`).
- **Brand Guide**: Added [`docs/BRANDING.md`](docs/BRANDING.md) detailing color tokens (`#050505` Obsidian, `#F97316` Primary Orange, `#9ED8FF` Glacial Blue) and typography specifications.
- **Hero & Backgrounds**: Integrated interactive 3D particle canvas (`InteractiveBackground.tsx`) and floating visualizer mesh.
- **Platform Tour Grid**: Updated README with 5 high-resolution UI screenshots.

---

### 🔐 Smart Contracts (Soroban Rust 1.75+)
- **`RoyaltyManager`**: Decentralized asset registration with basis-point (BPS) sum validation ($10,000\text{ BPS} = 100.00\%$), owner access control (`require_auth()`), and asset state toggles.
- **`RoyaltyDistributor`**: Single-transaction atomic payment splitting with Stellar Native XLM (SAC token), zero dust retention, and payer authentication.

---

### ⚡ Frontend & Client Architecture (Next.js 15)
- **StellarWalletsKit**: Multi-wallet support (Freighter, Albedo, xBull, HANA).
- **Zustand State Stores**: `useWalletStore`, `useTxStore`, and `useActivityStore` for real-time telemetry and persistent history.
- **Vitest Unit Suite**: 24 tests across 4 suites covering stores, BPS math, Asset ID validation rules, and Stroop currency conversions.

---

### 🚀 CI/CD & Deployment Infrastructure
- **GitHub Actions**: Automated workflow (`.github/workflows/ci-cd.yml`) executing Rust contract tests, Next.js production builds, and automated Testnet deployment scripts.
- **Vercel Deployment**: Live production deployment connected to GitHub repository.

---

## 📜 Historical Versions

### [v2.0.0] — 2026-08-01
- Migration to Soroban Rust SDK v21.
- Introduction of basis-point arithmetic ($10,000\text{ BPS}$).

### [v1.0.0] — 2026-07-15
- Initial prototype and Stellar Testnet deployment.
