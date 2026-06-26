#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, Address, Env, Symbol, Vec, BytesN,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InvalidShares = 4,
    TooManyContributors = 5,
    AssetAlreadyExists = 6,
    AssetDoesNotExist = 7,
    AssetInactive = 8,
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
    pub contributors: Vec<ContributorShare>,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Asset(Symbol),
}

const BASIS_POINTS_MAX: u32 = 10000;
const MAX_CONTRIBUTORS: u32 = 10;
const TTL_THRESHOLD_LEDGERS: u32 = 10000; // ~14 hours at 5s/ledger
const TTL_LIMIT_LEDGERS: u32 = 100000;    // ~5.7 days

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

    /// Registers a new asset with contributor shares.
    /// The owner must authorize the registration to prevent griefing.
    pub fn register_asset(
        env: Env,
        asset_id: Symbol,
        owner: Address,
        contributors: Vec<ContributorShare>,
    ) -> Result<(), Error> {
        owner.require_auth();

        let key = DataKey::Asset(asset_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AssetAlreadyExists);
        }

        // Validate contributors and shares
        Self::validate_contributors(&env, &contributors)?;

        let asset_info = AssetInfo {
            owner: owner.clone(),
            contributors,
            is_active: true,
        };

        env.storage().persistent().set(&key, &asset_info);
        env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD_LEDGERS, TTL_LIMIT_LEDGERS);

        // Emit Registration Event
        env.events().publish(
            (Symbol::new(&env, "asset_registered"), asset_id),
            owner,
        );

        Ok(())
    }

    /// Updates contributor shares for an existing asset.
    /// Only the asset owner can update shares.
    pub fn update_asset(
        env: Env,
        asset_id: Symbol,
        contributors: Vec<ContributorShare>,
    ) -> Result<(), Error> {
        let key = DataKey::Asset(asset_id.clone());
        let mut asset_info: AssetInfo = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::AssetDoesNotExist)?;

        asset_info.owner.require_auth();

        if !asset_info.is_active {
            return Err(Error::AssetInactive);
        }

        // Validate contributors and shares
        Self::validate_contributors(&env, &contributors)?;

        asset_info.contributors = contributors;
        env.storage().persistent().set(&key, &asset_info);
        env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD_LEDGERS, TTL_LIMIT_LEDGERS);

        // Emit Update Event
        env.events().publish(
            (Symbol::new(&env, "asset_updated"), asset_id),
            asset_info.owner,
        );

        Ok(())
    }

    /// Deactivates an asset to halt royalty distribution.
    /// Only the asset owner can deactivate.
    pub fn deactivate_asset(env: Env, asset_id: Symbol) -> Result<(), Error> {
        let key = DataKey::Asset(asset_id.clone());
        let mut asset_info: AssetInfo = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::AssetDoesNotExist)?;

        asset_info.owner.require_auth();

        if !asset_info.is_active {
            return Err(Error::AssetInactive);
        }

        asset_info.is_active = false;
        env.storage().persistent().set(&key, &asset_info);
        env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD_LEDGERS, TTL_LIMIT_LEDGERS);

        // Emit Deactivation Event
        env.events().publish(
            (Symbol::new(&env, "asset_deactivated"), asset_id),
            asset_info.owner,
        );

        Ok(())
    }

    /// Queries asset details.
    pub fn get_asset(env: Env, asset_id: Symbol) -> Option<AssetInfo> {
        let key = DataKey::Asset(asset_id);
        if let Some(asset_info) = env.storage().persistent().get::<_, AssetInfo>(&key) {
            env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD_LEDGERS, TTL_LIMIT_LEDGERS);
            Some(asset_info)
        } else {
            None
        }
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
        env.events().publish(
            (Symbol::new(&env, "contract_upgraded"),),
            admin,
        );

        Ok(())
    }

    // Helper to validate contributor list size and that shares sum to 100% (10000 bps)
    fn validate_contributors(_env: &Env, contributors: &Vec<ContributorShare>) -> Result<(), Error> {
        let len = contributors.len();
        if len == 0 || len > MAX_CONTRIBUTORS {
            return Err(Error::TooManyContributors);
        }

        let mut total_share: u32 = 0;
        for item in contributors.iter() {
            if item.share == 0 {
                return Err(Error::InvalidShares);
            }
            total_share = total_share.checked_add(item.share).ok_or(Error::InvalidShares)?;
        }

        if total_share != BASIS_POINTS_MAX {
            return Err(Error::InvalidShares);
        }

        Ok(())
    }
}

#[cfg(test)]
mod test;
