#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, IntoVal, Symbol, Vec,
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

    // Asset Errors
    AssetDoesNotExist = 401,
    AssetInactive = 403,

    // Token/Amount Errors
    InsufficientAmount = 501,

    // Accounting Errors
    CalculationError = 601,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContributorShare {
    pub address: Address,
    pub share: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ManagerAssetInfo {
    pub owner: Address,
    pub current_epoch_id: u32,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ManagerEpochConfig {
    pub epoch_id: u32,
    pub contributors: Vec<ContributorShare>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PayeeState {
    pub next_epoch_to_claim: u32,
    pub claimed_in_active_epoch: i128,
}

pub struct ManagerClient {
    pub address: Address,
}

impl ManagerClient {
    pub fn new(address: &Address) -> Self {
        Self {
            address: address.clone(),
        }
    }

    pub fn get_asset(&self, env: &Env, asset_id: &Symbol) -> Option<ManagerAssetInfo> {
        env.invoke_contract(
            &self.address,
            &Symbol::new(env, "get_asset"),
            soroban_sdk::vec![env, asset_id.clone().into_val(env)],
        )
    }

    pub fn get_epoch(
        &self,
        env: &Env,
        asset_id: &Symbol,
        epoch_id: u32,
    ) -> Option<ManagerEpochConfig> {
        env.invoke_contract(
            &self.address,
            &Symbol::new(env, "get_epoch"),
            soroban_sdk::vec![env, asset_id.clone().into_val(env), epoch_id.into_val(env)],
        )
    }
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Manager,
    Token,
    EpochDeposit(Symbol, u32), // Total deposited in asset_id during epoch_id
    PayeeState(Symbol, Address), // Payee checkpoint state
    VaultDust(Symbol),         // Total dust swept for asset_id
    PayeeMigration(Symbol, Address), // (asset_id, old_payee) -> new_payee
}

const TTL_THRESHOLD_LEDGERS: u32 = 10000;
const TTL_LIMIT_LEDGERS: u32 = 100000;

#[contract]
pub struct RoyaltyDistributor;

#[contractimpl]
impl RoyaltyDistributor {
    /// Initializes the contract with admin, manager address, and payment token address.
    pub fn initialize(
        env: Env,
        admin: Address,
        manager_address: Address,
        token_address: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::Manager, &manager_address);
        env.storage()
            .instance()
            .set(&DataKey::Token, &token_address);
        Ok(())
    }

    /// Internal deposit helper without repeating require_auth.
    /// Operates in strictly O(1) time without reading or looping over payees.
    fn deposit_internal(
        env: &Env,
        payer: &Address,
        asset_id: &Symbol,
        amount: i128,
    ) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InsufficientAmount);
        }

        let manager_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Manager)
            .ok_or(Error::NotInitialized)?;

        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;

        let manager_client = ManagerClient::new(&manager_address);
        let asset_info = manager_client
            .get_asset(env, asset_id)
            .ok_or(Error::AssetDoesNotExist)?;

        if !asset_info.is_active {
            return Err(Error::AssetInactive);
        }

        // Update current epoch deposit total in strictly O(1) time (Effects)
        let current_epoch_id = asset_info.current_epoch_id;
        let deposit_key = DataKey::EpochDeposit(asset_id.clone(), current_epoch_id);
        let current_deposit: i128 = env.storage().persistent().get(&deposit_key).unwrap_or(0);
        let new_deposit = current_deposit
            .checked_add(amount)
            .ok_or(Error::CalculationError)?;

        env.storage().persistent().set(&deposit_key, &new_deposit);
        env.storage().persistent().extend_ttl(
            &deposit_key,
            TTL_THRESHOLD_LEDGERS,
            TTL_LIMIT_LEDGERS,
        );

        // Pull payment from payer into Vault address (Interactions)
        let token_client = token::Client::new(env, &token_address);
        token_client.transfer(payer, &env.current_contract_address(), &amount);

        // Emit Deposit Event
        env.events().publish(
            (Symbol::new(env, "Deposit"), asset_id.clone(), payer.clone()),
            (amount, current_epoch_id),
        );

        Ok(())
    }

    /// Deposits revenue into an asset's current epoch.
    /// Operates in strictly O(1) time without looping over payees.
    pub fn deposit(env: Env, payer: Address, asset_id: Symbol, amount: i128) -> Result<(), Error> {
        payer.require_auth();
        Self::deposit_internal(&env, &payer, &asset_id, amount)
    }

    /// Backward-compatible alias for deposit.
    pub fn distribute_royalty(
        env: Env,
        payer: Address,
        asset_id: Symbol,
        amount: i128,
    ) -> Result<(), Error> {
        Self::deposit(env, payer, asset_id, amount)
    }

    /// Executes pull-based claim for a payee on an asset across unclaimed epochs.
    pub fn claim(env: Env, payee: Address, asset_id: Symbol) -> Result<i128, Error> {
        Self::claim_epochs(env, payee, asset_id, 100)
    }

    /// Executes pull-based claim up to max_epochs.
    pub fn claim_epochs(
        env: Env,
        payee: Address,
        asset_id: Symbol,
        max_epochs: u32,
    ) -> Result<i128, Error> {
        let manager_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Manager)
            .ok_or(Error::NotInitialized)?;

        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;

        let manager_client = ManagerClient::new(&manager_address);
        let asset_info = manager_client
            .get_asset(&env, &asset_id)
            .ok_or(Error::AssetDoesNotExist)?;

        let payee_key = DataKey::PayeeState(asset_id.clone(), payee.clone());
        let mut payee_state: PayeeState =
            env.storage()
                .persistent()
                .get(&payee_key)
                .unwrap_or(PayeeState {
                    next_epoch_to_claim: 1,
                    claimed_in_active_epoch: 0,
                });

        let start_epoch = payee_state.next_epoch_to_claim;
        let current_epoch_id = asset_info.current_epoch_id;

        let mut total_payout: i128 = 0;
        let mut last_processed_epoch = start_epoch;
        let end_epoch = if current_epoch_id > start_epoch {
            (start_epoch + max_epochs).min(current_epoch_id)
        } else {
            start_epoch
        };

        // 1. Process closed epochs (start_epoch .. end_epoch)
        for epoch_id in start_epoch..end_epoch {
            let deposit_key = DataKey::EpochDeposit(asset_id.clone(), epoch_id);
            let epoch_deposit: i128 = env.storage().persistent().get(&deposit_key).unwrap_or(0);

            if epoch_deposit > 0 {
                if let Some(epoch_config) = manager_client.get_epoch(&env, &asset_id, epoch_id) {
                    let mut payee_share_bps: u32 = 0;
                    for contrib in epoch_config.contributors.iter() {
                        if contrib.address == payee {
                            payee_share_bps = contrib.share;
                            break;
                        }
                    }

                    if payee_share_bps > 0 {
                        let full_entitlement = epoch_deposit
                            .checked_mul(payee_share_bps as i128)
                            .ok_or(Error::CalculationError)?
                            .checked_div(10000)
                            .ok_or(Error::CalculationError)?;

                        let unclaimed_portion = if epoch_id == start_epoch {
                            full_entitlement.saturating_sub(payee_state.claimed_in_active_epoch)
                        } else {
                            full_entitlement
                        };

                        total_payout = total_payout
                            .checked_add(unclaimed_portion)
                            .ok_or(Error::CalculationError)?;
                    }
                }
            }
            last_processed_epoch = epoch_id + 1;
        }

        // Reset active epoch claimed tracking when advancing to new current epoch
        if last_processed_epoch > start_epoch {
            payee_state.claimed_in_active_epoch = 0;
        }

        // 2. Process current active epoch if we reached current_epoch_id
        if last_processed_epoch == current_epoch_id {
            let active_deposit_key = DataKey::EpochDeposit(asset_id.clone(), current_epoch_id);
            let active_deposit: i128 = env
                .storage()
                .persistent()
                .get(&active_deposit_key)
                .unwrap_or(0);

            if active_deposit > 0 {
                if let Some(active_config) =
                    manager_client.get_epoch(&env, &asset_id, current_epoch_id)
                {
                    let mut payee_share_bps: u32 = 0;
                    for contrib in active_config.contributors.iter() {
                        if contrib.address == payee {
                            payee_share_bps = contrib.share;
                            break;
                        }
                    }

                    if payee_share_bps > 0 {
                        let active_full_entitlement = active_deposit
                            .checked_mul(payee_share_bps as i128)
                            .ok_or(Error::CalculationError)?
                            .checked_div(10000)
                            .ok_or(Error::CalculationError)?;

                        let additional_claimable = active_full_entitlement
                            .saturating_sub(payee_state.claimed_in_active_epoch);
                        if additional_claimable > 0 {
                            total_payout = total_payout
                                .checked_add(additional_claimable)
                                .ok_or(Error::CalculationError)?;
                            payee_state.claimed_in_active_epoch = active_full_entitlement;
                        }
                    }
                }
            }
        }

        payee_state.next_epoch_to_claim = last_processed_epoch;
        env.storage().persistent().set(&payee_key, &payee_state);
        env.storage()
            .persistent()
            .extend_ttl(&payee_key, TTL_THRESHOLD_LEDGERS, TTL_LIMIT_LEDGERS);

        let migration_key = DataKey::PayeeMigration(asset_id.clone(), payee.clone());
        let recipient = env
            .storage()
            .persistent()
            .get::<_, Address>(&migration_key)
            .unwrap_or_else(|| payee.clone());

        if total_payout > 0 {
            let token_client = token::Client::new(&env, &token_address);
            token_client.transfer(&env.current_contract_address(), &recipient, &total_payout);
        }

        // Emit Claim Event
        env.events().publish(
            (Symbol::new(&env, "Claim"), asset_id.clone(), payee.clone()),
            (total_payout, last_processed_epoch),
        );

        Ok(total_payout)
    }

    /// Queries total claimable balance for a payee on an asset without mutating state.
    pub fn get_claimable_balance(env: Env, payee: Address, asset_id: Symbol) -> i128 {
        let manager_address: Address = match env.storage().instance().get(&DataKey::Manager) {
            Some(addr) => addr,
            None => return 0,
        };

        let manager_client = ManagerClient::new(&manager_address);
        let asset_info = match manager_client.get_asset(&env, &asset_id) {
            Some(info) => info,
            None => return 0,
        };

        let payee_key = DataKey::PayeeState(asset_id.clone(), payee.clone());
        let payee_state: PayeeState =
            env.storage()
                .persistent()
                .get(&payee_key)
                .unwrap_or(PayeeState {
                    next_epoch_to_claim: 1,
                    claimed_in_active_epoch: 0,
                });

        let start_epoch = payee_state.next_epoch_to_claim;
        let current_epoch_id = asset_info.current_epoch_id;
        let mut total_claimable: i128 = 0;
        let mut claimed_in_active = payee_state.claimed_in_active_epoch;

        for epoch_id in start_epoch..current_epoch_id {
            let deposit_key = DataKey::EpochDeposit(asset_id.clone(), epoch_id);
            let epoch_deposit: i128 = env.storage().persistent().get(&deposit_key).unwrap_or(0);

            if epoch_deposit > 0 {
                if let Some(epoch_config) = manager_client.get_epoch(&env, &asset_id, epoch_id) {
                    for contrib in epoch_config.contributors.iter() {
                        if contrib.address == payee {
                            let entitlement = (epoch_deposit * contrib.share as i128) / 10000;
                            let unclaimed = if epoch_id == start_epoch {
                                entitlement.saturating_sub(claimed_in_active)
                            } else {
                                entitlement
                            };
                            total_claimable += unclaimed;
                            break;
                        }
                    }
                }
            }
            claimed_in_active = 0;
        }

        // Check active epoch
        let active_deposit_key = DataKey::EpochDeposit(asset_id.clone(), current_epoch_id);
        let active_deposit: i128 = env
            .storage()
            .persistent()
            .get(&active_deposit_key)
            .unwrap_or(0);
        if active_deposit > 0 {
            if let Some(active_config) = manager_client.get_epoch(&env, &asset_id, current_epoch_id)
            {
                for contrib in active_config.contributors.iter() {
                    if contrib.address == payee {
                        let active_entitlement = (active_deposit * contrib.share as i128) / 10000;
                        let additional = active_entitlement.saturating_sub(claimed_in_active);
                        total_claimable += additional;
                        break;
                    }
                }
            }
        }

        total_claimable
    }

    /// Queries total deposit accumulated for a specific epoch.
    pub fn get_epoch_deposit(env: Env, asset_id: Symbol, epoch_id: u32) -> i128 {
        let deposit_key = DataKey::EpochDeposit(asset_id, epoch_id);
        env.storage().persistent().get(&deposit_key).unwrap_or(0)
    }

    /// Queries payee state checkpoint.
    pub fn get_payee_state(env: Env, payee: Address, asset_id: Symbol) -> Option<PayeeState> {
        let payee_key = DataKey::PayeeState(asset_id, payee);
        env.storage().persistent().get(&payee_key)
    }

    /// Queries total accumulated dust reserve for an asset across all epochs.
    pub fn get_vault_dust(env: Env, asset_id: Symbol) -> i128 {
        let manager_address: Address = match env.storage().instance().get(&DataKey::Manager) {
            Some(addr) => addr,
            None => return 0,
        };

        let manager_client = ManagerClient::new(&manager_address);
        let asset_info = match manager_client.get_asset(&env, &asset_id) {
            Some(info) => info,
            None => return 0,
        };

        let swept_key = DataKey::VaultDust(asset_id.clone());
        let total_swept: i128 = env.storage().persistent().get(&swept_key).unwrap_or(0);

        let mut total_accumulated_dust: i128 = 0;

        for epoch_id in 1..=asset_info.current_epoch_id {
            let deposit_key = DataKey::EpochDeposit(asset_id.clone(), epoch_id);
            let epoch_deposit: i128 = env.storage().persistent().get(&deposit_key).unwrap_or(0);

            if epoch_deposit > 0 {
                if let Some(epoch_config) = manager_client.get_epoch(&env, &asset_id, epoch_id) {
                    let mut sum_entitlements: i128 = 0;
                    for contrib in epoch_config.contributors.iter() {
                        let share_amt = (epoch_deposit * contrib.share as i128) / 10000;
                        sum_entitlements += share_amt;
                    }
                    let epoch_dust = epoch_deposit.saturating_sub(sum_entitlements);
                    total_accumulated_dust += epoch_dust;
                }
            }
        }

        total_accumulated_dust.saturating_sub(total_swept)
    }

    /// Sweeps accumulated dust reserve to asset owner.
    pub fn sweep_dust(env: Env, asset_id: Symbol) -> Result<i128, Error> {
        let manager_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Manager)
            .ok_or(Error::NotInitialized)?;
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;

        let manager_client = ManagerClient::new(&manager_address);
        let asset_info = manager_client
            .get_asset(&env, &asset_id)
            .ok_or(Error::AssetDoesNotExist)?;

        asset_info.owner.require_auth();

        let claimable_dust = Self::get_vault_dust(env.clone(), asset_id.clone());

        if claimable_dust <= 0 {
            return Err(Error::InsufficientAmount);
        }

        let dust_key = DataKey::VaultDust(asset_id.clone());
        let current_swept: i128 = env.storage().persistent().get(&dust_key).unwrap_or(0);
        let new_swept = current_swept.saturating_add(claimable_dust);

        env.storage().persistent().set(&dust_key, &new_swept);
        env.storage()
            .persistent()
            .extend_ttl(&dust_key, TTL_THRESHOLD_LEDGERS, TTL_LIMIT_LEDGERS);

        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &asset_info.owner,
            &claimable_dust,
        );

        // Emit DustSwept Event
        env.events().publish(
            (
                Symbol::new(&env, "DustSwept"),
                asset_id.clone(),
                asset_info.owner.clone(),
            ),
            claimable_dust,
        );

        Ok(claimable_dust)
    }

    /// Migrates a payee's claim address for an asset from old_payee to new_payee.
    /// Requires old_payee authorization. Preserves historical claim checkpoints and immutability.
    pub fn migrate_payee_address(
        env: Env,
        asset_id: Symbol,
        old_payee: Address,
        new_payee: Address,
    ) -> Result<(), Error> {
        old_payee.require_auth();

        let manager_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Manager)
            .ok_or(Error::NotInitialized)?;

        let manager_client = ManagerClient::new(&manager_address);
        let _asset_info = manager_client
            .get_asset(&env, &asset_id)
            .ok_or(Error::AssetDoesNotExist)?;

        let migration_key = DataKey::PayeeMigration(asset_id.clone(), old_payee.clone());
        env.storage().persistent().set(&migration_key, &new_payee);
        env.storage().persistent().extend_ttl(
            &migration_key,
            TTL_THRESHOLD_LEDGERS,
            TTL_LIMIT_LEDGERS,
        );

        // Emit PayeeMigrated Event
        env.events().publish(
            (
                Symbol::new(&env, "PayeeMigrated"),
                asset_id.clone(),
                old_payee.clone(),
            ),
            new_payee.clone(),
        );

        Ok(())
    }

    /// Queries if a payee has migrated their claim address on an asset.
    pub fn get_payee_migration(env: Env, payee: Address, asset_id: Symbol) -> Option<Address> {
        let migration_key = DataKey::PayeeMigration(asset_id, payee);
        env.storage().persistent().get(&migration_key)
    }

    /// Returns smart contract semver version string.
    pub fn version(env: Env) -> Symbol {
        Symbol::new(&env, "v3_0_0")
    }

    /// Executes batch deposit for multiple assets.
    pub fn distribute_batch(
        env: Env,
        payer: Address,
        asset_ids: Vec<Symbol>,
        amounts: Vec<i128>,
    ) -> Result<(), Error> {
        payer.require_auth();

        if asset_ids.len() != amounts.len() {
            return Err(Error::CalculationError);
        }

        for i in 0..asset_ids.len() {
            let asset_id = asset_ids.get(i).unwrap();
            let amount = amounts.get(i).unwrap();
            Self::deposit_internal(&env, &payer, &asset_id, amount)?;
        }

        Ok(())
    }

    /// Updates linked manager contract address. Only admin can call.
    pub fn update_manager(env: Env, new_manager: Address) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::Manager, &new_manager);
        Ok(())
    }

    /// Updates linked token contract address. Only admin can call.
    pub fn update_token(env: Env, new_token: Address) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        env.storage().instance().set(&DataKey::Token, &new_token);
        Ok(())
    }
}

#[cfg(test)]
mod test;
