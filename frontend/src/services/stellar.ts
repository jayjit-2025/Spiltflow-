import {
  rpc,
  Contract,
  TransactionBuilder,
  Networks,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
  Account,
} from '@stellar/stellar-sdk';

type NetworkType = 'TESTNET' | 'PUBLIC' | 'STANDALONE';

// Default RPC server URLs
export const TESTNET_RPC_URL = 'https://soroban-testnet.stellar.org';
export const LOCALNET_RPC_URL = 'http://localhost:8000';

// Default fallback contract addresses (populated after deployment)
export const FALLBACK_MANAGER_ID = process.env.NEXT_PUBLIC_MANAGER_CONTRACT_ID || 'CD2GSKODG4YI7CCHFKJTTR2BMZIJMQZRYU7JH666T2Z2WQC5HOVAVFW4';
export const FALLBACK_DISTRIBUTOR_ID = process.env.NEXT_PUBLIC_DISTRIBUTOR_CONTRACT_ID || 'CAGLWDRQ2IIRGIFGJJZTUA4LM3KLEOCFZUHVNE6HIXHMY2KZP6GNXAJT';
export const XLM_SAC_ID = process.env.NEXT_PUBLIC_XLM_SAC_ID || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export interface ContractSettings {
  managerId: string;
  distributorId: string;
  tokenId: string;
}

export function getContractSettings(): ContractSettings {
  if (typeof window !== 'undefined') {
    const managerId = localStorage.getItem('splitflow:manager_id');
    const distributorId = localStorage.getItem('splitflow:distributor_id');
    const tokenId = localStorage.getItem('splitflow:token_id');
    return {
      managerId: managerId || FALLBACK_MANAGER_ID,
      distributorId: distributorId || FALLBACK_DISTRIBUTOR_ID,
      tokenId: tokenId || XLM_SAC_ID,
    };
  }
  return {
    managerId: FALLBACK_MANAGER_ID,
    distributorId: FALLBACK_DISTRIBUTOR_ID,
    tokenId: XLM_SAC_ID,
  };
}

export interface ContributorInput {
  address: string;
  share: number; // Percentage in basis points (e.g. 5000 = 50.00%)
}

export interface AssetDetails {
  owner: string;
  contributors: ContributorInput[];
  isActive: boolean;
}

/**
 * Gets the correct RPC URL based on the active network.
 */
export function getRpcUrl(network: NetworkType): string {
  return network === 'PUBLIC'
    ? 'https://soroban-mainnet.stellar.org'
    : network === 'TESTNET'
    ? TESTNET_RPC_URL
    : LOCALNET_RPC_URL;
}

/**
 * Gets the network passphrase based on the active network.
 */
export function getNetworkPassphrase(network: NetworkType): string {
  return network === 'PUBLIC'
    ? Networks.PUBLIC
    : network === 'TESTNET'
    ? Networks.TESTNET
    : Networks.STANDALONE;
}

/**
 * Fetches asset details from the Royalty Manager contract.
 */
export async function fetchAssetDetails(
  network: NetworkType,
  managerId: string,
  assetId: string
): Promise<AssetDetails | null> {
  const rpcUrl = getRpcUrl(network);
  const server = new rpc.Server(rpcUrl);
  const contract = new Contract(managerId);

  // Prepare arguments for get_asset(asset_id: Symbol)
  const args = [nativeToScVal(assetId, { type: 'symbol' })];

  try {
    const response = await server.simulateTransaction(
      new TransactionBuilder(
        new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
        {
          fee: '100',
          networkPassphrase: getNetworkPassphrase(network),
        }
      )
        .addOperation(contract.call('get_asset', ...args))
        .setTimeout(30)
        .build()
    );

    if (rpc.Api.isSimulationSuccess(response) && response.result) {
      const output = response.result.retval;
      const parsed = scValToNative(output);
      
      if (!parsed) return null;

      return {
        owner: parsed.owner,
        contributors: parsed.contributors.map((c: any) => ({
          address: c.address,
          share: Number(c.share),
        })),
        isActive: parsed.is_active,
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching asset details:', err);
    return null;
  }
}

/**
 * Prepares, simulates, and signs a Soroban transaction.
 */
export async function buildAndSimulateTx(
  network: NetworkType,
  senderAddress: string,
  contractId: string,
  functionName: string,
  args: any[]
): Promise<any> {
  const rpcUrl = getRpcUrl(network);
  const passphrase = getNetworkPassphrase(network);
  const server = new rpc.Server(rpcUrl);
  const contract = new Contract(contractId);

  // 1. Fetch account details to get the current sequence number
  const accountResult = await server.getAccount(senderAddress);
  const account = new Account(senderAddress, accountResult.sequenceNumber());

  // 2. Build the initial transaction envelope
  const tx = new TransactionBuilder(account, {
    fee: '100', // temporary base fee
    networkPassphrase: passphrase,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(30)
    .build();

  // 3. Simulate transaction to calculate exact gas, resources, and fees
  const simulation = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  // 4. Assemble the transaction with simulation resource results
  const assembledTx = rpc.assembleTransaction(tx, simulation).build();
  return assembledTx;
}

/**
 * Polls the Soroban RPC server to check transaction status until confirmed or failed.
 */
export async function pollTxStatus(
  network: NetworkType,
  txHash: string,
  maxAttempts = 30,
  delayMs = 1500
): Promise<rpc.Api.GetTransactionResponse> {
  const rpcUrl = getRpcUrl(network);
  const server = new rpc.Server(rpcUrl);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const txResponse = await server.getTransaction(txHash);

    if (txResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return txResponse;
    } else if (txResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed on ledger: ${txResponse.txHash}`);
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error('Transaction polling timed out');
}

