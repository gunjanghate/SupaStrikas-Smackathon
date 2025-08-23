'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

type Web3ContextType = {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isAdmin: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
};

const ADMIN_WALLETS: string[] = (process.env.NEXT_PUBLIC_ADMIN_WALLETS ?? '')
  .split(',')
  .map((a) => a.trim().toLowerCase())
  .filter(Boolean);

const Web3Context = createContext<Web3ContextType | null>(null);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected");
      return;
    }

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (!accounts || accounts.length === 0) {
        alert("No accounts found. Please connect your wallet.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      setAddress(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      localStorage.setItem("wallet_address", accounts[0]);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setChainId(null);
    setIsConnected(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("wallet_address");
    }
  };

  // 🔄 Auto-detect account / chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAddress(accounts[0]);
        setIsConnected(true);
        localStorage.setItem("wallet_address", accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
    };

    (window.ethereum as any).on("accountsChanged", handleAccountsChanged);
    (window.ethereum as any).on("chainChanged", handleChainChanged);

    // Restore session if wallet was connected before
    window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts.length > 0) {
        handleAccountsChanged(accounts as string[]);
      }
    });
    window.ethereum.request({ method: "eth_chainId" }).then((id: string) => {
      setChainId(parseInt(id, 16));
    });

    return () => {
      (window.ethereum as any)?.removeListener("accountsChanged", handleAccountsChanged);
      (window.ethereum as any)?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const isAdmin =
    !!address && ADMIN_WALLETS.includes(address.toLowerCase());

  return (
    <Web3Context.Provider
      value={{
        address,
        chainId,
        isConnected,
        isAdmin,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
};
