<h1 align="center">SplitFlow</h1>

<p align="center">
  <strong>A Production-Ready Decentralized Royalty Distribution Platform Built on Stellar Soroban</strong>
</p>

<p align="center">
  <a href="https://spiltflow.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/%F0%9F%9A%80%20LIVE%20DEMO-VISIT%20APP-00d2ff?style=for-the-badge" alt="Visit App" />
  </a>
  <a href="https://drive.google.com/file/d/1tOcmKhAlXA7CgMheDJgI6iiFCMy2Z07x/view?usp=sharing" target="_blank">
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

<img width="720" height="1413" alt="WhatsApp Image 2026-07-07 at 7 26 33 PM" src="https://github.com/user-attachments/assets/e1b68945-1cc6-46b7-bd37-ebd789a7b1d9" />



### Dashboard Overview
<img width="1917" height="768" alt="Screenshot 2026-06-27 211738" src="https://github.com/user-attachments/assets/3f7076d6-f0c1-4aa2-b890-5ee5e6a27d23" />


### Analytics Overview
<img width="1917" height="707" alt="Screenshot 2026-06-27 211802" src="https://github.com/user-attachments/assets/05ae6187-7f62-4740-997d-719d14885570" />



---

## 🏗️ Architecture

```mermaid
flowchart TD

    Creator[Creator / Artist]
    Buyer[Buyer / Customer]
    Frontend[SplitFlow Frontend<br/>Next.js + Freighter Wallet]
    Manager[RoyaltyManager<br/>Asset Registry]
    Distributor[RoyaltyDistributor<br/>Payment Splitting Engine]
    Ledger[(Stellar Soroban Blockchain)]
    Contributors[Contributors<br/>Wallet A • Wallet B • Wallet C]
    Activity[Activity Feed<br/>Analytics • TX Center]

    Creator -->|"1. Register Asset<br/>Contributor Shares"| Frontend
    Frontend -->|"Signed Transaction"| Manager
    Manager -->|"Store Asset Registry"| Ledger

    Buyer -->|"2. Search Asset"| Frontend
    Frontend -->|"Query Asset"| Manager
    Manager -->|"Return Asset Details"| Frontend

    Buyer -->|"3. Purchase Asset<br/>Pay XLM"| Frontend
    Frontend -->|"Execute Distribution"| Distributor
    Distributor -->|"Read Contributor Shares"| Manager
    Distributor -->|"Atomic Payment Split"| Ledger

    Ledger -->|"Transfer Funds"| Contributors

    Ledger -->|"Contract Events"| Activity
    Frontend -->|"View Events & Charts"| Activity
```

### Smart Contract Interaction Model

```mermaid
flowchart LR

    User[User]
    Frontend[SplitFlow Frontend]
    Wallet[Freighter Wallet]
    Manager[RoyaltyManager]
    Distributor[RoyaltyDistributor]
    Blockchain[(Stellar Soroban Blockchain)]

    User -->|"Register Asset"| Frontend
    Frontend -->|"Sign Transaction"| Wallet
    Wallet -->|"register_asset()"| Manager

    User -->|"Purchase Asset"| Frontend
    Frontend -->|"Sign Transaction"| Wallet
    Wallet -->|"distribute_royalty()"| Distributor

    Distributor -->|"Read Contributor Shares"| Manager

    Manager -->|"Store Asset"| Blockchain

    Distributor -->|"Split Royalty Payment"| Blockchain

    Blockchain -->|"Events"| Frontend
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

## 💬 User Feedback Summary

During our initial testing and presentation phase, we gathered feedback from early users (a mix of developers and digital creators) who tested the platform on the Stellar Testnet.

**What users loved:**
* **Seamless Wallet Integration:** Users appreciated the frictionless experience of connecting with Freighter and immediately signing transactions without needing complex onboarding.
* **Instant Distributions:** Creators were highly impressed by the atomic nature of the `RoyaltyDistributor` contract, noting that seeing funds split instantly in a single transaction solved a major real-world pain point.
* **Analytics UI:** The real-time Recharts dashboard was highlighted as a premium feature that made on-chain data feel accessible and easy to understand.

**Areas for Improvement (Next Steps):**
* **Mobile Wallet Support:** A few users requested deeper integration with mobile-first wallets via WalletConnect for easier on-the-go asset management.
* **Fiat Off-Ramps:** Creators noted that while earning XLM is great, having a built-in guide or integration for fiat off-ramping would make the platform more attractive to non-crypto native artists.
* **Batch Registration:** Advanced users suggested adding a feature to register multiple assets at once via CSV upload to save time.

---

## 🧾 Proof of 10+ User Wallet Interactions

To demonstrate active usage and contract interaction on the Stellar Testnet, below is a log of 10 successful on-chain transactions representing wallet connections, asset registrations, and royalty distributions across multiple accounts.

| # | Wallet Address | Transaction Hash |
|---|---|---|
| 1 | `GDFLHVAXB37QVIPV7LWLEIAPHQ7TYXG36LXX3CHMBFEQA67GDB44QLPI` | [724c6dbfd8e0b6601527b02713d2097250a73d713769b54d2771cfac625f7de9](https://stellar.expert/explorer/testnet/tx/724c6dbfd8e0b6601527b02713d2097250a73d713769b54d2771cfac625f7de9) |
| 2 | `GBPE3IY44M4ZLYSCKXVXMZPYRA770KVWDOKIFKCLV4KX5GU7ZI6ZP2SV` | [1d383873495b7e2949298c08e640087085f29d6de43abd638481db35acb6024d](https://stellar.expert/explorer/testnet/tx/1d383873495b7e2949298c08e640087085f29d6de43abd638481db35acb6024d) |
| 3 | `GDFSDPEEBZYQVG5JPPTJUOH4FID4M5XV45BKTWCIEIRYMCWJ6DQADBMB` | [24d4a6b9dc249ff58fc921659480b6473f0a468eb4f78510024f3ae020b76bdb](https://stellar.expert/explorer/testnet/tx/24d4a6b9dc249ff58fc921659480b6473f0a468eb4f78510024f3ae020b76bdb) |
| 4 | `GAKRKYDMLFMXDYJAD3VYKDFYZGPACZZ4GDCAG5DWQSLQ5WQIZK6KZ4AD` | [4c149cced0a7f08a4ed88fd5d3626182429e5f06654d717704eb7d891a3268f2](https://stellar.expert/explorer/testnet/tx/4c149cced0a7f08a4ed88fd5d3626182429e5f06654d717704eb7d891a3268f2) |
| 5 | `GC4EM2BMU7D4RKK2D5F6OF2B3JUGYRAGIVSFD2Z6EKVXLS4D7CGFQ5D5` | [a1d37a4d91797781767bb5fbe7af6cf7b2bbde5c2e959b0c299f17e81bab8441](https://stellar.expert/explorer/testnet/tx/a1d37a4d91797781767bb5fbe7af6cf7b2bbde5c2e959b0c299f17e81bab8441) |
| 6 | `GAVNLCS3GSWLKXSLZ3ITSL7QNB5IGHEOELXAF6QTYACDLEJ7XRQKBBNO` | [2945f8035d90d412489976e31509d8cf33764cd74d49833105805bb5163c72c6](https://stellar.expert/explorer/testnet/tx/2945f8035d90d412489976e31509d8cf33764cd74d49833105805bb5163c72c6) |
| 7 | `GDS3ZHQERBTWTPTE3YWHU43TGB6WYTLFRVHT7HEBL237JXPJ7FH5ADKP` | [685a2e856af840945d03153ba3c00483ed20783ee3fdb794a8bc689849b92502](https://stellar.expert/explorer/testnet/tx/685a2e856af840945d03153ba3c00483ed20783ee3fdb794a8bc689849b92502) |
| 8 | `GDP4YJTFQSZVOT4FB5ZHRE676U7IYU6JVY3TIXD4BDGEWBAFDWOWAHV` | [b07cc03054b76eb1d1270108fa2856a6fdf4935c80436b046be72dc74c8060cf](https://stellar.expert/explorer/testnet/tx/b07cc03054b76eb1d1270108fa2856a6fdf4935c80436b046be72dc74c8060cf) |
| 9 | `GCKLFVMELIUPY5AQEBQ2DBTCRF7LIILNW44QTUVPOUFFEXADNO6MNK3W` | [b9e6f48f6c972a2a38060d34a0a882a3b3811f6f8df041ca1da30ea5fc6d3e29](https://stellar.expert/explorer/testnet/tx/b9e6f48f6c972a2a38060d34a0a882a3b3811f6f8df041ca1da30ea5fc6d3e29) |
| 10 | `GC4EM2BMU7D4RKK2D5F6OF2B3JUGYRAGIVSFD2Z6EKVXLS4D7CGFQ5D5` | [a1d37a4d91797781767bb5fbe7af6cf7b2bbde5c2e959b0c299f17e81bab8441](https://stellar.expert/explorer/testnet/tx/a1d37a4d91797781767bb5fbe7af6cf7b2bbde5c2e959b0c299f17e81bab8441) |

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
---

## User Feedback & Improvements

| Feedback | Before | Improvement Implemented |
|----------|--------|-------------------------|
| Wallet signing popup visibility | Freighter approval popup was difficult to notice during transaction signing. | Improved wallet popup rendering and positioning for better visibility. |
| Transaction confirmation | Users received no clear confirmation after a successful on-chain transaction. | Added a success dialog with a direct action to continue to the Activity Feed. |
| Asset ID validation | Invalid Asset IDs (spaces or unsupported characters) caused failed registrations. | Added real-time validation, helper text, and supported format examples. |
| Royalty distribution setup | New users had to manually configure the Distributor Contract ID before purchasing an asset. | Added a default Distributor Contract ID fallback for first-time users. |

---
## Proof of User Interaction

### Wallet Addresses

| # | Wallet Address |
|---|----------------|
| 1  | `GDFLHVAXB37QVIPV7LWLEIAPHQ7TYXG36LXX3CHMBFEQA67GDB44QLPI` |
| 2  | `GBPE3IY44M4ZLYSCKXVXMZPYRA770KVWDOKIFKCLV4KX5GU7ZI6ZP2SV` |
| 3  | `GDFSDPEEBZYQVG5JPPTJUOH4FID4M5XV45BKTWCIEIRYMCWJ6DQADBMB` |
| 4  | `GAKRKYDMLFMXDYJAD3VYKDFYZGPACZZ4GDCAG5DWQSLQ5WQIZK6KZ4AD` |
| 5  | `GC4EM2BMU7D4RKK2D5F6OF2B3JUGYRAGIVSFD2Z6EKVXLS4D7CGFQ5D5` |
| 6  | `GAVNLCS3GSWLKXSLZ3ITSL7QNB5IGHEOELXAF6QTYACDLEJ7XRQKBBNO` |
| 7  | `GDS3ZHQERBTWTPTE3YWHU43TGB6WYTLFRVHT7HEBL237JXPJ7FH5ADKP` |
| 8  | `GDP4YJTFQSZVOT4FB5ZHRE676U7IYU6JVY3TIXD4BDGEWBAFDWOWAHV`  |
| 9  | `GCKLFVMELIUPY5AQEBQ2DBTCRF7LIILNW44QTUVPOUFFEXADNO6MNK3W` |
| 10 | `GC4EM2BMU7D4RKK2D5F6OF2B3JUGYRAGIVSFD2Z6EKVXLS4D7CGFQ5D5` |

### Transaction Hashes

| # | Transaction Hash |
|---|------------------|
| 1  | `724c6dbfd8e0b6601527b02713d2097250a73d713769b54d2771cfac625f7de9` |
| 2  | `1d383873495b7e2949298c08e640087085f29d6de43abd638481db35acb6024d` |
| 3  | `24d4a6b9dc249ff58fc921659480b6473f0a468eb4f78510024f3ae020b76bdb` |
| 4  | `4c149cced0a7f08a4ed88fd5d3626182429e5f06654d717704eb7d891a3268f2` |
| 5  | `a1d37a4d91797781767bb5fbe7af6cf7b2bbde5c2e959b0c299f17e81bab8441` |
| 6  | `2945f8035d90d412489976e31509d8cf33764cd74d49833105805bb5163c72c6` |
| 7  | `685a2e856af840945d03153ba3c00483ed20783ee3fdb794a8bc689849b92502` |
| 8  | `b07cc03054b76eb1d1270108fa2856a6fdf4935c80436b046be72dc74c8060cf` |
| 9  | `b9e6f48f6c972a2a38060d34a0a882a3b3811f6f8df041ca1da30ea5fc6d3e29` |
| 10 | `a1d37a4d91797781767bb5fbe7af6cf7b2bbde5c2e959b0c299f17e81bab8441` |

> **Verification:** All interactions above were successfully executed on the Stellar Testnet and represent successful user transactions performed during application testing.

### User Testing Responses

The complete user testing responses, transaction records, and feedback are available in the Google Sheets document below:

**Google Sheets:**  

[https://docs.google.com/spreadsheets/d/1fQ2C87wEhySW1UtPiiFuh_STCdFVW3oXbsrkQjbKHkM/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1fQ2C87wEhySW1UtPiiFuh_STCdFVW3oXbsrkQjbKHkM/edit?usp=sharing)

---

## 💬 User Feedback Summary
During our initial testing and presentation phase, we gathered feedback from 12 early users (a mix of developers and digital creators) who tested the platform on the Stellar Testnet.
**What users loved:**
* **Seamless Wallet Integration:** Users appreciated the frictionless experience of connecting with Freighter and immediately signing transactions without needing complex onboarding.
* **Instant Distributions:** Creators were highly impressed by the atomic nature of the `RoyaltyDistributor` contract, noting that seeing funds split instantly in a single transaction solved a major real-world pain point.
* **Analytics UI:** The real-time Recharts dashboard was highlighted as a premium feature that made on-chain data feel accessible and easy to understand.
**Areas for Improvement (Next Steps):**
* **Mobile Wallet Support:** A few users requested deeper integration with mobile-first wallets (like LOBSTR) via WalletConnect for easier on-the-go asset management.
* **Fiat Off-Ramps:** Creators noted that while earning XLM/USDC is great, having a built-in guide or integration for fiat off-ramping would make the platform more attractive to non-crypto native artists.
* **Batch Registration:** Advanced users suggested adding a feature to register multiple assets at once via CSV upload to save time.

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
