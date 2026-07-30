# 🔐 Smart Contracts Reference Specification

SplitFlow utilizes two Rust smart contracts built with the **Soroban SDK v21+**.

---

## 1. `RoyaltyManager` Contract

**Location:** [`contracts/royalty_manager/src/lib.rs`](../contracts/royalty_manager/src/lib.rs)

The `RoyaltyManager` acts as the decentralized registry for digital assets, contributor royalty allocations, and operational state.

### Data Structures

```rust
pub struct ContributorShare {
    pub address: Address,
    pub share: u32, // Share in basis points (e.g., 5000 = 50.00%)
}

pub struct AssetInfo {
    pub owner: Address,
    pub contributors: Vec<ContributorShare>,
    pub is_active: bool,
}
```

### Public Methods

#### `initialize(env: Env, admin: Address)`
Initializes the contract admin address. Can only be invoked once.

#### `register_asset(env: Env, owner: Address, asset_id: Symbol, contributors: Vec<ContributorShare>)`
Registers a new asset. 
- Requires `owner.require_auth()`.
- Validates $\sum \text{shares} == 10,000$.
- Bounded to maximum 10 contributors.

#### `update_asset(env: Env, owner: Address, asset_id: Symbol, new_contributors: Vec<ContributorShare>)`
Updates contributor allocations for an existing asset. Requires owner signature.

#### `deactivate_asset(env: Env, owner: Address, asset_id: Symbol)`
Deactivates an asset to prevent future royalty distributions.

#### `get_asset(env: Env, asset_id: Symbol) -> Option<AssetInfo>`
Returns on-chain metadata for an asset.

---

## 2. `RoyaltyDistributor` Contract

**Location:** [`contracts/royalty_distributor/src/lib.rs`](../contracts/royalty_distributor/src/lib.rs)

The `RoyaltyDistributor` executes atomic token transfers directly to contributor wallets based on the registry in `RoyaltyManager`.

### Public Methods

#### `initialize(env: Env, admin: Address, manager_address: Address, token_address: Address)`
Initializes distributor state with manager and native token contract references.

#### `distribute_royalty(env: Env, payer: Address, asset_id: Symbol, amount: i128)`
- Requires `payer.require_auth()`.
- Fetches asset information from `RoyaltyManager`.
- Validates `is_active == true`.
- Transfers tokens atomically from `payer` to each contributor's address based on their BPS percentage.
- Emits Soroban event `royalty_distributed`.
