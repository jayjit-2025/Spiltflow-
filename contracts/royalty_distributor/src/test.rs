#![cfg(test)]
use super::*;
use soroban_sdk::{Env, Address, vec, Symbol, token};
use soroban_sdk::testutils::Address as _;
use royalty_manager::{RoyaltyManager, RoyaltyManagerClient, ContributorShare as ManagerContributorShare};

#[test]
fn test_royalty_distribution() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let payer = Address::generate(&env);
    
    let contrib1 = Address::generate(&env);
    let contrib2 = Address::generate(&env);
    let contrib3 = Address::generate(&env);

    // 1. Deploy & Initialize Royalty Manager
    let manager_id = env.register(RoyaltyManager, ());
    let manager_client = RoyaltyManagerClient::new(&env, &manager_id);
    manager_client.initialize(&admin);

    // 2. Deploy a mock Stellar Asset Contract (Token)
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);
    let token_client = token::Client::new(&env, &token_id);

    // 3. Deploy & Initialize Royalty Distributor
    let distributor_id = env.register(RoyaltyDistributor, ());
    let distributor_client = RoyaltyDistributorClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &manager_id, &token_id);

    // 4. Mint tokens to the payer
    token_admin_client.mint(&payer, &100000);
    assert_eq!(token_client.balance(&payer), 100000);

    // 5. Register an asset in the Royalty Manager
    let asset_id = Symbol::new(&env, "album1");
    // Share breakdown:
    // Contributor 1: 50.00% (5000 bps)
    // Contributor 2: 30.00% (3000 bps)
    // Contributor 3: 20.00% (2000 bps)
    // Total = 100.00% (10000 bps)
    let contributors = vec![
        &env,
        ManagerContributorShare {
            address: contrib1.clone(),
            share: 5000,
        },
        ManagerContributorShare {
            address: contrib2.clone(),
            share: 3000,
        },
        ManagerContributorShare {
            address: contrib3.clone(),
            share: 2000,
        },
    ];
    manager_client.register_asset(&asset_id, &owner, &contributors);

    // 6. Distribute royalties (Amount = 10000 stroops)
    // Expected splits:
    // Contributor 1: 10000 * 5000 / 10000 = 5000 stroops
    // Contributor 2: 10000 * 3000 / 10000 = 3000 stroops
    // Contributor 3: 10000 * 2000 / 10000 = 2000 stroops
    // Distributed sum = 10000 stroops
    // Dust remainder = 0 stroops
    distributor_client.distribute_royalty(&payer, &asset_id, &10000);

    // 7. Verify balances
    assert_eq!(token_client.balance(&payer), 90000); // 100000 - 10000
    assert_eq!(token_client.balance(&contrib1), 5000);
    assert_eq!(token_client.balance(&contrib2), 3000);
    assert_eq!(token_client.balance(&contrib3), 2000);
    assert_eq!(token_client.balance(&owner), 0); // Dust remainder is 0
    assert_eq!(token_client.balance(&distributor_id), 0); // Contract should hold no funds

    // 8. Distribute another payment (Amount = 10003 stroops)
    // Expected splits:
    // Contributor 1: 10003 * 5000 / 10000 = 5001.5 -> 5001 stroops
    // Contributor 2: 10003 * 3000 / 10000 = 3000.9 -> 3000 stroops
    // Contributor 3: 10003 * 2000 / 10000 = 2000.6 -> 2000 stroops
    // Distributed sum = 5001 + 3000 + 2000 = 10001 stroops
    // Dust remainder = 10003 - 10001 = 2 stroops (should go to owner)
    distributor_client.distribute_royalty(&payer, &asset_id, &10003);

    assert_eq!(token_client.balance(&payer), 79997); // 90000 - 10003
    assert_eq!(token_client.balance(&contrib1), 5000 + 5001); // 10001
    assert_eq!(token_client.balance(&contrib2), 3000 + 3000); // 6000
    assert_eq!(token_client.balance(&contrib3), 2000 + 2000); // 4000
    assert_eq!(token_client.balance(&owner), 0 + 2); // 2 (previous dust + new dust)
}

#[test]
fn test_distribute_non_existent_asset() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let payer = Address::generate(&env);
    let manager_id = env.register(RoyaltyManager, ());
    let manager_client = RoyaltyManagerClient::new(&env, &manager_id);
    manager_client.initialize(&admin);

    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

    let distributor_id = env.register(RoyaltyDistributor, ());
    let distributor_client = RoyaltyDistributorClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &manager_id, &token_id);

    token_admin_client.mint(&payer, &10000);

    let non_existent_asset = Symbol::new(&env, "unknown");
    let res = distributor_client.try_distribute_royalty(&payer, &non_existent_asset, &5000);
    assert!(res.is_err());
}

#[test]
fn test_distribute_inactive_asset() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let payer = Address::generate(&env);
    let contrib1 = Address::generate(&env);

    let manager_id = env.register(RoyaltyManager, ());
    let manager_client = RoyaltyManagerClient::new(&env, &manager_id);
    manager_client.initialize(&admin);

    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

    let distributor_id = env.register(RoyaltyDistributor, ());
    let distributor_client = RoyaltyDistributorClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &manager_id, &token_id);

    token_admin_client.mint(&payer, &10000);

    let asset_id = Symbol::new(&env, "deactivated_asset");
    let contributors = vec![
        &env,
        ManagerContributorShare {
            address: contrib1.clone(),
            share: 10000,
        },
    ];
    manager_client.register_asset(&asset_id, &owner, &contributors);
    
    // Deactivate
    manager_client.deactivate_asset(&asset_id);

    // Try distributing
    let res = distributor_client.try_distribute_royalty(&payer, &asset_id, &5000);
    assert!(res.is_err());
}
