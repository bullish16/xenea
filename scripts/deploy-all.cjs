require("dotenv").config();
const hre = require("hardhat");

// ═══════════════════════════════════════════════════════════
// Deploy Everything: TokenA + TokenB + XENEA + Staking
// ═══════════════════════════════════════════════════════════
//
// Kalau TOKEN_A / TOKEN_B belum ada → otomatis deploy MockToken
// Kalau XENEA_TOKEN belum ada → otomatis deploy XENEA
//
// USAGE:
//   npx hardhat run scripts/deploy-all.cjs --network xenea
//
// ═══════════════════════════════════════════════════════════

async function deployOrUse(label, envKey, factoryName, deployArgs = []) {
  const existing = process.env[envKey];
  if (existing) {
    console.log(`   ♻️  ${label}: ${existing} (existing)`);
    return existing;
  }

  const Factory = await hre.ethers.getContractFactory(factoryName);
  const contract = await Factory.deploy(...deployArgs);
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log(`   ✅ ${label}: ${addr} (deployed)`);
  return addr;
}

async function verify(address, constructorArguments, label) {
  try {
    await hre.run("verify:verify", { address, constructorArguments });
    console.log(`   ✅ ${label} verified`);
  } catch (err) {
    if (err.message?.includes("already verified") || err.message?.includes("Already Verified")) {
      console.log(`   ✅ ${label} already verified`);
    } else {
      console.log(`   ⚠️  ${label} verify failed: ${err.message?.slice(0, 80)}`);
    }
  }
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("═══════════════════════════════════════════");
  console.log("  🚀 XENEA Full Deploy");
  console.log("  Chain: XENEA (1096)");
  console.log("═══════════════════════════════════════════");
  console.log(`\n👛 Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} TXENE\n`);

  if (balance === 0n) {
    console.error("❌ No TXENE for gas!");
    process.exit(1);
  }

  // ── Step 1: Deploy Tokens ──
  console.log("📦 Step 1/4: Deploy Tokens");

  const tokenAName = process.env.TOKEN_A_NAME || "Token A";
  const tokenASymbol = process.env.TOKEN_A_SYMBOL || "TKA";
  const tokenBName = process.env.TOKEN_B_NAME || "Token B";
  const tokenBSymbol = process.env.TOKEN_B_SYMBOL || "TKB";

  const tokenAAddr = await deployOrUse("TokenA", "TOKEN_A", "MockToken", [tokenAName, tokenASymbol]);
  const tokenBAddr = await deployOrUse("TokenB", "TOKEN_B", "MockToken", [tokenBName, tokenBSymbol]);
  const xeneaAddr = await deployOrUse("XENEA", "XENEA_TOKEN", "XENEA");

  // ── Step 2: Deploy Staking ──
  console.log("\n📦 Step 2/4: Deploy Staking Contract");
  console.log(`   TokenA:  ${tokenAAddr}`);
  console.log(`   TokenB:  ${tokenBAddr}`);
  console.log(`   Reward:  ${xeneaAddr}`);

  let stakingAddr = process.env.STAKING_CONTRACT || "";
  if (!stakingAddr) {
    const Staking = await hre.ethers.getContractFactory("XENEAStaking");
    const staking = await Staking.deploy(tokenAAddr, tokenBAddr, xeneaAddr);
    await staking.waitForDeployment();
    stakingAddr = await staking.getAddress();
    console.log(`   ✅ Staking: ${stakingAddr}`);
  } else {
    console.log(`   ♻️  Staking: ${stakingAddr} (existing)`);
  }

  // ── Step 3: Fund Rewards ──
  console.log("\n📦 Step 3/4: Fund Staking Rewards");
  const rewardAmount = hre.ethers.parseEther(process.env.REWARD_AMOUNT || "100000000");

  const xenea = await hre.ethers.getContractAt("XENEA", xeneaAddr);
  const stakingContract = await hre.ethers.getContractAt("XENEAStaking", stakingAddr);

  // Check if already funded
  const currentRewards = await hre.ethers.provider.call({
    to: xeneaAddr,
    data: xenea.interface.encodeFunctionData("balanceOf", [stakingAddr]),
  });
  const currentBal = BigInt(currentRewards);

  if (currentBal >= rewardAmount) {
    console.log(`   ♻️  Already funded: ${hre.ethers.formatEther(currentBal)} XENEA`);
  } else {
    console.log(`   🔓 Approving ${hre.ethers.formatEther(rewardAmount)} XENEA...`);
    const approveTx = await xenea.approve(stakingAddr, rewardAmount);
    await approveTx.wait();

    console.log(`   💰 Funding...`);
    const fundTx = await stakingContract.fundRewards(rewardAmount);
    await fundTx.wait();
    console.log(`   ✅ Funded ${hre.ethers.formatEther(rewardAmount)} XENEA`);
  }

  // ── Step 4: Verify ──
  console.log("\n🔍 Step 4/4: Verify Contracts (waiting 15s)...");
  await new Promise((r) => setTimeout(r, 15000));

  if (!process.env.TOKEN_A) {
    await verify(tokenAAddr, [tokenAName, tokenASymbol], "TokenA");
  }
  if (!process.env.TOKEN_B) {
    await verify(tokenBAddr, [tokenBName, tokenBSymbol], "TokenB");
  }
  if (!process.env.XENEA_TOKEN) {
    await verify(xeneaAddr, [], "XENEA Token");
  }
  if (!process.env.STAKING_CONTRACT) {
    await verify(stakingAddr, [tokenAAddr, tokenBAddr, xeneaAddr], "Staking Contract");
  }

  // ── Summary ──
  console.log("\n\n═══════════════════════════════════════════");
  console.log("  ✅ ALL DEPLOYED!");
  console.log("═══════════════════════════════════════════");
  console.log(`\n📄 TokenA (${tokenASymbol}):    ${tokenAAddr}`);
  console.log(`📄 TokenB (${tokenBSymbol}):    ${tokenBAddr}`);
  console.log(`📄 XENEA Token:     ${xeneaAddr}`);
  console.log(`📄 Staking Contract: ${stakingAddr}`);
  console.log(`\n💰 Reward pool: ${hre.ethers.formatEther(rewardAmount)} XENEA`);
  console.log(`📊 Rate: 0.001 XENEA/min per 100,000 tokens staked`);

  console.log("\n🔗 Explorer Links:");
  const base = "https://ubusuna.xeneascan.com/address";
  console.log(`   TokenA:  ${base}/${tokenAAddr}`);
  console.log(`   TokenB:  ${base}/${tokenBAddr}`);
  console.log(`   XENEA:   ${base}/${xeneaAddr}`);
  console.log(`   Staking: ${base}/${stakingAddr}`);

  console.log("\n📋 Simpan ke .env biar gak deploy ulang:");
  console.log(`   TOKEN_A=${tokenAAddr}`);
  console.log(`   TOKEN_B=${tokenBAddr}`);
  console.log(`   XENEA_TOKEN=${xeneaAddr}`);
  console.log(`   STAKING_CONTRACT=${stakingAddr}`);
}

main().catch((err) => {
  console.error("\n💥 Fatal:", err);
  process.exit(1);
});
