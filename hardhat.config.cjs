require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    xenea: {
      url: "https://rpc-ubusuna.xeneascan.com",
      chainId: 1096,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY.replace(/^0x/, "")}`] : [],
    },
  },
  etherscan: {
    apiKey: {
      xenea: "no-api-key-needed",
    },
    customChains: [
      {
        network: "xenea",
        chainId: 1096,
        urls: {
          apiURL: "https://ubusuna.xeneascan.com/api",
          browserURL: "https://ubusuna.xeneascan.com",
        },
      },
    ],
  },
};
