
// import { ethers } from 'ethers';
// import type { MetaMaskInpageProvider } from '@metamask/providers';

// declare global {
//   interface Window {
//     ethereum?: MetaMaskInpageProvider;
//   }
// }

// export async function connectWallet() {
//   if (typeof window.ethereum === 'undefined') {
//     alert('MetaMask is not installed!');
//     return null;
//   }

//   try {
//     const provider = new ethers.BrowserProvider(window.ethereum); // ethers v6
//     await provider.send("eth_requestAccounts", []);
//     const signer = await provider.getSigner();
//     const address = await signer.getAddress();

//     return { provider, signer, address };
//   } catch (error) {
//     console.error('Wallet connection failed:', error);
//     return null;
//   }
// }

// export async function getBalance(address: string) {
//   if (typeof window.ethereum === 'undefined') {
//     alert('MetaMask is not installed!');
//     return null;
//   }

//   try {
//     const provider = new ethers.BrowserProvider(window.ethereum);
//     const balance = await provider.getBalance(address);
//     // Convert balance from wei to ether
//     return ethers.formatEther(balance);
//   } catch (error) {
//     console.error('Failed to get balance:', error);
//     return null;
//   }
// }
// lib/wallet.ts
import { ethers } from "ethers";
import type { Eip1193Provider } from "ethers"; // v6 EIP-1193 type

type MaybeWindowEthereum = Eip1193Provider & {
  providers?: Eip1193Provider[];
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
};

declare global {
  interface Window {
    ethereum?: MaybeWindowEthereum;
  }
}

export const SEPOLIA = {
  chainIdHex: "0xaa36a7", // 11155111 in hex
  chainIdDec: 11155111,
  chainName: "Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.sepolia.org"], // hackathon/public RPC is fine
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

function pickInjected(): Eip1193Provider | null {
  const eth = window.ethereum as MaybeWindowEthereum | undefined;
  if (!eth) return null;

  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    const metamask = eth.providers.find((p: any) => p.isMetaMask);
    if (metamask) return metamask as Eip1193Provider;
    return eth.providers[0] as Eip1193Provider;
  }
  return eth as Eip1193Provider;
}

export async function ensureSepolia(eth: Eip1193Provider) {
  try {
    await eth.request?.({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA.chainIdHex }],
    });
  } catch (err: any) {
    if (err?.code === 4902) {
      await eth.request?.({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SEPOLIA.chainIdHex,
            chainName: SEPOLIA.chainName,
            nativeCurrency: SEPOLIA.nativeCurrency,
            rpcUrls: SEPOLIA.rpcUrls,
            blockExplorerUrls: SEPOLIA.blockExplorerUrls,
          },
        ],
      });
      await eth.request?.({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA.chainIdHex }],
      });
    } else {
      throw err;
    }
  }
}

export async function connectWallet() {
  const injected = pickInjected();
  if (!injected) {
    alert("No injected wallet found. Please install MetaMask or Coinbase Wallet.");
    return null;
  }

  await ensureSepolia(injected);

  await injected.request?.({ method: "eth_requestAccounts" });

  const provider = new ethers.BrowserProvider(injected);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  if (chainId !== SEPOLIA.chainIdDec) {
    throw new Error("Please switch to Sepolia and try again.");
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address, chainId };
}

export async function getBalance(address: string) {
  const injected = pickInjected();
  if (!injected) {
    alert("No injected wallet found.");
    return null;
  }
  const provider = new ethers.BrowserProvider(injected);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

export function getExplorerBaseUrl(chainId?: number) {
  return chainId === SEPOLIA.chainIdDec
    ? "https://sepolia.etherscan.io"
    : "https://etherscan.io";
}
