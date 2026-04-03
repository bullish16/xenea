require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log(`\n🚀 Deploying XENEA Token (1B supply)...`);
  console.log(`👛 Deployer: ${deployer.address}\n`);

  const XENEA = await hre.ethers.getContractFactory("XENEA");
  const xenea = await XENEA.deploy();
  await xenea.waitForDeployment();
  const addr = await xenea.getAddress();

  console.log(`✅ XENEA deployed: ${addr}`);
  console.log(`🔗 https://ubusuna.xeneascan.com/address/${addr}`);

  console.log(`\n⏳ Verifying (15s)...`);
  await new Promise(r => setTimeout(r, 15000));
  try {
    await hre.run("verify:verify", { address: addr, constructorArguments: [] });
    console.log(`✅ Verified!`);
  } catch (e) {
    console.log(`⚠️  ${e.message?.includes("already") ? "Already verified" : e.message?.slice(0, 80)}`);
  }

  console.log(`\n📋 Add to .env:\n   XENEA_TOKEN=${addr}`);
}

main().catch(e => { console.error(e); process.exit(1); });
