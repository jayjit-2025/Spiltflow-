# ⚡ Frontend & Stellar SDK Integration Reference

The SplitFlow frontend is a **Next.js 15 App Router** application built with **TypeScript**, **Zustand**, **TanStack Query**, and **`@stellar/stellar-sdk`**.

---

## 🔑 Core Services (`frontend/src/services/stellar.ts`)

### `@stellar/stellar-sdk` Imports
The service layer connects directly to Soroban RPC nodes:

```typescript
import {
  rpc,
  Contract,
  TransactionBuilder,
  Networks,
  nativeToScVal,
  scValToNative,
  Account
} from '@stellar/stellar-sdk';
```

### Key Functions

#### 1. `fetchAssetDetails(network, managerId, assetId)`
Simulates a read-only transaction calling `RoyaltyManager.get_asset(asset_id)` and parses the returned `ScVal` struct.

#### 2. `buildAndSimulateTx(network, senderAddress, contractId, functionName, args)`
- Queries current sequence number via `server.getAccount(senderAddress)`.
- Assembles a `TransactionBuilder` operation.
- Simulates transaction via `server.simulateTransaction()`.
- Prepares XDR payload ready for wallet signing.

#### 3. `pollTxStatus(network, txHash)`
Polls Soroban RPC `getTransaction(txHash)` until status reaches `SUCCESS` or `FAILED`.

---

## 💼 Wallet Integration (`StellarWalletsKit`)

Wallet connection is managed globally via `@creit.tech/stellar-wallets-kit`:
- Supported Wallets: Freighter, Albedo, xBull, HANA.
- Connection state stored in `useWalletStore` (Zustand).

---

## 📊 Client State Stores

- `useWalletStore`: Manages active public key, network, and connection status.
- `useActivityStore`: Polled Soroban events (`asset_registered`, `royalty_distributed`).
- `useTxStore`: Client-side persistent transaction logs (`PROCESSING`, `CONFIRMED`, `FAILED`).
