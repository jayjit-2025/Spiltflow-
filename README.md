<h1 align="center">SplitFlow</h1>

<p align="center">
  <strong>A Production-Ready Decentralized Royalty Distribution Platform Built on Stellar Soroban</strong>
</p>

<p align="center">
  <a href="https://spiltflow.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/%F0%9F%9A%80%20LIVE%20DEMO-VISIT%20APP-00d2ff?style=for-the-badge" alt="Visit App" />
  </a>
  <a href="https://github.com/jayjit-2025/splitflow-protocol" target="_blank">
    <img src="https://img.shields.io/badge/%F0%9F%8E%AC%20DEMO%20VIDEO-WATCH%20NOW-ff3366?style=for-the-badge" alt="Watch Now" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/CI%20PIPELINE-PASSING-22c55e?style=for-the-badge&logo=github-actions&logoColor=white" alt="CI Status" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NEXT.JS%2015-black?style=for-the-badge&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/STELLAR-ef4444?style=for-the-badge&logo=stellar" alt="Stellar" />
  <img src="https://img.shields.io/badge/SOROBAN-v21-vibrantgreen?style=for-the-badge" alt="Soroban" />
  <img src="https://img.shields.io/badge/FREIGHTER-3b82f6?style=for-the-badge" alt="Freighter" />
  <img src="https://img.shields.io/badge/LICENSE-MIT-22c55e?style=for-the-badge" alt="License" />
</p>

---

## ✨ Overview

SplitFlow is a fully decentralized royalty distribution system built on the Stellar blockchain using Soroban smart contracts. Any creator can register a digital asset (song, video, artwork, software), define contributors and their percentage shares, and have royalty payments **automatically split on-chain** whenever a purchase occurs — no middlemen, no manual transfers.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Multi-contract Architecture** | `RoyaltyManager` handles asset registry & RBAC; `RoyaltyDistributor` handles atomic token splitting |
| 💰 **Basis-Point Precision** | Shares defined in basis points (1 bp = 0.01%) with on-chain sum validation to exactly 10,000 |
| ⚡ **Atomic Distribution** | All contributors receive their exact share in a single Soroban invocation |
| 🔑 **StellarWalletsKit** | Supports Freighter, Albedo, xBull, Rabet, HANA wallets out of the box |
| 📊 **Analytics Dashboard** | Real-time event charts powered by Recharts |
| 🧪 **Full Test Suite** | 15+ Vitest unit tests + Rust contract tests + integration test script |
| 🚀 **CI/CD Ready** | GitHub Actions pipeline for lint, test, build, and automated Testnet deploy |

---

## 📖 What is SplitFlow?

SplitFlow is a decentralized royalty distribution platform built on Stellar Soroban that automates revenue sharing for collaborative digital assets.

When a creator registers an asset with contributor wallet addresses and royalty percentages, SplitFlow automatically:

🔗 Registers the asset on the Stellar blockchain.

👥 Stores contributor wallet addresses and royalty shares securely.

💸 Automatically splits customer payments among contributors.

⚡ Executes transparent, trustless on-chain transactions.

📜 Records every payment permanently for auditability.

---

## 🔴 Problem Statement

Traditional royalty distribution suffers from several challenges:

1.Manual calculation and payment of royalties.

2.Delayed or missed payments to contributors.

3.Lack of transparency and trust between collaborators.

4.Centralized systems that rely on intermediaries.

5.No immutable record of payment distribution.

---

## 🟢 Solution

SplitFlow solves these challenges using Stellar Soroban Smart Contracts by providing:

✅ Automatic royalty distribution without manual intervention.

🔒 Immutable on-chain royalty agreements.

⚖️ Fair, transparent, and trustless revenue sharing.

🚀 Fast, low-cost transactions on the Stellar network.

📊 Permanent blockchain records for every payment.

---

## 📸 App Preview & Screenshots

### 📱 Mobile View (Responsive Portrait UI)

<p align="center">
  <img src="https://i.imgur.com/your_generated_image_link_here.png" alt="SplitFlow Mobile Dashboard UI Mockup" width="360" style="border-radius: 20px; border: 1px solid #18181b;" />
</p>


### Dashboard Overview
<img width="1917" height="768" alt="Screenshot 2026-06-27 211738" src="https://github.com/user-attachments/assets/3f7076d6-f0c1-4aa2-b890-5ee5e6a27d23" />


### Analytics Overview
<img width="1917" height="707" alt="Screenshot 2026-06-27 211802" src="https://github.com/user-attachments/assets/05ae6187-7f62-4740-997d-719d14885570" />



---

## 🏗️ Architecture

```
SplitFlow/
├── contracts/                     # Soroban smart contracts (Rust)
│   ├── Cargo.toml                 # Workspace definition
│   ├── royalty_manager/           # Asset registry + RBAC
│   │   └── src/
│   │       ├── lib.rs             # Contract implementation
│   │       └── test.rs            # Unit & integration tests
│   └── royalty_distributor/       # Token splitting engine
│       └── src/
│           ├── lib.rs
│           └── test.rs
│
├── frontend/                      # Next.js 15 App Router
│   └── src/
│       ├── app/                   # Pages (dashboard, analytics, settings, etc.)
│       ├── components/            # WalletConnect, Providers, etc.
│       ├── services/              # Soroban SDK layer (stellar.ts, events.ts)
│       ├── store/                 # Zustand state stores
│       └── __tests__/             # Vitest unit tests (15 tests)
│
├── scripts/                       # Automation scripts
│   ├── deploy.ts                  # Deploy contracts + write .env.local
│   ├── initialize.ts              # Post-deploy contract initialization
│   └── test-integration.ts        # End-to-end on-chain integration test
│
└── .github/workflows/
    └── ci-cd.yml                  # Full CI/CD pipeline
```

### Smart Contract Interaction Model

```
         User (Frontend)
              │
              ▼
   ┌─────────────────────┐
   │  RoyaltyDistributor │   ←── receives payment (i128 token amount)
   │  distribute(id, amt)│
   └────────┬────────────┘
            │  invoke_contract()
            ▼
   ┌─────────────────────┐
   │   RoyaltyManager    │   ←── returns Vec<Contributor> { address, share }
   │  get_contributors() │
   └─────────────────────┘
            │  for each contributor
            ▼
   ┌─────────────────────┐
   │   SEP-0041 Token    │   ←── transfer(from=payer, to=contributor, amount=share)
   │   (XLM SAC / other) │
   └─────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Rust | ≥ 1.75  | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| wasm32 target | — | `rustup target add wasm32-unknown-unknown` |
| Stellar CLI | latest | `cargo install --locked stellar-cli --features opt` |
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org) |

### 1. Clone & Install

```bash
git clone https://github.com/jayjit-2025/Spiltflow-.git
cd Spiltflow-
```

### 2. Build & Test Smart Contracts

```bash
cd contracts

# Run all contract tests
cargo test --workspace

# Build WASM artifacts
cargo build --target wasm32-unknown-unknown --release --workspace
```

### 3. Deploy to Testnet

```bash
# Fund a testnet account (via Stellar Laboratory or Friendbot)
# Then export your secret key:
export DEPLOYER_SECRET_KEY="SXXXX..."

# Deploy both contracts + auto-generate .env.local
npx ts-node scripts/deploy.ts --network testnet
```

### 4. Run the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template (populated by deploy script)
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉


---
## 🔗 Mission Credentials

To fulfill the **Level 3 (Orange Belt)** requirements, the following identifiers are provided for verification:

| Category | Identifier / Link |
| :--- | :--- |
| **RoyaltyManager Contract ID** | `CD2GSKODG4YI7CCHFKJTTR2BMZIJMQZRYU7JH666T2Z2WQC5HOVAVFW4` |
| **RoyaltyDistributor Contract ID** | `CAGLWDRQ2IIRGIFGJJZTUA4LM3KLEOCFZVHVNE6HIXHMY2KZP6GNXAJT` |
| **Transaction Hash** | `5cac9796d59865b8c7ed7dba36883192bfd9dcb863f1e8106b1224247783ac54` |
| **Stellar Explorer** | [View Split Engine on Stellar.Expert](https://stellar.expert/explorer/testnet/contract/CAGLWDRQ2IIRGIFGJJZTUA4LM3KLEOCFZVHVNE6HIXHMY2KZP6GNXAJT) |
| **CI/CD Pipeline** | ![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square&logo=github-actions) |
| **Live Demo Link** | [Visit Live Application (Vercel)](https://spiltflow.vercel.app) |
| **Demo Video** | [Watch Walkthrough (1–2 min)](https://github.com/jayjit-2025/splitflow-protocol) |

---
---


## 🧪 Testing
**15 tests across 3 suites:**
- `useWalletStore.test.ts` — 5 tests (connect/disconnect, error, network)
- `useTxStore.test.ts` — 6 tests (lifecycle, PENDING→CONFIRMED, retry, clearHistory)
- `useActivityStore.test.ts` — 4 tests (add, ordering, clearActivities)

### Smart Contract Tests (Rust)

```bash
cd contracts
cargo test --workspace
```
Showing 3/3 tests passing successfully

![Smart Contract Test Passing Output](./assets/test_passing_cargo.png)

Tests cover: asset registration, contributor validation, share sum enforcement, distribution, access control, deactivation/reactivation.

### Integration Tests (on Testnet)

```bash
# Ensure MANAGER_CONTRACT_ID and DISTRIBUTOR_CONTRACT_ID are set
export MANAGER_CONTRACT_ID="CXXX..."
export DISTRIBUTOR_CONTRACT_ID="CYYY..."

npx ts-node scripts/test-integration.ts
```

---

## 🔐 Smart Contract Reference

### RoyaltyManager

| Function | Auth Required | Description |
|----------|--------------|-------------|
| `initialize(admin)` | — | One-time setup, sets admin address |
| `register_asset(asset_id, owner, contributors)` | Owner | Register asset with contributor splits |
| `update_contributors(asset_id, contributors)` | Owner | Update split percentages |
| `deactivate_asset(asset_id)` | Owner | Halt further distributions |
| `reactivate_asset(asset_id)` | Owner | Resume distributions |
| `get_asset(asset_id)` | — | Read full asset metadata |
| `get_contributors(asset_id)` | — | Read contributor list (used by distributor) |

### RoyaltyDistributor

| Function | Auth Required | Description |
|----------|--------------|-------------|
| `initialize(manager_id, token_id)` | Admin | Configure contract addresses |
| `distribute(asset_id, amount)` | Payer (`require_auth`) | Split `amount` of token among contributors |

### Data Types

```rust
// Contributor — share in basis points (e.g. 5000 = 50.00%)
struct Contributor {
    address: Address,
    share: u32,       // 1..=10000
}

// Asset registration data
struct AssetData {
    asset_id: Symbol,
    owner: Address,
    contributors: Vec<Contributor>,
    is_active: bool,
    created_at: u64,
}
```

> **Share validation:** The sum of all `contributor.share` values must equal exactly `10_000` basis points (100.00%). The contract enforces this on every `register_asset` and `update_contributors` call.

---

## 🌐 Deployed Contracts (Testnet)

| Contract | Contract ID | Explorer |
|----------|-------------|---------|
| RoyaltyManager | `CD2GSKODG4YI7CCHFKJTTR2BMZIJMQZRYU7JH666T2Z2WQC5HOVAVFW4` | [stellar.expert](https://stellar.expert/explorer/testnet/contract/CD2GSKODG4YI7CCHFKJTTR2BMZIJMQZRYU7JH666T2Z2WQC5HOVAVFW4) |
| RoyaltyDistributor | `CAGLWDRQ2IIRGIFGJJZTUA4LM3KLEOCFZUHVNE6HIXHMY2KZP6GNXAJT` | [stellar.expert](https://stellar.expert/explorer/testnet/contract/CAGLWDRQ2IIRGIFGJJZTUA4LM3KLEOCFZUHVNE6HIXHMY2KZP6GNXAJT) |

### On-Chain Interaction Reference
* **Transaction Hash for Contract Interaction:** `5cac9796d59865b8c7ed7dba36883192bfd9dcb863f1e8106b1224247783ac54`
**Screenshot of Proof**
<img width="1917" height="745" alt="Screenshot 2026-06-27 213732" src="https://github.com/user-attachments/assets/0b9fd4fb-920b-4579-8d72-671cce01a1bb" />


> Contract IDs are auto-populated in `frontend/.env.local` by the deploy script.

---

## 🔧 Configuration

All frontend config is through environment variables. See [`frontend/.env.example`](./frontend/.env.example):

```env
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_MANAGER_CONTRACT_ID=C...
NEXT_PUBLIC_DISTRIBUTOR_CONTRACT_ID=C...
NEXT_PUBLIC_XLM_SAC_ID=CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA
```

Runtime overrides can also be set via the **Settings page** in the UI and are persisted to `localStorage`.

---

## 🛠️ CI/CD Pipeline

<img width="157" height="37" alt="image" src="https://github.com/user-attachments/assets/c9744cb9-9bcc-4481-b1d5-08fd353138b6" />

This project uses **GitHub Actions** for continuous integration. Every push to `main` automatically:

*   [x] Runs all 4 Soroban contract unit tests (`cargo test`)
*   [x] Builds the production React bundle (`npm run build`)





View live runs: [GitHub Actions](https://github.com/jayjit-2025/Spiltflow-/actions)

---

## 📦 Technology Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Rust + Soroban SDK v21 |
| Frontend Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| State Management | Zustand 5 |
| Data Fetching | TanStack React Query v5 |
| Stellar SDK | `@stellar/stellar-sdk` v16 |
| Wallet Integration | `@creit.tech/stellar-wallets-kit` v2 |
| Charts | Recharts 3 |
| Styling | Tailwind CSS v4 + custom dark theme |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library |
| CI/CD | GitHub Actions |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: add multi-token support"`
4. Push and open a Pull Request — CI will run automatically

---

## 📄 License

MIT © 2025 [jayjit-2025](https://github.com/jayjit-2025)

---

<div align="center">
  <strong>Built with 🟠 on Stellar</strong><br/>
  <a href="https://stellar.org">stellar.org</a> · <a href="https://soroban.stellar.org">soroban.stellar.org</a> · <a href="https://stellar.expert">stellar.expert</a>
</div>
