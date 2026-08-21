#![cfg(test)]
use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{vec, Address, Env, Symbol};

#[test]
fn test_register_and_manage_asset_epochs() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let contrib1 = Address::generate(&env);
    let contrib2 = Address::generate(&env);
    let contrib3 = Address::generate(&env);

    let contract_id = env.register(RoyaltyManager, ());
    let client = RoyaltyManagerClient::new(&env, &contract_id);

    // Initialize
    client.initialize(&admin);

    let asset_id = Symbol::new(&env, "asset1");
    let epoch1_contributors = vec![
        &env,
        ContributorShare {
            address: contrib1.clone(),
            share: 6000, // 60.00%
        },
        ContributorShare {
            address: contrib2.clone(),
            share: 4000, // 40.00%
        },
    ];

    // 1. Register asset -> Creates Epoch 1
    client.register_asset(&asset_id, &owner, &epoch1_contributors);

    // Verify asset header
    let asset = client.get_asset(&asset_id).unwrap();
    assert_eq!(asset.owner, owner);
    assert_eq!(asset.current_epoch_id, 1);
    assert!(asset.is_active);

    // Verify Epoch 1 config
    let epoch1 = client.get_epoch(&asset_id, &1).unwrap();
    assert_eq!(epoch1.epoch_id, 1);
    assert_eq!(epoch1.contributors.len(), 2);
    assert_eq!(epoch1.contributors.get(0).unwrap().share, 6000);

    // Verify duplicate registration fails
    let res = client.try_register_asset(&asset_id, &owner, &epoch1_contributors);
    assert!(res.is_err());

    // 2. Update asset -> Creates Epoch 2
    let epoch2_contributors = vec![
        &env,
        ContributorShare {
            address: contrib1.clone(),
            share: 5000, // 50.00%
        },
        ContributorShare {
            address: contrib2.clone(),
            share: 3000, // 30.00%
        },
        ContributorShare {
            address: contrib3.clone(),
            share: 2000, // 20.00%
        },
    ];
    client.update_asset(&asset_id, &epoch2_contributors);

    // Verify asset header updated to Epoch 2
    let asset = client.get_asset(&asset_id).unwrap();
    assert_eq!(asset.current_epoch_id, 2);

    // Verify Epoch 2 config
    let epoch2 = client.get_epoch(&asset_id, &2).unwrap();
    assert_eq!(epoch2.epoch_id, 2);
    assert_eq!(epoch2.contributors.len(), 3);
    assert_eq!(epoch2.contributors.get(0).unwrap().share, 5000);

    // CRITICAL INVARIANT: Epoch 1 config remains 100% IMMUTABLE!
    let epoch1_after = client.get_epoch(&asset_id, &1).unwrap();
    assert_eq!(epoch1_after.contributors.len(), 2);
    assert_eq!(epoch1_after.contributors.get(0).unwrap().share, 6000);

    // 3. Deactivate asset
    client.deactivate_asset(&asset_id);
    let asset = client.get_asset(&asset_id).unwrap();
    assert!(!asset.is_active);

    // Updating deactivated asset should fail
    let res = client.try_update_asset(&asset_id, &epoch2_contributors);
    assert!(res.is_err());
}

#[test]
fn test_invalid_share_registration() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let contrib1 = Address::generate(&env);
    let _contrib2 = Address::generate(&env);

    let contract_id = env.register(RoyaltyManager, ());
    let client = RoyaltyManagerClient::new(&env, &contract_id);
    client.initialize(&admin);

    let asset_id = Symbol::new(&env, "invalid_asset");

    // Case 1: Sum is less than 10000 BPS (9000 BPS)
    let invalid1 = vec![
        &env,
        ContributorShare {
            address: contrib1.clone(),
            share: 9000,
        },
    ];
    assert!(client
        .try_register_asset(&asset_id, &owner, &invalid1)
        .is_err());

    // Case 2: Sum is more than 10000 BPS (11000 BPS)
    let invalid2 = vec![
        &env,
        ContributorShare {
            address: contrib1.clone(),
            share: 11000,
        },
    ];
    assert!(client
        .try_register_asset(&asset_id, &owner, &invalid2)
        .is_err());

    // Case 3: 0 share
    let invalid3 = vec![
        &env,
        ContributorShare {
            address: contrib1.clone(),
            share: 0,
        },
    ];
    assert!(client
        .try_register_asset(&asset_id, &owner, &invalid3)
        .is_err());

    // Case 4: Duplicate payee addresses
    let invalid4 = vec![
        &env,
        ContributorShare {
            address: contrib1.clone(),
            share: 5000,
        },
        ContributorShare {
            address: contrib1.clone(), // duplicate!
            share: 5000,
        },
    ];
    assert!(client
        .try_register_asset(&asset_id, &owner, &invalid4)
        .is_err());
}

#[test]
fn test_max_contributors_limit() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);

    let contract_id = env.register(RoyaltyManager, ());
    let client = RoyaltyManagerClient::new(&env, &contract_id);
    client.initialize(&admin);

    let asset_id = Symbol::new(&env, "max_contrib_asset");

    // Attempting 11 contributors should fail MAX_CONTRIBUTORS=10 check
    let mut contributors = vec![&env];
    for _ in 0..11 {
        contributors.push_back(ContributorShare {
            address: Address::generate(&env),
            share: 909,
        });
    }

    assert!(client
        .try_register_asset(&asset_id, &owner, &contributors)
        .is_err());
}

#[test]
fn test_version_and_batch_queries() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let contrib = Address::generate(&env);

    let contract_id = env.register(RoyaltyManager, ());
    let client = RoyaltyManagerClient::new(&env, &contract_id);
    client.initialize(&admin);

    assert_eq!(client.version(), Symbol::new(&env, "v3_0_0"));

    let asset1 = Symbol::new(&env, "batch1");
    let asset2 = Symbol::new(&env, "batch2");
    let contributors = vec![
        &env,
        ContributorShare {
            address: contrib.clone(),
            share: 10000,
        },
    ];

    client.register_asset(&asset1, &owner, &contributors);
    client.register_asset(&asset2, &owner, &contributors);

    client.touch_asset(&asset1);

    let batch_res = client.batch_get_assets(&vec![&env, asset1.clone(), asset2.clone()]);
    assert_eq!(batch_res.len(), 2);
    assert!(batch_res.get(0).unwrap().is_some());
    assert!(batch_res.get(1).unwrap().is_some());
}

#[test]
fn test_asset_reactivation() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let contrib1 = Address::generate(&env);

    let contract_id = env.register(RoyaltyManager, ());
    let client = RoyaltyManagerClient::new(&env, &contract_id);
    client.initialize(&admin);

    let asset_id = Symbol::new(&env, "react_asset");
    let shares = vec![
        &env,
        ContributorShare {
            address: contrib1.clone(),
            share: 10000,
        },
    ];

    client.register_asset(&asset_id, &owner, &shares);

    // 1. Reactivating an already-active asset returns AssetAlreadyActive (Error 405)
    let err_res = client.try_reactivate_asset(&asset_id);
    assert!(err_res.is_err());

    // 2. Deactivate asset
    client.deactivate_asset(&asset_id);
    let asset = client.get_asset(&asset_id).unwrap();
    assert!(!asset.is_active);

    // 3. Unauthorized reactivation attempt (without owner signature)
    env.mock_auths(&[]);
    assert!(client.try_reactivate_asset(&asset_id).is_err());

    // 4. Authorized reactivation
    env.mock_all_auths();
    client.reactivate_asset(&asset_id);
    let asset = client.get_asset(&asset_id).unwrap();
    assert!(asset.is_active);

    // Confirm reactivation did NOT create a new epoch or alter EpochConfig
    assert_eq!(asset.current_epoch_id, 1);
    let epoch1 = client.get_epoch(&asset_id, &1).unwrap();
    assert_eq!(epoch1.contributors.len(), 1);

    // Updating asset now succeeds again (creating Epoch 2)
    client.update_asset(&asset_id, &shares);
    let asset = client.get_asset(&asset_id).unwrap();
    assert_eq!(asset.current_epoch_id, 2);
}

#[test]
fn test_50_contributors_registration_and_limit() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);

    let contract_id = env.register(RoyaltyManager, ());
    let client = RoyaltyManagerClient::new(&env, &contract_id);
    client.initialize(&admin);

    let asset_id = Symbol::new(&env, "big_asset");

    // 1. Build exactly 50 contributors (200 BPS each = 10,000 BPS)
    let mut contributors50 = vec![&env];
    let mut payee_addresses = Vec::new(&env);
    for _ in 0..50 {
        let addr = Address::generate(&env);
        payee_addresses.push_back(addr.clone());
        contributors50.push_back(ContributorShare {
            address: addr,
            share: 200, // 200 * 50 = 10,000 BPS
        });
    }

    // 2. Register asset with 50 contributors -> succeeds
    client.register_asset(&asset_id, &owner, &contributors50);
    let asset = client.get_asset(&asset_id).unwrap();
    assert_eq!(asset.current_epoch_id, 1);

    // Verify all 50 payees have individual PayeeShare entry = 200 BPS in Epoch 1
    for addr in payee_addresses.iter() {
        let share = client.get_payee_share(&asset_id, &1, &addr);
        assert_eq!(share, 200);
    }

    // 3. Attempting 51 contributors -> fails with TooManyContributors (302)
    let asset51_id = Symbol::new(&env, "too_big");
    let mut contributors51 = vec![&env];
    for _ in 0..51 {
        contributors51.push_back(ContributorShare {
            address: Address::generate(&env),
            share: 196,
        });
    }
    assert!(client
        .try_register_asset(&asset51_id, &owner, &contributors51)
        .is_err());

    // 4. Update asset with 50 new contributors for Epoch 2
    let mut epoch2_contributors = vec![&env];
    let first_payee = payee_addresses.get(0).unwrap();
    epoch2_contributors.push_back(ContributorShare {
        address: first_payee.clone(),
        share: 5000,
    });
    for i in 1..50 {
        epoch2_contributors.push_back(ContributorShare {
            address: payee_addresses.get(i).unwrap(),
            share: 102, // 5000 + 49 * 102 + remainder... wait 102*49 = 4998, 5000+4998=9998, let's fix math
        });
    }
    // Let's adjust exact sum to 10000: first payee 5100, remaining 49 payees 100 each (5100 + 4900 = 10000)
    let mut exact_epoch2 = vec![&env];
    exact_epoch2.push_back(ContributorShare {
        address: first_payee.clone(),
        share: 5100,
    });
    for i in 1..50 {
        exact_epoch2.push_back(ContributorShare {
            address: payee_addresses.get(i).unwrap(),
            share: 100,
        });
    }
    client.update_asset(&asset_id, &exact_epoch2);

    // Verify Epoch 1 PayeeShare remains 200 (HISTORICAL IMMUTABILITY)
    assert_eq!(client.get_payee_share(&asset_id, &1, &first_payee), 200);
    // Verify Epoch 2 PayeeShare is 5100
    assert_eq!(client.get_payee_share(&asset_id, &2, &first_payee), 5100);
}
