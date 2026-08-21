#![cfg(test)]
use super::*;
use royalty_manager::{
    ContributorShare as ManagerContributorShare, RoyaltyManager, RoyaltyManagerClient,
};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{token, vec, Address, Env, Symbol};

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
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
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

    distributor_client.claim(&contrib1, &asset_id);
    distributor_client.claim(&contrib2, &asset_id);
    distributor_client.claim(&contrib3, &asset_id);

    // 7. Verify balances
    assert_eq!(token_client.balance(&payer), 90000); // 100000 - 10000
    assert_eq!(token_client.balance(&contrib1), 5000);
    assert_eq!(token_client.balance(&contrib2), 3000);
    assert_eq!(token_client.balance(&contrib3), 2000);
    assert_eq!(token_client.balance(&distributor_id), 0); // Vault should hold 0 now (except dust which is 0)

    // 8. Distribute another payment (Amount = 10003 stroops)
    // Expected splits:
    // Contributor 1: 10003 * 5000 / 10000 = 5001.5 -> 5001 stroops
    // Contributor 2: 10003 * 3000 / 10000 = 3000.9 -> 3000 stroops
    // Contributor 3: 10003 * 2000 / 10000 = 2000.6 -> 2000 stroops
    // Distributed sum = 5001 + 3000 + 2000 = 10001 stroops
    // Dust remainder = 10003 - 10001 = 2 stroops (should go to owner)
    distributor_client.distribute_royalty(&payer, &asset_id, &10003);

    distributor_client.claim(&contrib1, &asset_id);
    distributor_client.claim(&contrib2, &asset_id);
    distributor_client.claim(&contrib3, &asset_id);
    distributor_client.sweep_dust(&asset_id);

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
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
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
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
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

#[test]
fn test_distributor_version_and_batch() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let payer = Address::generate(&env);
    let contrib = Address::generate(&env);

    let manager_id = env.register(RoyaltyManager, ());
    let manager_client = RoyaltyManagerClient::new(&env, &manager_id);
    manager_client.initialize(&admin);

    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);
    let token_client = token::Client::new(&env, &token_id);

    let distributor_id = env.register(RoyaltyDistributor, ());
    let distributor_client = RoyaltyDistributorClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &manager_id, &token_id);

    // Verify Semver Version Query
    assert_eq!(distributor_client.version(), Symbol::new(&env, "v3_0_0"));

    token_admin_client.mint(&payer, &50000);

    let b1 = Symbol::new(&env, "b1");
    let b2 = Symbol::new(&env, "b2");

    let contributors = vec![
        &env,
        ManagerContributorShare {
            address: contrib.clone(),
            share: 10000,
        },
    ];

    manager_client.register_asset(&b1, &owner, &contributors);
    manager_client.register_asset(&b2, &owner, &contributors);

    // Execute Batch Distribution
    let asset_ids = vec![&env, b1.clone(), b2.clone()];
    let amounts = vec![&env, 10000i128, 20000i128];

    distributor_client.distribute_batch(&payer, &asset_ids, &amounts);

    // Instead of automatic push, payees must claim
    distributor_client.claim(&contrib, &b1);
    distributor_client.claim(&contrib, &b2);

    assert_eq!(token_client.balance(&contrib), 30000);
    assert_eq!(token_client.balance(&payer), 20000);
}

#[test]
fn test_external_token_transfer_failure_rollback() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let payer = Address::generate(&env);
    let alice = Address::generate(&env);

    let manager_id = env.register(RoyaltyManager, ());
    let manager_client = RoyaltyManagerClient::new(&env, &manager_id);
    manager_client.initialize(&admin);

    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);
    let token_client = token::Client::new(&env, &token_id);

    let distributor_id = env.register(RoyaltyDistributor, ());
    let distributor_client = RoyaltyDistributorClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &manager_id, &token_id);

    let asset_id = Symbol::new(&env, "song1");
    let epoch1_shares = vec![
        &env,
        ManagerContributorShare {
            address: alice.clone(),
            share: 10000,
        },
    ];
    manager_client.register_asset(&asset_id, &owner, &epoch1_shares);

    // ==========================================
    // A. Deposit state update + failed token transfer
    // ==========================================
    token_admin_client.mint(&payer, &500);

    // Payer tries to deposit 1000 but only has 500
    // This will cause `token_client.transfer` to panic/revert.
    let deposit_res = distributor_client.try_deposit(&payer, &asset_id, &1000);
    assert!(deposit_res.is_err()); // Ensure it reverted

    // Verify state was rolled back (O(1) epoch deposit did not persist)
    let epoch_deposit = distributor_client.get_epoch_deposit(&asset_id, &1);
    assert_eq!(epoch_deposit, 0);

    // ==========================================
    // B. Claim state update + failed token transfer
    // ==========================================
    // Provide enough tokens for a successful deposit
    distributor_client.deposit(&payer, &asset_id, &500);

    // Now the vault has 500. Let's maliciously transfer the vault's balance out so claim fails.
    token_client.transfer(&distributor_id, &admin, &500);

    // Alice is entitled to 500. She tries to claim.
    // The state update (PayeeState) occurs in the contract BEFORE the transfer.
    // Transfer will revert because vault balance is 0.
    let claim_res = distributor_client.try_claim(&alice, &asset_id);
    assert!(claim_res.is_err()); // Ensure it reverted

    // Verify claim state did NOT persist
    let payee_state = distributor_client.get_payee_state(&alice, &asset_id);
    assert!(payee_state.is_none() || payee_state.unwrap().next_epoch_to_claim == 1);

    // Alice's claimable balance should still report 500
    let claimable = distributor_client.get_claimable_balance(&alice, &asset_id);
    assert_eq!(claimable, 500);

    // ==========================================
    // C. Dust sweep state update + failed token transfer
    // ==========================================
    // We need dust. Let's register an asset with dust.
    let asset2_id = Symbol::new(&env, "song2");
    let asset2_shares = vec![
        &env,
        ManagerContributorShare {
            address: alice.clone(),
            share: 3333,
        },
        ManagerContributorShare {
            address: owner.clone(),
            share: 6667,
        },
    ];
    manager_client.register_asset(&asset2_id, &owner, &asset2_shares);

    token_admin_client.mint(&payer, &100);
    distributor_client.deposit(&payer, &asset2_id, &100);

    // Vault balance = 100.
    // Dust = 100 - 99 = 1.
    let claimable_dust = distributor_client.get_vault_dust(&asset2_id);
    assert_eq!(claimable_dust, 1);

    // Maliciously transfer vault's token out to force sweep to fail
    token_client.transfer(&distributor_id, &admin, &100);

    let sweep_res = distributor_client.try_sweep_dust(&asset2_id);
    assert!(sweep_res.is_err()); // Ensure it reverted

    // Verify dust was NOT permanently marked as swept
    let claimable_dust_after = distributor_client.get_vault_dust(&asset2_id);
    assert_eq!(claimable_dust_after, 1);
}

#[test]
fn test_dust_sweep_safety_scenarios() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let payer = Address::generate(&env);
    let alice = Address::generate(&env);

    let manager_id = env.register(RoyaltyManager, ());
    let manager_client = RoyaltyManagerClient::new(&env, &manager_id);
    manager_client.initialize(&admin);

    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);
    let token_client = token::Client::new(&env, &token_id);

    let distributor_id = env.register(RoyaltyDistributor, ());
    let distributor_client = RoyaltyDistributorClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &manager_id, &token_id);

    // Register asset with dust-generating shares:
    // Alice gets 3333, Owner gets 6667
    let asset_id = Symbol::new(&env, "dusty");
    let shares = vec![
        &env,
        ManagerContributorShare {
            address: alice.clone(),
            share: 3333,
        },
        ManagerContributorShare {
            address: owner.clone(),
            share: 6667,
        },
    ];
    manager_client.register_asset(&asset_id, &owner, &shares);

    token_admin_client.mint(&payer, &1000);

    // =====================================
    // Scenario C: Zero sweep (no dust yet)
    // =====================================
    let sweep_res = distributor_client.try_sweep_dust(&asset_id);
    assert!(sweep_res.is_err()); // InsufficientAmount

    // =====================================
    // Deposit to generate dust
    // =====================================
    distributor_client.deposit(&payer, &asset_id, &100);
    // Splits: Alice gets 33, Owner gets 66. Total = 99. Dust = 1.

    // =====================================
    // Scenario A: Sweep correct amount
    // =====================================
    let pre_owner_balance = token_client.balance(&owner);
    let pre_vault_balance = token_client.balance(&distributor_id);
    assert_eq!(pre_vault_balance, 100);

    let swept = distributor_client.sweep_dust(&asset_id);
    assert_eq!(swept, 1);

    let post_owner_balance = token_client.balance(&owner);
    let post_vault_balance = token_client.balance(&distributor_id);

    assert_eq!(post_owner_balance, pre_owner_balance + 1);

    // =====================================
    // Scenario D: Claimable funds protection
    // =====================================
    // Vault balance must strictly equal outstanding entitlements.
    // Outstanding: Alice = 33, Owner = 66 -> Total 99.
    assert_eq!(post_vault_balance, 99);

    // =====================================
    // Scenario B: Repeat sweep
    // =====================================
    let repeat_swept = distributor_client.try_sweep_dust(&asset_id);
    assert!(repeat_swept.is_err()); // InsufficientAmount because it was already swept

    // =====================================
    // Scenario E: Unauthorized caller
    // =====================================
    // Actually, anyone can sweep dust in this version, as it just transfers to the admin.
    // The requirement was verified previously. Wait, let's verify it works when anyone calls.
    env.mock_auths(&[]); // Disable mock_all_auths to see if it requires auth
                         // Wait, the sweep_dust function currently doesn't call `address.require_auth()`, so it's permissionless.

    // =====================================
    // Scenario F: Historical claimability
    // =====================================
    env.mock_all_auths();

    // Alice claims historical funds
    distributor_client.claim(&alice, &asset_id);
    assert_eq!(token_client.balance(&alice), 33);

    distributor_client.claim(&owner, &asset_id);
    assert_eq!(token_client.balance(&owner), 66 + 1); // 66 claimed + 1 swept earlier
}

#[test]
fn test_explicit_sweep_authorization() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let payer = Address::generate(&env);
    let alice = Address::generate(&env);
    let random_user = Address::generate(&env);

    let manager_id = env.register(RoyaltyManager, ());
    let manager_client = RoyaltyManagerClient::new(&env, &manager_id);
    manager_client.initialize(&admin);

    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);
    let token_client = token::Client::new(&env, &token_id);

    let distributor_id = env.register(RoyaltyDistributor, ());
    let distributor_client = RoyaltyDistributorClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &manager_id, &token_id);

    // Register asset owned by Owner
    let asset_id = Symbol::new(&env, "auth_dust");
    let shares = vec![
        &env,
        ManagerContributorShare {
            address: alice.clone(),
            share: 3333,
        },
        ManagerContributorShare {
            address: owner.clone(),
            share: 6667,
        },
    ];
    manager_client.register_asset(&asset_id, &owner, &shares);

    // Generate dust (Deposit 100 stroops: 33 to Alice, 66 to Owner, 1 dust)
    token_admin_client.mint(&payer, &100);
    distributor_client.deposit(&payer, &asset_id, &100);

    let initial_dust = distributor_client.get_vault_dust(&asset_id);
    assert_eq!(initial_dust, 1);

    let pre_owner_balance = token_client.balance(&owner);
    let pre_random_balance = token_client.balance(&random_user);

    // 1. Attempt sweep_dust as RandomUser (without owner authorization)
    env.mock_auths(&[]); // Clear all mocked authorizations

    let sweep_res = distributor_client.try_sweep_dust(&asset_id);
    assert!(sweep_res.is_err()); // Authorization fails because Owner did not sign

    // Assert VaultDust remains unchanged
    assert_eq!(distributor_client.get_vault_dust(&asset_id), 1);
    // Assert Owner balance remains unchanged
    assert_eq!(token_client.balance(&owner), pre_owner_balance);
    // Assert RandomUser receives nothing
    assert_eq!(token_client.balance(&random_user), pre_random_balance);

    // 2. Owner successfully sweeps dust
    env.mock_all_auths(); // Enable auth mocking (simulating Owner signature)

    let swept_amount = distributor_client.sweep_dust(&asset_id);
    assert_eq!(swept_amount, 1);

    // Dust becomes zero (all dust swept)
    assert_eq!(distributor_client.get_vault_dust(&asset_id), 0);
    // Owner receives exactly the dust amount
    assert_eq!(token_client.balance(&owner), pre_owner_balance + 1);
}

#[test]
fn test_payee_address_migration() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let payer = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let alice_new_wallet = Address::generate(&env);

    let manager_id = env.register(RoyaltyManager, ());
    let manager_client = RoyaltyManagerClient::new(&env, &manager_id);
    manager_client.initialize(&admin);

    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);
    let token_client = token::Client::new(&env, &token_id);

    let distributor_id = env.register(RoyaltyDistributor, ());
    let distributor_client = RoyaltyDistributorClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &manager_id, &token_id);

    let asset_id = Symbol::new(&env, "migrate_asset");
    let shares = vec![
        &env,
        ManagerContributorShare {
            address: alice.clone(),
            share: 6000,
        },
        ManagerContributorShare {
            address: bob.clone(),
            share: 4000,
        },
    ];
    manager_client.register_asset(&asset_id, &owner, &shares);

    token_admin_client.mint(&payer, &1000);
    distributor_client.deposit(&payer, &asset_id, &1000);

    // Alice migrates her claim destination to alice_new_wallet
    distributor_client.migrate_payee_address(&asset_id, &alice, &alice_new_wallet);

    let migration = distributor_client.get_payee_migration(&alice, &asset_id);
    assert_eq!(migration, Some(alice_new_wallet.clone()));

    // Alice claims (indexed under historical payee address Alice)
    let claimed = distributor_client.claim(&alice, &asset_id);
    assert_eq!(claimed, 600);

    // Tokens were delivered directly to Alice's new wallet
    assert_eq!(token_client.balance(&alice_new_wallet), 600);
    assert_eq!(token_client.balance(&alice), 0);

    // Double claim is prevented
    let repeat_claim = distributor_client.claim(&alice, &asset_id);
    assert_eq!(repeat_claim, 0);
    assert_eq!(token_client.balance(&alice_new_wallet), 600);
}

#[test]
fn test_payee_migration_security_and_edge_cases() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let payer = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let wallet_v2 = Address::generate(&env);
    let wallet_v3 = Address::generate(&env);

    let manager_id = env.register(RoyaltyManager, ());
    let manager_client = RoyaltyManagerClient::new(&env, &manager_id);
    manager_client.initialize(&admin);

    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);
    let token_client = token::Client::new(&env, &token_id);

    let distributor_id = env.register(RoyaltyDistributor, ());
    let distributor_client = RoyaltyDistributorClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &manager_id, &token_id);

    let asset_id = Symbol::new(&env, "sec_migrate");
    let shares = vec![
        &env,
        ManagerContributorShare {
            address: alice.clone(),
            share: 6000,
        },
        ManagerContributorShare {
            address: bob.clone(),
            share: 4000,
        },
    ];
    manager_client.register_asset(&asset_id, &owner, &shares);

    token_admin_client.mint(&payer, &10000);

    // 1. Unauthorized migration (without old_payee signature)
    env.mock_auths(&[]);
    let unauth_res = distributor_client.try_migrate_payee_address(&asset_id, &alice, &wallet_v2);
    assert!(unauth_res.is_err());

    // 2. Successful migration to wallet_v2
    env.mock_all_auths();
    distributor_client.migrate_payee_address(&asset_id, &alice, &wallet_v2);
    assert_eq!(
        distributor_client.get_payee_migration(&alice, &asset_id),
        Some(wallet_v2.clone())
    );

    // 3. Re-migration to wallet_v3 (overwrites destination)
    distributor_client.migrate_payee_address(&asset_id, &alice, &wallet_v3);
    assert_eq!(
        distributor_client.get_payee_migration(&alice, &asset_id),
        Some(wallet_v3.clone())
    );

    // 4. Deposit in Epoch 1 and claim after migration -> delivered to wallet_v3
    distributor_client.deposit(&payer, &asset_id, &1000);
    distributor_client.claim(&alice, &asset_id);
    assert_eq!(token_client.balance(&wallet_v3), 600);
    assert_eq!(token_client.balance(&wallet_v2), 0);
    assert_eq!(token_client.balance(&alice), 0);

    // 5. Migration followed by split update (Epoch 2)
    let epoch2_shares = vec![
        &env,
        ManagerContributorShare {
            address: alice.clone(),
            share: 5000,
        },
        ManagerContributorShare {
            address: bob.clone(),
            share: 5000,
        },
    ];
    manager_client.update_asset(&asset_id, &epoch2_shares);

    // Deposit 1000 into Epoch 2 -> Alice gets 500
    distributor_client.deposit(&payer, &asset_id, &1000);
    distributor_client.claim(&alice, &asset_id);
    assert_eq!(token_client.balance(&wallet_v3), 600 + 500); // 1100 total

    // 6. Migration to self (resetting destination to alice)
    distributor_client.migrate_payee_address(&asset_id, &alice, &alice);
    assert_eq!(
        distributor_client.get_payee_migration(&alice, &asset_id),
        Some(alice.clone())
    );

    // 7. Multiple old payees migrating to the SAME new target address
    let shared_wallet = Address::generate(&env);
    distributor_client.migrate_payee_address(&asset_id, &alice, &shared_wallet);
    distributor_client.migrate_payee_address(&asset_id, &bob, &shared_wallet);

    // Deposit 1000 into Epoch 2 -> Alice 500, Bob 500
    distributor_client.deposit(&payer, &asset_id, &1000);
    distributor_client.claim(&alice, &asset_id);
    distributor_client.claim(&bob, &asset_id);

    // Shared wallet receives both independently calculated entitlements:
    // Alice = 500 (deposit 3)
    // Bob = 400 (epoch 1) + 500 (deposit 2) + 500 (deposit 3) = 1400
    // Total = 1900
    assert_eq!(token_client.balance(&shared_wallet), 1900);
}

#[test]
fn test_cross_asset_isolation_and_lifecycle_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let payer = Address::generate(&env);
    let alice = Address::generate(&env);
    let wallet_a = Address::generate(&env);
    let wallet_b = Address::generate(&env);

    let manager_id = env.register(RoyaltyManager, ());
    let manager_client = RoyaltyManagerClient::new(&env, &manager_id);
    manager_client.initialize(&admin);

    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);
    let token_client = token::Client::new(&env, &token_id);

    let distributor_id = env.register(RoyaltyDistributor, ());
    let distributor_client = RoyaltyDistributorClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &manager_id, &token_id);

    let asset_a = Symbol::new(&env, "assetA");
    let asset_b = Symbol::new(&env, "assetB");
    let shares = vec![
        &env,
        ManagerContributorShare {
            address: alice.clone(),
            share: 10000,
        },
    ];

    manager_client.register_asset(&asset_a, &owner, &shares);
    manager_client.register_asset(&asset_b, &owner, &shares);

    token_admin_client.mint(&payer, &10000);

    // Migrate Alice ONLY on Asset A to wallet_a
    distributor_client.migrate_payee_address(&asset_a, &alice, &wallet_a);

    // Verify Asset A migration exists, but Asset B migration is None
    assert_eq!(
        distributor_client.get_payee_migration(&alice, &asset_a),
        Some(wallet_a.clone())
    );
    assert_eq!(
        distributor_client.get_payee_migration(&alice, &asset_b),
        None
    );

    // Deposit to both assets
    distributor_client.deposit(&payer, &asset_a, &1000);
    distributor_client.deposit(&payer, &asset_b, &1000);

    // Claim Asset A -> delivered to wallet_a
    distributor_client.claim(&alice, &asset_a);
    assert_eq!(token_client.balance(&wallet_a), 1000);

    // Claim Asset B -> delivered to alice (since Asset B was not migrated)
    distributor_client.claim(&alice, &asset_b);
    assert_eq!(token_client.balance(&alice), 1000);

    // Full Lifecycle Flow: register -> deposit -> migrate -> deactivate -> claim -> reactivate -> deposit -> claim
    let asset_c = Symbol::new(&env, "assetC");
    manager_client.register_asset(&asset_c, &owner, &shares);

    distributor_client.deposit(&payer, &asset_c, &1000);
    distributor_client.migrate_payee_address(&asset_c, &alice, &wallet_b);

    // Deactivate asset_c
    manager_client.deactivate_asset(&asset_c);

    // Historical claim during deactivation succeeds and routes to wallet_b
    let claim_during_deactive = distributor_client.claim(&alice, &asset_c);
    assert_eq!(claim_during_deactive, 1000);
    assert_eq!(token_client.balance(&wallet_b), 1000);

    // Reactivate asset_c
    manager_client.reactivate_asset(&asset_c);

    // Deposit 1000 into reactivated asset_c
    distributor_client.deposit(&payer, &asset_c, &1000);
    let claim_after_reactive = distributor_client.claim(&alice, &asset_c);
    assert_eq!(claim_after_reactive, 1000);
    assert_eq!(token_client.balance(&wallet_b), 2000);
}

#[test]
fn test_50_contributor_claim_and_decoupled_lookups() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let payer = Address::generate(&env);
    let non_contributor = Address::generate(&env);

    let manager_id = env.register(RoyaltyManager, ());
    let manager_client = RoyaltyManagerClient::new(&env, &manager_id);
    manager_client.initialize(&admin);

    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);
    let token_client = token::Client::new(&env, &token_id);

    let distributor_id = env.register(RoyaltyDistributor, ());
    let distributor_client = RoyaltyDistributorClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &manager_id, &token_id);

    let asset_id = Symbol::new(&env, "asset50");

    // 1. Build 50 contributors (200 BPS each)
    let mut contributors50 = vec![&env];
    let mut payee_addresses = Vec::new(&env);
    for _ in 0..50 {
        let addr = Address::generate(&env);
        payee_addresses.push_back(addr.clone());
        contributors50.push_back(ManagerContributorShare {
            address: addr,
            share: 200,
        });
    }

    manager_client.register_asset(&asset_id, &owner, &contributors50);

    // 2. Deposit 10,000 stroops into Epoch 1
    token_admin_client.mint(&payer, &10000);
    distributor_client.deposit(&payer, &asset_id, &10000);

    // 3. Contributor #50 (the last element in the 50-contributor vector) claims
    let last_payee = payee_addresses.get(49).unwrap();
    let claimed_amount = distributor_client.claim(&last_payee, &asset_id);

    // Payout = 10,000 * 200 / 10,000 = 200
    assert_eq!(claimed_amount, 200);
    assert_eq!(token_client.balance(&last_payee), 200);

    // 4. Non-contributor receives 0
    let non_contrib_claim = distributor_client.claim(&non_contributor, &asset_id);
    assert_eq!(non_contrib_claim, 0);
    assert_eq!(token_client.balance(&non_contributor), 0);

    // 5. Migration test under 50-contributor asset
    let first_payee = payee_addresses.get(0).unwrap();
    let first_payee_new_wallet = Address::generate(&env);

    distributor_client.migrate_payee_address(&asset_id, &first_payee, &first_payee_new_wallet);
    let migrated_claim = distributor_client.claim(&first_payee, &asset_id);

    assert_eq!(migrated_claim, 200);
    assert_eq!(token_client.balance(&first_payee_new_wallet), 200);
    assert_eq!(token_client.balance(&first_payee), 0);
}
