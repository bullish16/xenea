require("dotenv").config();
const hre = require("hardhat");

// USAGE:
//   npx hardhat run scripts/status.cjs --network xenea

async function main() {
  const [user] = await hre.ethers.getSigners();
  const stakingAddr = process.env.STAKING_CONTRACT;

  if (!stakingAddr) {
    console.error("❌ Set STAKING_CONTRACT di .env");
    process.exit(1);
  }

  const staking = await hre.ethers.getContractAt("XENEAStaking", stakingAddr);
  const info = await staking.stakes(user.address);
  const pending = await staking.pendingReward(user.address);
  const available = await staking.rewardsAvailable();
  const totalA = await staking.totalStakedA();
  const totalB = await staking.totalStakedB();

  console.log(`\n📊 STAKING STATUS`);
  console.log(`═══════════════════════════════════`);
  console.log(`👛 User: ${user.address}`);
  console.log(`📄 Contract: ${stakingAddr}`);
  console.log(`\n── Your Position ──`);
  console.log(`   TokenA staked: ${hre.ethers.formatEther(info.amountA)}`);
  console.log(`   TokenB staked: ${hre.ethers.formatEther(info.amountB)}`);
  console.log(`   Pending XENEA: ${hre.ethers.formatEther(pending)}`);
  console.log(`\n── Global ──`);
  console.log(`   Total TokenA staked: ${hre.ethers.formatEther(totalA)}`);
  console.log(`   Total TokenB staked: ${hre.ethers.formatEther(totalB)}`);
  console.log(`   Reward pool: ${hre.ethers.formatEther(available)} XENEA`);
}

main().catch(e => { console.error(e); process.exit(1); });
