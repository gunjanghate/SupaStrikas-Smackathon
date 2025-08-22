'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import Image from 'next/image';
import { getTicketContract } from '@/lib/contract';
import { ethers } from 'ethers';

type ListedTicket = {
  tokenId: number;
  resalePrice: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: { trait_type: string; value: string }[];
  };
};

export default function MarketplacePage() {
  const { address, isConnected } = useWeb3();
  const [listedTickets, setListedTickets] = useState<ListedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [txStatus, setTxStatus] = useState('');
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchListedTickets = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/marketplace', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch listed tickets');
        const listings: ListedTicket[] = await res.json();
        setListedTickets(listings);
      } catch (err: any) {
        setTxStatus(`❌ Failed to load tickets: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchListedTickets();
  }, []);

  const handleBuy = async (tokenId: number, price: string) => {
    try {
      setTxStatus('Buying ticket...');
      setError("");
      if (!window.ethereum) throw new Error('MetaMask not found.');
      if (!price || isNaN(Number(price)) || Number(price) <= 0) throw new Error('Invalid price');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getTicketContract(signer);

      const priceWei = ethers.parseEther(price);
      const tx = await contract.buyResaleTicket(tokenId, { value: priceWei });
      await tx.wait();

      setTxStatus(`✅ Ticket purchased! Tx: ${tx.hash.slice(0, 10)}...`);
      setBuyingId(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
      setTxStatus(`❌ Buy failed: ${err?.message || 'Unknown error'}`);
    }
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/80 backdrop-blur-lg rounded-2xl p-6 animate-pulse border border-neutral-700/40">
          <div className="bg-gradient-to-r from-neutral-700 to-neutral-600 rounded-xl h-48 mb-4"></div>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-neutral-700 to-neutral-600 h-6 rounded-lg w-3/4"></div>
            <div className="bg-gradient-to-r from-neutral-700 to-neutral-600 h-4 rounded w-full"></div>
            <div className="bg-gradient-to-r from-neutral-700 to-neutral-600 h-4 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-900 p-6 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-neutral-900/10"></div>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Ticket Marketplace
          </h1>
          <p className="text-neutral-300 mt-2 max-w-xl mx-auto text-base">
            Browse and buy resale tickets from other users. All transactions are secure on the blockchain with a 10% fee to the organizer.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <LoadingSkeleton />
            </motion.div>
          ) : listedTickets.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="text-8xl mb-8"
              >
                🎟️
              </motion.div>
              <h3 className="text-3xl font-bold text-neutral-200 mb-4">No Tickets Available</h3>
              <p className="text-neutral-400 max-w-md mx-auto text-lg leading-relaxed">
                No tickets are currently listed for resale. Check back later or mint new tickets!
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="tickets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            >
              {listedTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.tokenId}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/80 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border hover:border-purple-500/50 border-neutral-700/40"
                >
                  <div className="relative overflow-hidden">
                    {ticket.metadata?.image ? (
                      <Image
                        src={ticket.metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')}
                        alt="Ticket"
                        width={400}
                        height={240}
                        className="w-full h-48 object-cover transition-transform duration-500 hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                        <span className="text-6xl">🎫</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                        {ticket.resalePrice} ETH
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {ticket.metadata?.name || 'Loading...'}
                    </h2>
                    <p className="text-neutral-300 text-sm mb-4 line-clamp-2">
                      {ticket.metadata?.description || 'Loading description...'}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-400">Token ID:</span>
                        <span className="font-mono bg-neutral-800 text-neutral-200 px-2 py-1 rounded border border-neutral-700">
                          #{ticket.tokenId}
                        </span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setBuyingId(ticket.tokenId)}
                      disabled={!isConnected}
                      className={`w-full py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                        isConnected
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
                          : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                      }`}
                    >
                      Buy Now for {ticket.resalePrice} ETH
                    </motion.button>

                    <AnimatePresence>
                      {buyingId === ticket.tokenId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-4 border border-green-600/30 space-y-3 mt-3"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-400">💳</span>
                            <span className="font-semibold text-green-300">Confirm Purchase</span>
                          </div>
                          <p className="text-sm text-neutral-200">
                            You will pay {ticket.resalePrice} ETH (including 10% fee to organizer).
                          </p>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleBuy(ticket.tokenId, ticket.resalePrice)}
                              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                            >
                              Confirm Purchase
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setBuyingId(null)}
                              className="px-4 py-2.5 bg-neutral-700 text-neutral-200 rounded-lg font-semibold hover:bg-neutral-600 transition-colors duration-200"
                            >
                              Cancel
                            </motion.button>
                          </div>
                          {txStatus && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-3 rounded-lg text-sm font-medium ${
                                txStatus.includes('✅')
                                  ? 'bg-green-900/50 text-green-300 border border-green-600/30'
                                  : txStatus.includes('❌')
                                    ? 'bg-red-900/50 text-red-300 border border-red-600/30'
                                    : 'bg-blue-900/50 text-blue-300 border border-blue-600/30'
                              }`}
                            >
                              {txStatus}
                            </motion.div>
                          )}
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3 rounded-lg text-sm font-medium bg-red-900/50 text-red-300 border border-red-600/30"
                            >
                              {error}
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}