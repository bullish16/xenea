require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const name = process.env.TOKEN_A_NAME || "Token A";
  const symbol = process.env.TOKEN_A_SYMBOL || "TKA";

  console.log(`\n🚀 Deploying ${name} (${symbol})...`);
  console.log(`👛 Deployer: ${deployer.address}\n`);

  const Token = await hre.ethers.getContractFactory("MockToken");
  const token = await Token.deploy(name, symbol);
  await token.waitForDeployment();
  const addr = await token.getAddress();

  console.log(`✅ ${symbol} deployed: ${addr}`);
  console.log(`🔗 https://ubusuna.xeneascan.com/address/${addr}`);

  console.log(`\n⏳ Verifying (15s)...`);
  await new Promise(r => setTimeout(r, 15000));
  try {
    await hre.run("verify:verify", { address: addr, constructorArguments: [name, symbol] });
    console.log(`✅ Verified!`);
  } catch (e) {
    console.log(`⚠️  ${e.message?.includes("already") ? "Already verified" : e.message?.slice(0, 80)}`);
  }

  console.log(`\n📋 Add to .env:\n   TOKEN_A=${addr}`);
}

main().catch(e => { console.error(e); process.exit(1); });
