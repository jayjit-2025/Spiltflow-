#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, Address, Env, Symbol, Vec, token, IntoVal,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    AssetDoesNotExist = 4,
    AssetInactive = 5,
    InsufficientAmount = 6,
    CalculationError = 7,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContributorShare {
    pub address: Address,
    pub share: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AssetInfo {
    pub owner: Address,
    pub contributors: Vec<ContributorShare>,
    pub is_active: bool,
}

// Client interface for Royalty Manager via raw contract invocations
pub struct ManagerClient {
    pub address: Address,
}

impl ManagerClient {
    pub fn new(address: &Address) -> Self {
        Self {
            address: address.clone(),
        }
    }

    pub fn get_asset(&self, env: &Env, asset_id: &Symbol) -> Option<AssetInfo> {
        env.invoke_contract(
            &self.address,
            &Symbol::new(env, "get_asset"),
            soroban_sdk::vec![env, asset_id.clone().into_val(env)],
        )
    }
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Manager,
    Token,
}

#[contract]
pub struct RoyaltyDistributor;

#[contractimpl]
impl RoyaltyDistributor {
    /// Initializes the contract with the administrator, the linked manager contract, and payment token contract.
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
        env.storage().instance().set(&DataKey::Manager, &manager_address);
        env.storage().instance().set(&DataKey::Token, &token_address);
        Ok(())
    }

    /// Distributes royalty payments for a registered asset.
    /// The payer must authorize this call.
    pub fn distribute_royalty(
        env: Env,
        payer: Address,
        asset_id: Symbol,
        amount: i128,
    ) -> Result<(), Error> {
        payer.require_auth();

        if amount <= 0 {
            return Err(Error::InsufficientAmount);
        }

        // Retrieve manager address
        let manager_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Manager)
            .ok_or(Error::NotInitialized)?;

        // Fetch asset metadata from the manager contract
        let manager = ManagerClient::new(&manager_address);
        let asset_info: AssetInfo = manager
            .get_asset(&env, &asset_id)
            .ok_or(Error::AssetDoesNotExist)?;

        if !asset_info.is_active {
            return Err(Error::AssetInactive);
        }

        // Retrieve token address
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;

        let token_client = token::Client::new(&env, &token_address);

        // Pull payment amount from payer to the distributor contract
        token_client.transfer(&payer, &env.current_contract_address(), &amount);

        // Split amount and transfer to contributors
        let mut distributed_sum: i128 = 0;

        for contributor in asset_info.contributors.iter() {
            // basis points: share / 10000
            let share_amount = amount
                .checked_mul(contributor.share as i128)
                .ok_or(Error::CalculationError)?
                .checked_div(10000)
                .ok_or(Error::CalculationError)?;

            if share_amount > 0 {
                token_client.transfer(
                    &env.current_contract_address(),
                    &contributor.address,
                    &share_amount,
                );
                distributed_sum = distributed_sum
                    .checked_add(share_amount)
                    .ok_or(Error::CalculationError)?;
            }
        }

        // Distribute remaining dust/remainder to asset owner (creator)
        let remainder = amount
            .checked_sub(distributed_sum)
            .ok_or(Error::CalculationError)?;

        if remainder > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &asset_info.owner,
                &remainder,
            );
        }

        // Emit RoyaltyDistributed Event
        env.events().publish(
            (
                Symbol::new(&env, "royalty_distributed"),
                asset_id,
                payer.clone(),
            ),
            (amount, remainder),
        );

        Ok(())
    }

    /// Updates the linked manager contract address. Only admin can call.
    pub fn update_manager(env: Env, new_manager: Address) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        env.storage().instance().set(&DataKey::Manager, &new_manager);
        Ok(())
    }

    /// Updates the linked token contract address. Only admin can call.
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
