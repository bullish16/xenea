require("dotenv").config();
const hre = require("hardhat");

// ═══════════════════════════════════════════════════════════
// Deploy XENEA Token + Staking Contract
// ═══════════════════════════════════════════════════════════
//
// USAGE:
//   npx hardhat run scripts/deploy-all.cjs --network xenea
//
// ENV VARS (set in .env):
//   PRIVATE_KEY    - deployer wallet
//   TOKEN_A        - address of TokenA to stake
//   TOKEN_B        - address of TokenB to stake
//   XENEA_TOKEN    - (optional) existing XENEA token address, skip deploy if set
//   REWARD_AMOUNT  - (optional) XENEA to fund staking, default 100,000,000
//
// ═══════════════════════════════════════════════════════════

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("═══════════════════════════════════════════");
  console.log("  🚀 XENEA Deploy All");
  console.log("  Chain: XENEA (1096)");
  console.log("═══════════════════════════════════════════");
  console.log(`\n👛 Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} TXENE\n`);

  if (balance === 0n) {
    console.error("❌ No TXENE for gas! Fund your wallet first.");
    process.exit(1);
  }

  // ── Step 1: Deploy or use existing XENEA Token ──
  let xeneaAddress = process.env.XENEA_TOKEN || "";

  if (!xeneaAddress) {
    console.log("📦 Step 1/3: Deploying XENEA Token...");
    const XENEA = await hre.ethers.getContractFactory("XENEA");
    const xenea = await XENEA.deploy();
    await xenea.waitForDeployment();
    xeneaAddress = await xenea.getAddress();
    console.log(`   ✅ XENEA Token: ${xeneaAddress}`);
  } else {
    console.log(`📦 Step 1/3: Using existing XENEA Token: ${xeneaAddress}`);
  }

  // ── Step 2: Deploy Staking Contract ──
  const tokenA = process.env.TOKEN_A;
  const tokenB = process.env.TOKEN_B;

  if (!tokenA || !tokenB) {
    console.error("\n❌ Set TOKEN_A and TOKEN_B in .env file!");
    console.error("   These are the token addresses users will stake.");
    console.log(`\n📄 XENEA Token deployed at: ${xeneaAddress}`);
    console.log("   Add XENEA_TOKEN to .env to skip re-deploy next time.\n");
    process.exit(1);
  }

  console.log(`\n📦 Step 2/3: Deploying Staking Contract...`);
  console.log(`   TokenA: ${tokenA}`);
  console.log(`   TokenB: ${tokenB}`);
  console.log(`   Reward: ${xeneaAddress} (XENEA)`);

  const Staking = await hre.ethers.getContractFactory("XENEAStaking");
  const staking = await Staking.deploy(tokenA, tokenB, xeneaAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log(`   ✅ Staking Contract: ${stakingAddress}`);

  // ── Step 3: Fund staking with XENEA rewards ──
  const rewardAmount = hre.ethers.parseEther(process.env.REWARD_AMOUNT || "100000000"); // 100M default
  console.log(`\n📦 Step 3/3: Funding staking with ${hre.ethers.formatEther(rewardAmount)} XENEA...`);

  const xenea = await hre.ethers.getContractAt("XENEA", xeneaAddress);
  
  // Approve
  const approveTx = await xenea.approve(stakingAddress, rewardAmount);
  await approveTx.wait();
  console.log(`   ✅ Approved`);

  // Fund
  const stakingContract = await hre.ethers.getContractAt("XENEAStaking", stakingAddress);
  const fundTx = await stakingContract.fundRewards(rewardAmount);
  await fundTx.wait();
  console.log(`   ✅ Funded ${hre.ethers.formatEther(rewardAmount)} XENEA`);

  // ── Verify Contracts ──
  console.log("\n🔍 Verifying contracts (waiting 15s for indexing)...");
  await new Promise((r) => setTimeout(r, 15000));

  // Verify XENEA Token
  if (!process.env.XENEA_TOKEN) {
    try {
      await hre.run("verify:verify", {
        address: xeneaAddress,
        constructorArguments: [],
      });
      console.log("   ✅ XENEA Token verified");
    } catch (err) {
      if (err.message.includes("already verified") || err.message.includes("Already Verified")) {
        console.log("   ✅ XENEA Token already verified");
      } else {
        console.log("   ⚠️ XENEA verify failed:", err.message?.slice(0, 100));
      }
    }
  }

  // Verify Staking
  try {
    await hre.run("verify:verify", {
      address: stakingAddress,
      constructorArguments: [tokenA, tokenB, xeneaAddress],
    });
    console.log("   ✅ Staking Contract verified");
  } catch (err) {
    if (err.message.includes("already verified") || err.message.includes("Already Verified")) {
      console.log("   ✅ Staking Contract already verified");
    } else {
      console.log("   ⚠️ Staking verify failed:", err.message?.slice(0, 100));
    }
  }

  // ── Summary ──
  console.log("\n\n═══════════════════════════════════════════");
  console.log("  ✅ DEPLOYMENT COMPLETE!");
  console.log("═══════════════════════════════════════════");
  console.log(`\n📄 XENEA Token:      ${xeneaAddress}`);
  console.log(`📄 Staking Contract: ${stakingAddress}`);
  console.log(`\n🔗 Token:   https://ubusuna.xeneascan.com/address/${xeneaAddress}`);
  console.log(`🔗 Staking: https://ubusuna.xeneascan.com/address/${stakingAddress}`);
  console.log(`\n💰 Reward pool: ${hre.ethers.formatEther(rewardAmount)} XENEA`);
  console.log(`📊 Rate: 0.001 XENEA/min per 100,000 tokens staked`);

  console.log("\n📋 Save these to .env for future use:");
  console.log(`   XENEA_TOKEN=${xeneaAddress}`);
  console.log(`   STAKING_CONTRACT=${stakingAddress}`);

  // Manual verify commands
  console.log("\n📋 Manual verify (if auto failed):");
  console.log(`   npx hardhat verify --network xenea ${xeneaAddress}`);
  console.log(`   npx hardhat verify --network xenea ${stakingAddress} ${tokenA} ${tokenB} ${xeneaAddress}`);
}

main().catch((err) => {
  console.error("\n💥 Fatal:", err);
  process.exit(1);
});
