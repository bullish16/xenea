require("dotenv").config();
const hre = require("hardhat");

// USAGE:
//   npx hardhat run scripts/stake.cjs --network xenea
//
// ENV:
//   STAKE_TOKEN=A or B          (which token to stake)
//   STAKE_AMOUNT=100000          (amount to stake, in token units)

async function main() {
  const [user] = await hre.ethers.getSigners();
  const stakingAddr = process.env.STAKING_CONTRACT;
  const tokenAAddr = process.env.TOKEN_A;
  const tokenBAddr = process.env.TOKEN_B;

  if (!stakingAddr || !tokenAAddr || !tokenBAddr) {
    console.error("❌ Set STAKING_CONTRACT, TOKEN_A, TOKEN_B di .env");
    process.exit(1);
  }

  const which = (process.env.STAKE_TOKEN || "A").toUpperCase();
  const amount = hre.ethers.parseEther(process.env.STAKE_AMOUNT || "100000");
  const tokenAddr = which === "B" ? tokenBAddr : tokenAAddr;
  const funcName = which === "B" ? "stakeTokenB" : "stakeTokenA";

  console.log(`\n📥 STAKE Token${which}`);
  console.log(`👛 User: ${user.address}`);
  console.log(`💰 Amount: ${hre.ethers.formatEther(amount)}`);
  console.log(`📄 Staking: ${stakingAddr}\n`);

  // Approve
  const token = await hre.ethers.getContractAt("MockToken", tokenAddr);
  const bal = await token.balanceOf(user.address);
  console.log(`   Balance: ${hre.ethers.formatEther(bal)} Token${which}`);

  if (bal < amount) {
    console.error(`❌ Not enough Token${which}!`);
    process.exit(1);
  }

  console.log(`   🔓 Approving...`);
  const approveTx = await token.approve(stakingAddr, amount);
  await approveTx.wait();
  console.log(`   ✅ Approved`);

  // Stake
  console.log(`   📥 Staking...`);
  const staking = await hre.ethers.getContractAt("XENEAStaking", stakingAddr);
  const stakeTx = await staking[funcName](amount);
  await stakeTx.wait();

  console.log(`\n✅ Staked ${hre.ethers.formatEther(amount)} Token${which}!`);

  // Show status
  const info = await staking.stakes(user.address);
  console.log(`\n📊 Your Position:`);
  console.log(`   TokenA staked: ${hre.ethers.formatEther(info.amountA)}`);
  console.log(`   TokenB staked: ${hre.ethers.formatEther(info.amountB)}`);
  const pending = await staking.pendingReward(user.address);
  console.log(`   Pending reward: ${hre.ethers.formatEther(pending)} XENEA`);
}

main().catch(e => { console.error(e); process.exit(1); });
