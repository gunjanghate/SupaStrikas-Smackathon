'use client';

import { useState, useEffect, Suspense } from 'react';
import { getTicketContract } from '@/lib/contract';
import { ethers } from 'ethers';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type Ticket = {
  tokenURI: string;
  isClaimed: boolean;
};

type TicketMetadata = {
  name: string;
  image: string;
  description?: string;
  attributes?: { trait_type: string; value: string }[];
};

type TicketData = Ticket & {
  owner: string;
  metadata: TicketMetadata;
};

// Update this to match Sepolia testnet
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // Sepolia testnet chain ID

function VerifyTicketContent() {
  const [tokenId, setTokenId] = useState('');
  const [manualTokenId, setManualTokenId] = useState('');
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [status, setStatus] = useState('');
  const [isClaimed, setIsClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);

  const searchParams = useSearchParams();

  // Enhanced error parsing function
  const parseError = (error: any): string => {
    const errorString = error?.message || error?.toString() || '';
    
    if (errorString.includes('Already claimed') || errorString.includes('already claimed')) {
      return 'This ticket has already been claimed and verified.';
    }
    
    if (errorString.includes('Token does not exist') || errorString.includes('ERC721: invalid token ID')) {
      return 'This ticket does not exist or has been burned.';
    }
    
    if (errorString.includes('insufficient funds')) {
      return 'Insufficient funds to complete this transaction.';
    }
    
    if (errorString.includes('user rejected transaction') || errorString.includes('user denied')) {
      return 'Transaction was cancelled by user.';
    }
    
    if (errorString.includes('network')) {
      return 'Network connection error. Please check your connection and try again.';
    }
    
    if (errorString.includes('Contract not deployed')) {
      return 'Smart contract not found on this network. Please switch to the correct network.';
    }
    
    if (errorString.includes('execution reverted')) {
      const reasonMatch = errorString.match(/reason="([^"]+)"/);
      if (reasonMatch && reasonMatch[1]) {
        const reason = reasonMatch[1];
        if (reason.includes('Already claimed')) {
          return 'This ticket has already been claimed and verified.';
        }
        return `Transaction failed: ${reason}`;
      }
      return 'Transaction was rejected by the smart contract.';
    }
    
    return errorString || 'An unexpected error occurred. Please try again.';
  };

  // Function to switch to Sepolia
  const switchToSepolia = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }
      
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      setCurrentChainId(SEPOLIA_CHAIN_ID);
      setStatus('✅ Switched to Sepolia testnet');
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: "Sepolia test network",
                rpcUrls: ["https://sepolia.infura.io/v3/", "https://rpc.sepolia.org"],
                nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
          setCurrentChainId(SEPOLIA_CHAIN_ID);
          setStatus('✅ Added and switched to Sepolia testnet');
        } catch (addError) {
          setStatus("❌ Failed to add Sepolia testnet. Please add it manually in MetaMask.");
        }
      } else {
        setStatus("❌ Failed to switch to Sepolia. Please switch manually in MetaMask.");
      }
    }
  };

  // Check current network on component mount
  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          const chainId = `0x${network.chainId.toString(16)}`;
          setCurrentChainId(chainId);
        } catch (error) {
          console.error('Failed to check network:', error);
        }
      }
    };
    
    checkNetwork();
  }, []);

  useEffect(() => {
    const urlTokenId = searchParams.get('tokenId');
    if (urlTokenId) {
      setTokenId(urlTokenId);
      handleVerify(urlTokenId);
    } else {
      setShowManualInput(true);
    }
  }, [searchParams]);

  const handleVerify = async (id?: string) => {
    console.log('🔍 Starting verification process...');
    setIsLoading(true);
    setStatus('🔍 Verifying ticket...');
    setTicketData(null);
    
    try {
      const tokenToVerify = id ?? manualTokenId;
      console.log('🎫 Token to verify:', tokenToVerify);
      
      if (!tokenToVerify || tokenToVerify.trim() === '') {
        setStatus('❌ Please enter a valid Token ID.');
        return;
      }
      
      if (!window.ethereum) {
        setStatus('❌ MetaMask not found. Please install MetaMask to verify tickets.');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = `0x${network.chainId.toString(16)}`;
      setCurrentChainId(chainId);

      if (chainId !== SEPOLIA_CHAIN_ID) {
        setStatus('⚠️ Please switch to Sepolia testnet to verify tickets.');
        return;
      }

      const signer = await provider.getSigner();
      const contract = getTicketContract(signer);

      // Verify contract deployment
      const code = await provider.getCode(contract.target);
      if (code === "0x") {
        throw new Error(`Smart contract not deployed on this network.`);
      }

      setStatus('📋 Fetching ticket information...');

      // Check if token exists and get data
      const owner: string = await contract.ownerOf(Number(tokenToVerify));
      const tokenURI: string = await contract.tokenURI(Number(tokenToVerify));
      
      let isClaimed: boolean = false;
      try {
        isClaimed = await contract.isClaimed(Number(tokenToVerify));
      } catch (error) {
        console.log('isClaimed function not available, assuming false');
      }

      setStatus('🌐 Loading metadata...');
      
      const metaRes = await fetch(tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/'));
      if (!metaRes.ok) {
        throw new Error('Failed to load ticket metadata from IPFS');
      }
      
      const metadata: TicketMetadata = await metaRes.json();

      const ticketData = { owner, metadata, tokenURI, isClaimed };
      setTicketData(ticketData);
      setIsClaimed(isClaimed);

      if (!id) setTokenId(tokenToVerify);

      const finalStatus = isClaimed ? 
        '✅ Ticket Already Claimed - Entry Allowed' : 
        '🎫 Valid Ticket - Ready to Claim';
      setStatus(finalStatus);
      
    } catch (err) {
      console.error('💥 Verification error:', err);
      const friendlyError = parseError(err);
      setStatus(`❌ ${friendlyError}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    console.log('🎟️ Starting claim process...');
    setIsClaimLoading(true);
    
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = `0x${network.chainId.toString(16)}`;

      if (chainId !== SEPOLIA_CHAIN_ID) {
        setStatus('⚠️ Please switch to Sepolia testnet to claim tickets.');
        await switchToSepolia();
        return;
      }

      const signer = await provider.getSigner();
      const contract = getTicketContract(signer);

      setStatus('🔄 Processing claim...');
      
      const tx = await contract.claimTicket(Number(tokenId));
      setStatus('⏳ Confirming transaction...');
      
      await tx.wait();

      // Update database
      try {
        await fetch(`/api/tickets/${tokenId}/claim`, { method: 'PATCH' });
      } catch (dbError) {
        console.warn('Database sync failed, but blockchain claim succeeded');
      }

      setIsClaimed(true);
      setStatus('🎉 Ticket Claimed Successfully - Entry Allowed!');
      
      // Update ticket data
      if (ticketData) {
        setTicketData({ ...ticketData, isClaimed: true });
      }
      
    } catch (err) {
      console.error('💥 Claim error:', err);
      const friendlyError = parseError(err);
      setStatus(`❌ Claim failed: ${friendlyError}`);
    } finally {
      setIsClaimLoading(false);
    }
  };

  const getStatusColor = () => {
    if (status.includes('✅') || status.includes('🎉')) return 'text-green-600 bg-green-50 border-green-200';
    if (status.includes('❌')) return 'text-red-600 bg-red-50 border-red-200';
    if (status.includes('⚠️')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (status.includes('🔄') || status.includes('⏳')) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-indigo-600 bg-indigo-50 border-indigo-200';
  };

  const getStatusIcon = () => {
    if (status.includes('✅') || status.includes('🎉')) return '🎉';
    if (status.includes('❌')) return '⚠️';
    if (status.includes('⚠️')) return '⚠️';
    if (status.includes('🔄') || status.includes('⏳')) return '⏳';
    return '🔍';
  };

  const resetVerification = () => {
    setTokenId('');
    setManualTokenId('');
    setTicketData(null);
    setStatus('');
    setIsClaimed(false);
    setShowManualInput(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-300/5 via-blue-600/10 to-blue-600/5"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-pink-500/20 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-purple-500/20 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-blue-400/10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <div className="backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <motion.span
                  className="text-4xl"
                  animate={{ rotate: [-15, 15, -15] }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                >
                  🎫
                </motion.span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Ticket Verification
                </h1>
                <p className="text-gray-600 text-sm">Secure NFT ticket validation</p>
              </div>
            </div>
            
            {ticketData && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetVerification}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors duration-200"
              >
                Verify Another
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Network Status */}
        {currentChainId && currentChainId !== SEPOLIA_CHAIN_ID && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-yellow-800">Wrong Network</h3>
                  <p className="text-sm text-yellow-700">Please switch to Sepolia testnet</p>
                </div>
              </div>
              <button
                onClick={switchToSepolia}
                className="px-4 py-2 bg-yellow-200 text-yellow-800 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
              >
                Switch Network
              </button>
            </div>
          </motion.div>
        )}

        {/* Manual Input Section */}
        {showManualInput && !tokenId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-purple-200 shadow-lg"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Enter Token ID to Verify
              </h2>
              <p className="text-gray-600">Please enter the NFT token ID you want to verify</p>
            </div>
            
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="text"
                value={manualTokenId}
                onChange={(e) => setManualTokenId(e.target.value)}
                placeholder="Enter Token ID (e.g., 1, 2, 3...)"
                className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:outline-none transition-colors font-mono"
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleVerify()}
                disabled={isLoading || !manualTokenId.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Status Display */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-8 p-6 rounded-2xl border-2 ${getStatusColor()} transition-all duration-300`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{getStatusIcon()}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Verification Status</h3>
                  <p className="font-semibold text-xl mt-1">{status}</p>
                  {(isLoading || isClaimLoading) && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm opacity-75">Processing...</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token ID Display */}
        {tokenId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-white/70 backdrop-blur-sm rounded-2xl border-2 hover:border-purple-700 border-t-indigo-600 border-purple-600 border-b-purple-600 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Verifying Token ID
                </h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mt-1">
                  #{tokenId}
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🔢</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Ticket Data Display */}
        <AnimatePresence>
          {ticketData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/70 backdrop-blur-sm rounded-3xl border border-purple-200 shadow-xl overflow-hidden"
            >
              {ticketData.metadata?.image && (
                <div className="relative h-64 bg-gradient-to-r from-purple-400 to-indigo-500">
                  <Image
                    src={ticketData.metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')}
                    alt="Ticket Image"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-6 text-white">
                    <h2 className="text-3xl font-bold mb-2">{ticketData.metadata.name}</h2>
                    {ticketData.metadata.description && (
                      <p className="text-white/80 text-lg">{ticketData.metadata.description}</p>
                    )}
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isClaimed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {isClaimed ? '✅ Claimed' : '🟡 Unclaimed'}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-8">
                {!ticketData.metadata?.image && (
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                      {ticketData.metadata.name}
                    </h2>
                    {ticketData.metadata.description && (
                      <p className="text-gray-600 text-lg">{ticketData.metadata.description}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600">👤</span>
                      </div>
                      <h3 className="font-semibold text-gray-800">Owner</h3>
                    </div>
                    <p className="text-sm text-gray-600 font-mono bg-white px-3 py-2 rounded-lg border">
                      {ticketData.owner.slice(0, 10)}...{ticketData.owner.slice(-10)}
                    </p>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="text-indigo-600">📋</span>
                      </div>
                      <h3 className="font-semibold text-gray-800">Status</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{isClaimed ? '✅' : '🟡'}</span>
                      <span className="font-semibold text-lg">
                        {isClaimed ? 'Entry Allowed' : 'Ready to Claim'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attributes */}
                {ticketData.metadata.attributes && ticketData.metadata.attributes.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {ticketData.metadata.attributes.map((attr, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-xs text-gray-500 uppercase font-medium">{attr.trait_type}</p>
                          <p className="text-sm font-semibold text-gray-800">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Claim Button */}
                {!isClaimed && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClaim}
                    disabled={isClaimLoading}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-white text-lg transition-all duration-300 ${
                      isClaimLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 hover:shadow-xl shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-3">
                      {isClaimLoading && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      )}
                      <span>{isClaimLoading ? 'Claiming Ticket...' : '🎫 Claim Ticket for Entry'}</span>
                    </div>
                  </motion.button>
                )}

                {/* Verification Badge */}
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">✓</span>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-green-800">Verified NFT Ticket</p>
                      <p className="text-sm text-green-600">Blockchain authenticated on Ethereum Sepolia</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {!ticketData && !status && tokenId && isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ticket information...</p>
          </motion.div>
        )}

        {/* Empty State */}
        {!tokenId && !showManualInput && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎫</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Verify</h2>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Enter a token ID or scan a QR code to verify your NFT ticket.
            </p>
            <button
              onClick={() => setShowManualInput(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
            >
              Start Verification
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function VerifyTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading verification system...</p>
          </div>
        </div>
      }
    >
      <VerifyTicketContent />
    </Suspense>
  );
}