# SplitFlow 🟠

> **Decentralized Royalty Distribution on Stellar** — A production-ready Soroban smart contract application that automates revenue sharing among contributors of digital assets.

[![CI/CD](https://github.com/jayjit-2025/Spiltflow-/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/jayjit-2025/Spiltflow-/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](./LICENSE)
[![Stellar](https://img.shields.io/badge/Network-Stellar_Testnet-purple.svg)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Runtime-Soroban_v21-blue.svg)](https://soroban.stellar.org)

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

## 🧪 Testing

### Frontend Unit Tests (Vitest + RTL)

```bash
cd frontend
npm test               # Run once
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

**15 tests across 3 suites:**
- `useWalletStore.test.ts` — 5 tests (connect/disconnect, error, network)
- `useTxStore.test.ts` — 6 tests (lifecycle, PENDING→CONFIRMED, retry, clearHistory)
- `useActivityStore.test.ts` — 4 tests (add, ordering, clearActivities)

### Smart Contract Tests (Rust)

```bash
cd contracts
cargo test --workspace
```

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
| RoyaltyManager | _Run deploy script_ | [stellar.expert](https://stellar.expert/explorer/testnet) |
| RoyaltyDistributor | _Run deploy script_ | [stellar.expert](https://stellar.expert/explorer/testnet) |

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

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs on every PR and push to `main`:

```
┌────────────────────────────────────────────┐
│              On Pull Request               │
├──────────────┬─────────────┬──────────────┤
│  Contracts   │  Frontend   │   Security   │
│  ─────────── │  ────────── │  ────────── │
│  cargo fmt   │  tsc        │  npm audit   │
│  clippy      │  vitest     │  cargo-audit │
│  cargo test  │  next build │              │
│  wasm build  │             │              │
└──────────────┴─────────────┴──────────────┘
                      │
              push to main
                      │
             ┌────────────────┐
             │ Deploy Testnet │
             │  stellar CLI   │
             │  next build    │
             └────────────────┘
```

**Required GitHub Secrets:**
- `TESTNET_DEPLOYER_SECRET_KEY` — Stellar secret key with testnet XLM
- `TESTNET_MANAGER_CONTRACT_ID` — (optional, for build env vars)
- `TESTNET_DISTRIBUTOR_CONTRACT_ID` — (optional, for build env vars)

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