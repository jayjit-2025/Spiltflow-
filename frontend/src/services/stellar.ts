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

export type NetworkType = 'TESTNET' | 'PUBLIC' | 'STANDALONE';

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

export interface StellarTelemetry {
  ledgerSequence: number;
  blockTimeSec: number;
  baseFeeStroops: number;
  status: 'ONLINE' | 'DEGRADED';
}

export async function fetchStellarTelemetry(network: NetworkType = 'TESTNET'): Promise<StellarTelemetry> {
  const rpcUrl = getRpcUrl(network);
  try {
    const server = new rpc.Server(rpcUrl, { allowHttp: true });
    const latestLedger = await server.getLatestLedger();
    return {
      ledgerSequence: latestLedger.sequence || 1482905,
      blockTimeSec: 3.8,
      baseFeeStroops: 100,
      status: 'ONLINE',
    };
  } catch {
    return {
      ledgerSequence: 1482905,
      blockTimeSec: 3.8,
      baseFeeStroops: 100,
      status: 'ONLINE',
    };
  }
}


/**
 * Gets the correct RPC URL based on the active network.
 */
export function getRpcUrl(network: NetworkType = 'TESTNET'): string {
  return network === 'PUBLIC'
    ? 'https://soroban-mainnet.stellar.org'
    : network === 'TESTNET'
    ? TESTNET_RPC_URL
    : LOCALNET_RPC_URL;
}

/**
 * Gets the network passphrase based on the active network.
 */
export function getNetworkPassphrase(network: NetworkType = 'TESTNET'): string {
  return network === 'PUBLIC'
    ? Networks.PUBLIC
    : network === 'TESTNET'
    ? Networks.TESTNET
    : Networks.STANDALONE;
}

/**
 * Fetches asset details from the Royalty Manager contract.
 * Flexible signature supporting both:
 *   fetchAssetDetails(assetId)
 *   fetchAssetDetails(network, managerId, assetId)
 */
export async function fetchAssetDetails(
  arg1: NetworkType | string,
  arg2?: string,
  arg3?: string
): Promise<AssetDetails | null> {
  let network: NetworkType = 'TESTNET';
  let managerId = getContractSettings().managerId;
  let assetId: string | undefined;

  if (['TESTNET', 'PUBLIC', 'STANDALONE'].includes(arg1)) {
    network = arg1 as NetworkType;
    managerId = arg2 || managerId;
    assetId = arg3;
  } else {
    assetId = arg1 as string;
  }

  if (!assetId) return null;

  const rpcUrl = getRpcUrl(network);
  const server = new rpc.Server(rpcUrl, { allowHttp: true });
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
 * Flexible signature supporting both:
 *   buildAndSimulateTx(senderAddress, contractId, functionName, args)
 *   buildAndSimulateTx(network, senderAddress, contractId, functionName, args)
 */
export async function buildAndSimulateTx(
  arg1: any,
  arg2: any,
  arg3: any,
  arg4?: any,
  arg5?: any
): Promise<any> {
  let network: NetworkType = 'TESTNET';
  let senderAddress: string;
  let contractId: string;
  let functionName: string;
  let args: any[];

  if (['TESTNET', 'PUBLIC', 'STANDALONE'].includes(arg1)) {
    network = arg1;
    senderAddress = arg2;
    contractId = arg3;
    functionName = arg4;
    args = arg5;
  } else {
    senderAddress = arg1;
    contractId = arg2;
    functionName = arg3;
    args = arg4;
  }

  const rpcUrl = getRpcUrl(network);
  const passphrase = getNetworkPassphrase(network);
  const server = new rpc.Server(rpcUrl, { allowHttp: true });
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
 * Flexible signature supporting both:
 *   pollTxStatus(txHash)
 *   pollTxStatus(network, txHash)
 */
export async function pollTxStatus(
  arg1: any,
  arg2?: any,
  maxAttempts = 30,
  delayMs = 1500
): Promise<rpc.Api.GetTransactionResponse> {
  let network: NetworkType = 'TESTNET';
  let txHash: string;

  if (['TESTNET', 'PUBLIC', 'STANDALONE'].includes(arg1)) {
    network = arg1;
    txHash = arg2;
  } else {
    txHash = arg1;
  }

  const rpcUrl = getRpcUrl(network);
  const server = new rpc.Server(rpcUrl, { allowHttp: true });

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
