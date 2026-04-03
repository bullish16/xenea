const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("═══════════════════════════════════════════");
  console.log("  🚀 Deploying XENEA Token");
  console.log("  Chain: XENEA (1096)");
  console.log("═══════════════════════════════════════════");
  console.log(`\n👛 Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} TXENE\n`);

  console.log("⏳ Deploying...");
  const XENEA = await hre.ethers.getContractFactory("XENEA");
  const token = await XENEA.deploy();
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(`\n✅ XENEA Token deployed!`);
  console.log(`📄 Contract: ${address}`);
  console.log(`🔗 Explorer: https://ubusuna.xeneascan.com/address/${address}`);

  // Verify
  console.log(`\n⏳ Waiting 10s before verification...`);
  await new Promise((r) => setTimeout(r, 10000));

  console.log("🔍 Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("✅ Contract verified!");
  } catch (err) {
    if (err.message.includes("Already Verified") || err.message.includes("already verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.log("⚠️ Verification failed:", err.message);
      console.log("\n📋 Manual verify command:");
      console.log(`   npx hardhat verify --network xenea ${address}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
