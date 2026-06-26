#![cfg(test)]
use super::*;
use soroban_sdk::{Env, Address, vec, Symbol};
use soroban_sdk::testutils::Address as _;

#[test]
fn test_register_and_manage_asset() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let contrib1 = Address::generate(&env);
    let contrib2 = Address::generate(&env);

    let contract_id = env.register(RoyaltyManager, ());
    let client = RoyaltyManagerClient::new(&env, &contract_id);

    // Initialize
    client.initialize(&admin);

    let asset_id = Symbol::new(&env, "song1");
    let contributors = vec![
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

    // Register asset
    client.register_asset(&asset_id, &owner, &contributors);

    // Verify asset info
    let asset = client.get_asset(&asset_id).unwrap();
    assert_eq!(asset.owner, owner);
    assert_eq!(asset.contributors.len(), 2);
    assert_eq!(asset.is_active, true);
    assert_eq!(asset.contributors.get(0).unwrap().share, 6000);

    // Verify duplicate registration fails
    let res = client.try_register_asset(&asset_id, &owner, &contributors);
    assert!(res.is_err());

    // Update asset contributors
    let new_contributors = vec![
        &env,
        ContributorShare {
            address: contrib1.clone(),
            share: 5000, // 50.00%
        },
        ContributorShare {
            address: contrib2.clone(),
            share: 5000, // 50.00%
        },
    ];
    client.update_asset(&asset_id, &new_contributors);

    let asset = client.get_asset(&asset_id).unwrap();
    assert_eq!(asset.contributors.get(0).unwrap().share, 5000);
    assert_eq!(asset.contributors.get(1).unwrap().share, 5000);

    // Deactivate asset
    client.deactivate_asset(&asset_id);
    let asset = client.get_asset(&asset_id).unwrap();
    assert_eq!(asset.is_active, false);

    // Updating deactivated asset should fail
    let res = client.try_update_asset(&asset_id, &new_contributors);
    assert!(res.is_err());
}

#[test]
fn test_invalid_share_registration() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let contrib1 = Address::generate(&env);

    let contract_id = env.register(RoyaltyManager, ());
    let client = RoyaltyManagerClient::new(&env, &contract_id);
    client.initialize(&admin);

    let asset_id = Symbol::new(&env, "song2");

    // Case 1: Sum is less than 10000 bps (9000 bps)
    let invalid_shares_1 = vec![
        &env,
        ContributorShare {
            address: contrib1.clone(),
            share: 9000,
        },
    ];
    let res1 = client.try_register_asset(&asset_id, &owner, &invalid_shares_1);
    assert!(res1.is_err());

    // Case 2: Sum is more than 10000 bps (11000 bps)
    let invalid_shares_2 = vec![
        &env,
        ContributorShare {
            address: contrib1.clone(),
            share: 11000,
        },
    ];
    let res2 = client.try_register_asset(&asset_id, &owner, &invalid_shares_2);
    assert!(res2.is_err());

    // Case 3: Contributor with 0 share
    let invalid_shares_3 = vec![
        &env,
        ContributorShare {
            address: contrib1.clone(),
            share: 0,
        },
    ];
    let res3 = client.try_register_asset(&asset_id, &owner, &invalid_shares_3);
    assert!(res3.is_err());
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

    let asset_id = Symbol::new(&env, "song3");

    // Create 11 contributors, each with 909 shares (roughly splitting, but sum must equal 10000)
    // 909 * 11 = 9999 + 1 = 10000
    let mut contributors = vec![&env];
    for _ in 0..11 {
        contributors.push_back(ContributorShare {
            address: Address::generate(&env),
            share: 909,
        });
    }

    let res = client.try_register_asset(&asset_id, &owner, &contributors);
    assert!(res.is_err());
}
