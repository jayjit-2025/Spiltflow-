# 🛠️ End-to-End Developer Deployment & CI/CD Guide

Follow this guide to deploy, test, and run SplitFlow on Stellar Testnet or local networks.

---

## 📋 Prerequisites
- Node.js 20+
- Rust stable toolchain with `wasm32-unknown-unknown` target
- Stellar CLI (`stellar --version`)

---

## 🚀 Local Setup & Deployment

### Step 1: Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### Step 2: Build Smart Contracts
```bash
cargo build --target wasm32-unknown-unknown --release --workspace
```

### Step 3: Deploy Contracts to Testnet
```bash
npm run deploy -- --network testnet
```

### Step 4: Run Integration Test Suite
```bash
npm run test:integration
```

---

## 🤖 CI/CD Automation Workflow

GitHub Actions runs automated validation on every push:
- **Contract Tests**: `cargo test --workspace`
- **Contract Build**: `cargo build --target wasm32-unknown-unknown --release`
- **Frontend Build**: `npm --prefix frontend run build`
- **Testnet Deployment**: Deploys fresh WASM targets and executes `test:integration`.
