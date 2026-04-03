require("dotenv").config();
const hre = require("hardhat");

// USAGE:
//   npx hardhat run scripts/unstake.cjs --network xenea
//
// ENV:
//   STAKE_TOKEN=A or B           (which token to unstake)
//   UNSTAKE_AMOUNT=100000         (amount, or "all" for full unstake)

async function main() {
  const [user] = await hre.ethers.getSigners();
  const stakingAddr = process.env.STAKING_CONTRACT;

  if (!stakingAddr) {
    console.error("❌ Set STAKING_CONTRACT di .env");
    process.exit(1);
  }

  const staking = await hre.ethers.getContractAt("XENEAStaking", stakingAddr);
  const info = await staking.stakes(user.address);
  const which = (process.env.STAKE_TOKEN || "A").toUpperCase();
  const staked = which === "B" ? info.amountB : info.amountA;
  const funcName = which === "B" ? "unstakeTokenB" : "unstakeTokenA";

  const rawAmount = process.env.UNSTAKE_AMOUNT || "all";
  const amount = rawAmount.toLowerCase() === "all" ? staked : hre.ethers.parseEther(rawAmount);

  console.log(`\n📤 UNSTAKE Token${which}`);
  console.log(`👛 User: ${user.address}`);
  console.log(`   Currently staked: ${hre.ethers.formatEther(staked)} Token${which}`);
  console.log(`   Unstaking: ${hre.ethers.formatEther(amount)}\n`);

  if (amount === 0n) {
    console.log("ℹ️  Nothing staked!");
    return;
  }
  if (amount > staked) {
    console.error("❌ Amount exceeds staked balance!");
    process.exit(1);
  }

  console.log(`   📤 Unstaking...`);
  const tx = await staking[funcName](amount);
  await tx.wait();

  console.log(`\n✅ Unstaked ${hre.ethers.formatEther(amount)} Token${which}!`);

  // Show updated status
  const newInfo = await staking.stakes(user.address);
  const pending = await staking.pendingReward(user.address);
  console.log(`\n📊 Updated Position:`);
  console.log(`   TokenA staked: ${hre.ethers.formatEther(newInfo.amountA)}`);
  console.log(`   TokenB staked: ${hre.ethers.formatEther(newInfo.amountB)}`);
  console.log(`   Pending reward: ${hre.ethers.formatEther(pending)} XENEA`);
}

main().catch(e => { console.error(e); process.exit(1); });
