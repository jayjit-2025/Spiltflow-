#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, BytesN, Env, Symbol, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    // Lifecycle Errors
    NotInitialized = 101,
    AlreadyInitialized = 102,

    // Authorization Errors
    Unauthorized = 201,

    // Allocation Errors
    InvalidShares = 301,
    TooManyContributors = 302,

    // Asset Errors
    AssetAlreadyExists = 401,
    AssetDoesNotExist = 402,
    AssetInactive = 403,
    EpochDoesNotExist = 404,
    AssetAlreadyActive = 405,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContributorShare {
    pub address: Address,
    pub share: u32, // Basis points: 10000 = 100.00%
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AssetInfo {
    pub owner: Address,
    pub current_epoch_id: u32,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EpochConfig {
    pub epoch_id: u32,
    pub contributors: Vec<ContributorShare>,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Asset(Symbol),
    Epoch(Symbol, u32),
    PayeeShare(Symbol, u32, Address), // (asset_id, epoch_id, payee) -> share_bps
}

const BASIS_POINTS_MAX: u32 = 10000;
const MAX_CONTRIBUTORS: u32 = 50;
const TTL_THRESHOLD_LEDGERS: u32 = 10000; // ~14 hours at 5s/ledger
const TTL_LIMIT_LEDGERS: u32 = 100000; // ~5.7 days

#[contract]
pub struct RoyaltyManager;

#[contractimpl]
impl RoyaltyManager {
    /// Initializes the contract with an administrator.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Registers a new asset with contributor shares for Epoch 1.
    pub fn register_asset(
        env: Env,
        asset_id: Symbol,
        owner: Address,
        contributors: Vec<ContributorShare>,
    ) -> Result<(), Error> {
        owner.require_auth();

        let asset_key = DataKey::Asset(asset_id.clone());
        if env.storage().persistent().has(&asset_key) {
            return Err(Error::AssetAlreadyExists);
        }

        // Validate contributors and shares
        Self::validate_contributors(&env, &contributors)?;

        let asset_info = AssetInfo {
            owner: owner.clone(),
            current_epoch_id: 1,
            is_active: true,
        };

        let epoch_config = EpochConfig {
            epoch_id: 1,
            contributors,
        };

        let epoch_key = DataKey::Epoch(asset_id.clone(), 1);

        env.storage().persistent().set(&asset_key, &asset_info);
        env.storage()
            .persistent()
            .extend_ttl(&asset_key, TTL_THRESHOLD_LEDGERS, TTL_LIMIT_LEDGERS);

        env.storage().persistent().set(&epoch_key, &epoch_config);
        env.storage()
            .persistent()
            .extend_ttl(&epoch_key, TTL_THRESHOLD_LEDGERS, TTL_LIMIT_LEDGERS);

        // Store individual PayeeShare keys for O(1) claim-time lookups
        for contrib in epoch_config.contributors.iter() {
            let share_key = DataKey::PayeeShare(asset_id.clone(), 1, contrib.address);
            env.storage().persistent().set(&share_key, &contrib.share);
            env.storage().persistent().extend_ttl(
                &share_key,
                TTL_THRESHOLD_LEDGERS,
                TTL_LIMIT_LEDGERS,
            );
        }

        // Emit Registration Event
        env.events().publish(
            (Symbol::new(&env, "AssetRegistered"), asset_id.clone()),
            (owner, 1u32),
        );

        Ok(())
    }

    /// Updates contributor shares for an existing asset by creating a new Epoch.
    /// Historical epoch configurations remain completely immutable!
    pub fn update_asset(
        env: Env,
        asset_id: Symbol,
        contributors: Vec<ContributorShare>,
    ) -> Result<(), Error> {
        let asset_key = DataKey::Asset(asset_id.clone());
        let mut asset_info: AssetInfo = env
            .storage()
            .persistent()
            .get(&asset_key)
            .ok_or(Error::AssetDoesNotExist)?;

        asset_info.owner.require_auth();

        if !asset_info.is_active {
            return Err(Error::AssetInactive);
        }

        // Validate new contributors and shares
        Self::validate_contributors(&env, &contributors)?;

        let next_epoch_id = asset_info
            .current_epoch_id
            .checked_add(1)
            .ok_or(Error::InvalidShares)?;

        let epoch_config = EpochConfig {
            epoch_id: next_epoch_id,
            contributors,
        };

        let epoch_key = DataKey::Epoch(asset_id.clone(), next_epoch_id);

        // Store new Epoch config without mutating historical epochs
        env.storage().persistent().set(&epoch_key, &epoch_config);
        env.storage()
            .persistent()
            .extend_ttl(&epoch_key, TTL_THRESHOLD_LEDGERS, TTL_LIMIT_LEDGERS);

        // Store individual PayeeShare keys for O(1) claim-time lookups
        for contrib in epoch_config.contributors.iter() {
            let share_key = DataKey::PayeeShare(asset_id.clone(), next_epoch_id, contrib.address);
            env.storage().persistent().set(&share_key, &contrib.share);
            env.storage().persistent().extend_ttl(
                &share_key,
                TTL_THRESHOLD_LEDGERS,
                TTL_LIMIT_LEDGERS,
            );
        }

        // Update active epoch ID on Asset Header
        asset_info.current_epoch_id = next_epoch_id;
        env.storage().persistent().set(&asset_key, &asset_info);
        env.storage()
            .persistent()
            .extend_ttl(&asset_key, TTL_THRESHOLD_LEDGERS, TTL_LIMIT_LEDGERS);

        // Emit Update Event
        env.events().publish(
            (Symbol::new(&env, "EpochCreated"), asset_id.clone()),
            (asset_info.owner.clone(), next_epoch_id),
        );

        Ok(())
    }

    /// Deactivates an asset to halt new deposits. Historical claims remain accessible.
    pub fn deactivate_asset(env: Env, asset_id: Symbol) -> Result<(), Error> {
        let asset_key = DataKey::Asset(asset_id.clone());
        let mut asset_info: AssetInfo = env
            .storage()
            .persistent()
            .get(&asset_key)
            .ok_or(Error::AssetDoesNotExist)?;

        asset_info.owner.require_auth();

        if !asset_info.is_active {
            return Err(Error::AssetInactive);
        }

        asset_info.is_active = false;
        env.storage().persistent().set(&asset_key, &asset_info);
        env.storage()
            .persistent()
            .extend_ttl(&asset_key, TTL_THRESHOLD_LEDGERS, TTL_LIMIT_LEDGERS);

        // Emit Deactivation Event
        env.events().publish(
            (Symbol::new(&env, "AssetDeactivated"), asset_id.clone()),
            asset_info.owner,
        );

        Ok(())
    }

    /// Reactivates a previously deactivated asset, resuming deposit eligibility.
    pub fn reactivate_asset(env: Env, asset_id: Symbol) -> Result<(), Error> {
        let asset_key = DataKey::Asset(asset_id.clone());
        let mut asset_info: AssetInfo = env
            .storage()
            .persistent()
            .get(&asset_key)
            .ok_or(Error::AssetDoesNotExist)?;

        asset_info.owner.require_auth();

        if asset_info.is_active {
            return Err(Error::AssetAlreadyActive);
        }

        asset_info.is_active = true;
        env.storage().persistent().set(&asset_key, &asset_info);
        env.storage()
            .persistent()
            .extend_ttl(&asset_key, TTL_THRESHOLD_LEDGERS, TTL_LIMIT_LEDGERS);

        // Emit Reactivation Event
        env.events().publish(
            (Symbol::new(&env, "AssetReactivated"), asset_id.clone()),
            asset_info.owner,
        );

        Ok(())
    }

    /// Queries core asset header.
    pub fn get_asset(env: Env, asset_id: Symbol) -> Option<AssetInfo> {
        let asset_key = DataKey::Asset(asset_id);
        if let Some(asset_info) = env.storage().persistent().get::<_, AssetInfo>(&asset_key) {
            env.storage().persistent().extend_ttl(
                &asset_key,
                TTL_THRESHOLD_LEDGERS,
                TTL_LIMIT_LEDGERS,
            );
            Some(asset_info)
        } else {
            None
        }
    }

    /// Queries specific Epoch configuration.
    pub fn get_epoch(env: Env, asset_id: Symbol, epoch_id: u32) -> Option<EpochConfig> {
        let epoch_key = DataKey::Epoch(asset_id, epoch_id);
        if let Some(epoch_config) = env.storage().persistent().get::<_, EpochConfig>(&epoch_key) {
            env.storage().persistent().extend_ttl(
                &epoch_key,
                TTL_THRESHOLD_LEDGERS,
                TTL_LIMIT_LEDGERS,
            );
            Some(epoch_config)
        } else {
            None
        }
    }

    /// Queries individual payee share (in BPS) for an asset and epoch.
    pub fn get_payee_share(env: Env, asset_id: Symbol, epoch_id: u32, payee: Address) -> u32 {
        let share_key = DataKey::PayeeShare(asset_id, epoch_id, payee);
        if let Some(share) = env.storage().persistent().get::<_, u32>(&share_key) {
            env.storage().persistent().extend_ttl(
                &share_key,
                TTL_THRESHOLD_LEDGERS,
                TTL_LIMIT_LEDGERS,
            );
            share
        } else {
            0
        }
    }

    /// Queries configuration for the current active Epoch.
    pub fn get_current_epoch(env: Env, asset_id: Symbol) -> Option<EpochConfig> {
        let asset_info = Self::get_asset(env.clone(), asset_id.clone())?;
        Self::get_epoch(env, asset_id, asset_info.current_epoch_id)
    }

    /// Returns current active epoch contributors for backward compatibility.
    pub fn get_contributors(env: Env, asset_id: Symbol) -> Option<Vec<ContributorShare>> {
        let epoch_config = Self::get_current_epoch(env, asset_id)?;
        Some(epoch_config.contributors)
    }

    /// Returns smart contract semver version string.
    pub fn version(env: Env) -> Symbol {
        Symbol::new(&env, "v3_0_0")
    }

    /// Extends the persistent TTL of an existing asset registration and active epoch.
    pub fn touch_asset(env: Env, asset_id: Symbol) -> Result<(), Error> {
        let asset_key = DataKey::Asset(asset_id.clone());
        if let Some(asset_info) = env.storage().persistent().get::<_, AssetInfo>(&asset_key) {
            env.storage().persistent().extend_ttl(
                &asset_key,
                TTL_THRESHOLD_LEDGERS,
                TTL_LIMIT_LEDGERS,
            );
            let epoch_key = DataKey::Epoch(asset_id, asset_info.current_epoch_id);
            env.storage().persistent().extend_ttl(
                &epoch_key,
                TTL_THRESHOLD_LEDGERS,
                TTL_LIMIT_LEDGERS,
            );
            Ok(())
        } else {
            Err(Error::AssetDoesNotExist)
        }
    }

    /// Queries asset details for multiple asset IDs in a single call (up to 100 assets).
    pub fn batch_get_assets(env: Env, asset_ids: Vec<Symbol>) -> Vec<Option<AssetInfo>> {
        let mut results = Vec::new(&env);
        let limit = asset_ids.len().min(100);
        for i in 0..limit {
            let asset_id = asset_ids.get(i).unwrap();
            results.push_back(Self::get_asset(env.clone(), asset_id));
        }
        results
    }

    /// Upgrades the contract WASM code. Only admin can upgrade.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        env.deployer().update_current_contract_wasm(new_wasm_hash);

        // Emit Upgrade Event
        env.events()
            .publish((Symbol::new(&env, "contract_upgraded"),), admin);

        Ok(())
    }

    // Helper to validate contributor list size, duplicate addresses, and that shares sum to 10,000 BPS
    fn validate_contributors(env: &Env, contributors: &Vec<ContributorShare>) -> Result<(), Error> {
        let len = contributors.len();
        if len == 0 || len > MAX_CONTRIBUTORS {
            return Err(Error::TooManyContributors);
        }

        let mut total_share: u32 = 0;
        let mut seen = Vec::new(env);

        for item in contributors.iter() {
            if item.share == 0 {
                return Err(Error::InvalidShares);
            }
            // Duplicate address check
            if seen.contains(&item.address) {
                return Err(Error::InvalidShares);
            }
            seen.push_back(item.address.clone());

            total_share = total_share
                .checked_add(item.share)
                .ok_or(Error::InvalidShares)?;
        }

        if total_share != BASIS_POINTS_MAX {
            return Err(Error::InvalidShares);
        }

        Ok(())
    }
}

#[cfg(test)]
mod test;
