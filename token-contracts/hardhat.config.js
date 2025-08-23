require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

module.exports = {
  solidity: '0.8.20',
  networks: {
    sepolia: {
      url: 'https://eth-sepolia.g.alchemy.com/v2/4K2DjLA6wM5WY41lW1YkYzoysm8AKPC9', // Alchemy RPC URL
      accounts: [process.env.PRIVATE_KEY], // your MetaMask wallet private key
    },
  },
};