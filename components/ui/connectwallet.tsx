"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function ConnectWalletButton() {
  const [account, setAccount] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const TARGET_CHAIN_ID = "0xaa36a7"; // Sepolia chainId in hex

  // Check if wallet is already connected
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts.length > 0) setAccount(accounts[0]);
      });

      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts.length > 0 ? accounts[0] : null);
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  // Connect wallet
  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not found! Install it first.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      setNetwork(network.name);

      // If wrong chain, request switch
      if (network.chainId !== BigInt(TARGET_CHAIN_ID)) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: TARGET_CHAIN_ID }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Chain not added → add it
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: TARGET_CHAIN_ID,
                  chainName: "Sepolia Testnet",
                  rpcUrls: ["https://sepolia.infura.io/v3/YOUR_INFURA_KEY"],
                  nativeCurrency: {
                    name: "Ethereum",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
              ],
            });
          }
        }
      }
    } catch (err) {
      console.error("Error connecting wallet:", err);
    }
  }

  return (
    <button
      onClick={connectWallet}
      className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
    >
      {account
        ? `${account.slice(0, 6)}...${account.slice(-4)}`
        : "Connect Wallet"}
    </button>
  );
}
