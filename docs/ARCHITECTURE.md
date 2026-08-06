# 🏗️ SplitFlow Architecture Overview

SplitFlow is a decentralized, trustless royalty distribution platform built on the **Stellar blockchain** using **Soroban WebAssembly (WASM) smart contracts**.

---

## 🎯 Architecture Principles

1. **Decoupled Architecture**: Separates asset governance (`RoyaltyManager`) from payment execution (`RoyaltyDistributor`).
2. **Basis-Point Precision**: Stores contributor split shares in basis points ($1 \text{ bp} = 0.01\%$) with a strict $10,000\text{ bp} = 100.00\%$ validation rule.
3. **Atomic Execution**: Payment splitting occurs within a single Soroban invocation; funds are transferred directly to contributor wallets on-chain.
4. **Transparent Auditability**: Every asset registration and payment emits standard Soroban events logged permanently on the Stellar ledger.

---

## 📐 System Component Diagram

```mermaid
flowchart TD
    subgraph Client Layer
        Creator[Creator / Artist]
        Buyer[Buyer / Customer]
        UI[SplitFlow Console UI<br/>Next.js + Tailwind + Zustand]
        Wallet[Stellar Wallet<br/>Freighter / Albedo / xBull / HANA]
    end

    subgraph Soroban Smart Contracts
        Manager[RoyaltyManager Contract<br/>Asset Registry & RBAC]
        Distributor[RoyaltyDistributor Contract<br/>Payment Splitting Engine]
    end

    subgraph Stellar Network
        RPC[Soroban RPC Server]
        Ledger[(Stellar Soroban Ledger)]
        SAC[Native XLM Asset Contract]
        Payees[Contributor Wallets<br/>Wallet A • Wallet B • Wallet C]
    end

    Creator -->|"1. Register Asset & BPS Splits"| UI
    UI -->|"Construct & Simulate TX"| RPC
    RPC -->|"Return Resource Footprint"| UI
    UI -->|"Request Signature"| Wallet
    Wallet -->|"Signed XDR Envelope"| RPC
    RPC -->|"register_asset()"| Manager
    Manager -->|"Store Asset Metadata"| Ledger

    Buyer -->|"2. Purchase Asset"| UI
    UI -->|"distribute_royalty()"| Wallet
    Wallet -->|"Signed Distribution TX"| RPC
    RPC -->|"distribute_royalty()"| Distributor
    Distributor -->|"Read Contributor BPS"| Manager
    Distributor -->|"Transfer Funds"| SAC
    SAC -->|"Split XLM Payments"| Payees
    Ledger -->|"Contract Events"| UI
```

---

## 🗄️ Supabase Database & Event Indexing Architecture

```mermaid
flowchart TD
    subgraph Frontend ["Next.js Frontend & Client Store"]
        UI["SplitFlow Web Application"]
        TxStore["Zustand Tx & Activity Store"]
        SupaClient["Supabase SDK Client (supabase.ts)"]
    end

    subgraph ServerlessAPI ["Next.js Serverless API Routes (/api)"]
        AssetsAPI["/api/assets (GET & POST)"]
        TxAPI["/api/transactions (GET & POST)"]
        ActivityAPI["/api/activity (GET)"]
        FeedbackAPI["/api/feedback (GET & POST)"]
    end

    subgraph SupabaseDB ["Supabase PostgreSQL Database Cloud"]
        TblAssets[("public.assets")]
        TblContribs[("public.contributors")]
        TblTxs[("public.transactions")]
        TblFeedback[("public.user_feedback")]
        RLS["Row Level Security (RLS) Policies"]
    end

    subgraph Blockchain ["Stellar Soroban Testnet Ledger"]
        Contracts["RoyaltyManager & RoyaltyDistributor"]
        SorobanRPC["Soroban RPC Server"]
        LedgerEvents["On-Chain Ledger Events"]
    end

    subgraph IndexerService ["Background Event Indexer (indexer.ts)"]
        PollWorker["Soroban RPC Event Listener"]
    end

    %% User Interaction Flow
    UI -->|"User Actions"| TxStore
    TxStore -->|"POST Confirmed Tx"| TxAPI
    UI -->|"Submit Feedback"| FeedbackAPI
    UI -->|"Query Assets & History"| AssetsAPI

    %% API to Database
    AssetsAPI --> SupaClient
    TxAPI --> SupaClient
    ActivityAPI --> SupaClient
    FeedbackAPI --> SupaClient

    SupaClient --> RLS
    RLS --> TblAssets
    RLS --> TblContribs
    RLS --> TblTxs
    RLS --> TblFeedback

    %% Blockchain Execution & Indexing
    UI -->|"Sign & Submit Tx"| SorobanRPC
    SorobanRPC -->|"Execute Contracts"| Contracts
    Contracts -->|"Emit Events"| LedgerEvents

    LedgerEvents -->|"getEvents()"| PollWorker
    PollWorker -->|"Upsert Ledger Logs"| TblTxs
```

---

## 🔢 Basis Points (BPS) Math Engine

Royalty shares are represented as integers ranging from $1$ to $10,000$:

$$\text{Share Percentage (\%)} = \frac{\text{Basis Points (BPS)}}{100}$$

### Split Formula
Given a total payment amount $P$ in Stroops ($1\text{ XLM} = 10^7\text{ Stroops}$) and contributor share $S_i$ in BPS:

$$\text{Payment}_i = \left\lfloor \frac{P \times S_i}{10,000} \right\rfloor$$

### Remainder Dust Prevention
To ensure zero tokens are stranded, any integer division remainder (dust) is automatically allocated to the asset owner:

$$\text{Dust} = P - \sum_{i=1}^{n} \text{Payment}_i$$

---

## 🔒 Security & Authorization Model

- **Asset Ownership**: Only the original creator address passed during `register_asset` can execute `update_asset` or `deactivate_asset`.
- **Active State Check**: `distribute_royalty` validates `is_active == true`. Inactive assets reject distribution transactions automatically.
- **Maximum Contributor Bound**: Assets are bounded to a maximum of 10 contributors per asset to enforce deterministic gas limits.
