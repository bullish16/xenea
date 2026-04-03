require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const tokenA = process.env.TOKEN_A;
  const tokenB = process.env.TOKEN_B;
  const xeneaToken = process.env.XENEA_TOKEN;

  if (!tokenA || !tokenB || !xeneaToken) {
    console.error("❌ Set TOKEN_A, TOKEN_B, XENEA_TOKEN di .env dulu!");
    console.error("   Jalankan script 1, 2, 3 dulu untuk deploy token.");
    process.exit(1);
  }

  console.log(`\n🚀 Deploying XENEAStaking...`);
  console.log(`👛 Deployer: ${deployer.address}`);
  console.log(`   TokenA:  ${tokenA}`);
  console.log(`   TokenB:  ${tokenB}`);
  console.log(`   Reward:  ${xeneaToken}\n`);

  const Staking = await hre.ethers.getContractFactory("XENEAStaking");
  const staking = await Staking.deploy(tokenA, tokenB, xeneaToken);
  await staking.waitForDeployment();
  const addr = await staking.getAddress();

  console.log(`✅ Staking deployed: ${addr}`);
  console.log(`🔗 https://ubusuna.xeneascan.com/address/${addr}`);

  // Fund rewards
  const rewardAmount = hre.ethers.parseEther(process.env.REWARD_AMOUNT || "100000000");
  console.log(`\n💰 Funding ${hre.ethers.formatEther(rewardAmount)} XENEA...`);

  const xenea = await hre.ethers.getContractAt("XENEA", xeneaToken);
  const approveTx = await xenea.approve(addr, rewardAmount);
  await approveTx.wait();
  console.log(`   ✅ Approved`);

  const stakingContract = await hre.ethers.getContractAt("XENEAStaking", addr);
  const fundTx = await stakingContract.fundRewards(rewardAmount);
  await fundTx.wait();
  console.log(`   ✅ Funded`);

  // Verify
  console.log(`\n⏳ Verifying (15s)...`);
  await new Promise(r => setTimeout(r, 15000));
  try {
    await hre.run("verify:verify", { address: addr, constructorArguments: [tokenA, tokenB, xeneaToken] });
    console.log(`✅ Verified!`);
  } catch (e) {
    console.log(`⚠️  ${e.message?.includes("already") ? "Already verified" : e.message?.slice(0, 80)}`);
  }

  console.log(`\n📋 Add to .env:\n   STAKING_CONTRACT=${addr}`);
}

main().catch(e => { console.error(e); process.exit(1); });
