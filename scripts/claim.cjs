require("dotenv").config();
const hre = require("hardhat");

// USAGE:
//   npx hardhat run scripts/claim.cjs --network xenea

async function main() {
  const [user] = await hre.ethers.getSigners();
  const stakingAddr = process.env.STAKING_CONTRACT;
  const xeneaAddr = process.env.XENEA_TOKEN;

  if (!stakingAddr) {
    console.error("❌ Set STAKING_CONTRACT di .env");
    process.exit(1);
  }

  const staking = await hre.ethers.getContractAt("XENEAStaking", stakingAddr);
  const pending = await staking.pendingReward(user.address);

  console.log(`\n🎁 CLAIM REWARDS`);
  console.log(`👛 User: ${user.address}`);
  console.log(`   Pending: ${hre.ethers.formatEther(pending)} XENEA\n`);

  if (pending === 0n) {
    console.log("ℹ️  No rewards to claim!");
    return;
  }

  // Check reward pool
  const available = await staking.rewardsAvailable();
  console.log(`   Reward pool: ${hre.ethers.formatEther(available)} XENEA`);

  if (available < pending) {
    console.error("❌ Not enough XENEA in reward pool!");
    process.exit(1);
  }

  console.log(`   🎁 Claiming...`);
  const tx = await staking.claim();
  await tx.wait();

  // Check XENEA balance
  if (xeneaAddr) {
    const xenea = await hre.ethers.getContractAt("XENEA", xeneaAddr);
    const bal = await xenea.balanceOf(user.address);
    console.log(`\n✅ Claimed ${hre.ethers.formatEther(pending)} XENEA!`);
    console.log(`💰 XENEA balance: ${hre.ethers.formatEther(bal)}`);
  } else {
    console.log(`\n✅ Claimed ${hre.ethers.formatEther(pending)} XENEA!`);
  }

  // Show position
  const info = await staking.stakes(user.address);
  console.log(`\n📊 Position:`);
  console.log(`   TokenA staked: ${hre.ethers.formatEther(info.amountA)}`);
  console.log(`   TokenB staked: ${hre.ethers.formatEther(info.amountB)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
