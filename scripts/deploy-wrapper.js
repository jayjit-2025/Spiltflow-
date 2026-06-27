const { Keypair } = require('@stellar/stellar-sdk');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  const kp = Keypair.random();
  const address = kp.publicKey();
  const secret = kp.secret();
  
  console.log('Funding temporary deployer account: ' + address);
  
  // Friendbot query
  const res = await fetch('https://friendbot.stellar.org/?addr=' + address);
  if (!res.ok) throw new Error('Friendbot failed');
  
  // Wait a few seconds for transaction settlement
  console.log('Temporary account funded. Waiting 5s for ledger close...');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Deploying contracts...');
  execSync('npx ts-node -O "{\\"target\\":\\"es2022\\",\\"module\\":\\"commonjs\\",\\"esModuleInterop\\":true,\\"strict\\":false}" ../scripts/deploy.ts', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../frontend'),
    env: { ...process.env, DEPLOYER_SECRET_KEY: secret, NODE_PATH: path.resolve(__dirname, '../frontend/node_modules') }
  });
  console.log('Done!');
}
main().catch(err => { console.error(err); process.exit(1); });
