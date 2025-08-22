

'use client';

import * as React from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWeb3 } from "@/context/Web3Context";
import Image from "next/image";
import { getTicketContract } from "@/lib/contract";
import { ethers } from "ethers";
import { QRCodeCanvas } from "qrcode.react";

type Ticket = {
  _id: string;
  eventId: string;
  tokenId: number;
  tokenURI: string;
  txHash: string;
  ownerWallet: string;
  isClaimed: boolean; // Track if ticket is claimed
  claimedAt?: string; // When it was claimed
  proofOfAttendanceNFT?: {
    tokenId: number;
    txHash: string;
    claimedAt: string;
  };
};

type Metadata = {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
};

const YourTicketPage = () => {
  const { address, isConnected } = useWeb3();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metadataMap, setMetadataMap] = useState<Record<number, Metadata>>({});
  const [loading, setLoading] = useState(true);
  const [transferringId, setTransferringId] = useState<number | null>(null);
  const [transferTo, setTransferTo] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [showQR, setShowQR] = useState<Record<number, boolean>>({});
  const [claimingId, setClaimingId] = useState<number | null>(null);
    const [resaleId, setResaleId] = useState<number | null>(null);
  const [resalePrice, setResalePrice] = useState<string>("");
  const [resaleStatus, setResaleStatus] = useState<string>("");

  // Sample claimed tickets data for demonstration
  const sampleClaimedTickets = [
    {
      tokenId: 1001,
      isClaimed: true,
      claimedAt: "2025-08-20T14:30:00Z",
      proofOfAttendanceNFT: {
        tokenId: 5001,
        txHash: "0x742d35cc6330c0532c769396dfbc86bb57494c2bdcd42e9476c0a8964b2c7e4f",
        claimedAt: "2025-08-20T14:30:00Z"
      }
    },
    {
      tokenId: 1002,
      isClaimed: true,
      claimedAt: "2025-08-21T16:45:00Z",
      proofOfAttendanceNFT: {
        tokenId: 5002,
        txHash: "0x853e46dd7621c1743d758734f86e8da6e842b7a5e97a1b2c8b3d4e5f6789abcd",
        claimedAt: "2025-08-21T16:45:00Z"
      }
    }
  ];
    // List ticket for resale
  const listTicketForResale = async (tokenId: number, price: string) => {
    try {
      setResaleStatus("Listing for resale...");
      if (!window.ethereum) throw new Error("MetaMask not found.");
      if (!price || isNaN(Number(price)) || Number(price) <= 0) throw new Error("Invalid price");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getTicketContract(signer);

      // Call contract method
      const tx = await contract.listTicketForResale(tokenId, ethers.parseEther(price));
      await tx.wait();
      setResaleStatus(`✅ Ticket listed for resale! Tx: ${tx.hash.slice(0, 10)}...`);
      setTimeout(() => {
        setResaleId(null);
        setResalePrice("");
        setResaleStatus("");
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error("Resale failed:", err);
      setResaleStatus(`❌ Failed: ${err?.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    const fetchTickets = async () => {
      if (!address) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/tickets?owner=${address}`);
        const data = await res.json();

        // Merge with sample claimed data for demonstration
        const enhancedTickets = data.map((ticket: Ticket) => {
          const claimedData = sampleClaimedTickets.find(sample =>
            sample.tokenId === ticket.tokenId
          );
          return claimedData ? { ...ticket, ...claimedData } : ticket;
        });

        setTickets(enhancedTickets);
        console.log("ticket owner:", enhancedTickets[0]?.ownerWallet);
        console.log("Address:", address);

        const metaMap: Record<number, Metadata> = {};
        await Promise.all(
          enhancedTickets.map(async (ticket: Ticket) => {
            try {
              const res = await fetch(ticket.tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"));
              const metadata = await res.json();
              metaMap[ticket.tokenId] = metadata;
              console.log(`Fetched metadata for token ${ticket.tokenId}:`, metadata);
            } catch (err) {
              console.error("Failed to fetch metadata:", err);
            }
          })
        );
        setMetadataMap(metaMap);
      } catch (err) {
        console.error("Error loading tickets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [address]);

  const handleTransfer = async (tokenId: number) => {
    try {
      setTxStatus("Transferring...");

      if (!window.ethereum) throw new Error("MetaMask not found.");
      if (!ethers.isAddress(transferTo.toLowerCase())) throw new Error("Invalid wallet address");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const contract = getTicketContract(signer);

      let owner;
      try {
        owner = await contract.ownerOf(tokenId);
      } catch (err) {
        console.error("Error fetching owner:", err);
        setTxStatus("❌ Token does not exist or is already transferred.");
        return;
      }
      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error("You are not the owner of this ticket.");
      }

      const tx = await contract.transferFrom(signerAddress, transferTo.toLowerCase(), tokenId);
      await tx.wait();

      setTxStatus(`✅ Ticket transferred! Tx: ${tx.hash.slice(0, 10)}...`);
      setTransferringId(null);
      setTransferTo("");

      setTimeout(() => window.location.reload(), 1500);

    } catch (err: unknown) {
      console.error("Transfer failed:", err);
      if (err instanceof Error) {
        setTxStatus(`❌ Transfer failed: ${err.message}`);
      } else {
        setTxStatus("❌ Transfer failed: Unknown error");
      }
    }
  };

  const toggleQR = (tokenId: number) => {
    setShowQR(prev => ({ ...prev, [tokenId]: !prev[tokenId] }));
  };

  const handleClaimTicket = async (tokenId: number) => {
    try {
      setClaimingId(tokenId);
      setTxStatus("Processing claim...");

      // Simulate proof of attendance NFT minting
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update ticket state to claimed
      const updatedTickets = tickets.map(ticket =>
        ticket.tokenId === tokenId
          ? {
            ...ticket,
            isClaimed: true,
            claimedAt: new Date().toISOString(),
            proofOfAttendanceNFT: {
              tokenId: Math.floor(Math.random() * 9999) + 5000,
              txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
              claimedAt: new Date().toISOString()
            }
          }
          : ticket
      );

      setTickets(updatedTickets);
      setTxStatus("✅ Proof of Attendance NFT claimed successfully!");

      setTimeout(() => {
        setClaimingId(null);
        setTxStatus("");
      }, 3000);

    } catch (err: unknown) {
      console.error("Claim failed:", err);
      setTxStatus("❌ Failed to claim Proof of Attendance NFT");
      setClaimingId(null);
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
    <div className="min-h-screen bg-black p-6 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-300/5 via-blue-600/10 to-blue-600/5"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-pink-500/20 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-purple-500/20 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-blue-400/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="flex flex-col items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div>

                <h1 className="">
                  <motion.span
                    className="text-3xl"
                    style={{ display: "inline-block" }}
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                  >
                    🎫
                  </motion.span>
                  <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent ml-2">
                    Your Tickets
                  </span>
                </h1>
                <p className="text-neutral-300 mt-1 max-w-xl text-base">
                  View and manage your NFT event tickets. Here you can access your purchased tickets, transfer them to others, or verify ownership at the event. Each ticket is securely stored on the blockchain and uniquely yours.
                </p>
              </div>
            </div>
          </div>
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-neutral-900/80 to-neutral-800/60 backdrop-blur-lg px-4 py-2 rounded-full border border-purple-500/30"
            >
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-neutral-200">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Content Section */}
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
          ) : tickets.length === 0 ? (
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
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="text-8xl mb-8"
              >
                🎫
              </motion.div>
              <h3 className="text-3xl font-bold text-neutral-200 mb-4">No Tickets Yet</h3>
              <p className="text-neutral-400 max-w-md mx-auto text-lg leading-relaxed">
                You have not purchased any tickets yet. Start exploring events and get your first NFT ticket!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Browse Events
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="tickets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            >
              {tickets.map((ticket, index) => {
                const metadata = metadataMap[ticket.tokenId];
                return (
                  <motion.div
                    key={ticket._id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                    whileHover={{
                      y: -8,
                      transition: { duration: 0.3 }
                    }}
                    className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/80 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border hover:border-purple-500/50 border-neutral-700/40"
                  >
                    {/* Ticket Image */}
                    <div className="relative overflow-hidden">
                      {metadata?.image ? (
                        <Image
                          src={metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")}
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
                        {ticket.isClaimed ? (
                          <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                            🏆 Claimed
                          </span>
                        ) : (
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ticket Content */}
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                        {metadata?.name || "Loading..."}
                      </h2>
                      <p className="text-neutral-300 text-sm mb-4 line-clamp-2">
                        {metadata?.description || "Loading description..."}
                      </p>

                      {/* Proof of Attendance Section */}
                      {ticket.isClaimed && ticket.proofOfAttendanceNFT && (
                        <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-600/30 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-400">🏆</span>
                            <span className="text-sm font-semibold text-green-300">Proof of Attendance NFT</span>
                          </div>
                          <div className="text-xs text-green-400 space-y-1">
                            <p><strong>POA Token ID:</strong> #{ticket.proofOfAttendanceNFT.tokenId}</p>
                            <p><strong>Claimed:</strong> {new Date(ticket.proofOfAttendanceNFT.claimedAt).toLocaleDateString()}</p>
                            <a
                              href={`https://calibration.filfox.info/en/message/${ticket.proofOfAttendanceNFT.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-300 hover:text-green-200 underline transition-colors duration-200 block"
                            >
                              View POA Transaction →
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Ticket Details */}
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-400">Token ID:</span>
                          <span className="font-mono bg-neutral-800 text-neutral-200 px-2 py-1 rounded border border-neutral-700">
                            #{ticket.tokenId}
                          </span>
                        </div>
                        <a
                          href={`https://calibration.filfox.info/en/message/${ticket.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors duration-200 block"
                        >
                          View on Filecoin Explorer →
                        </a>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        {ticket.isClaimed ? (
                          // Claimed ticket - only show transfer button
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setTransferringId(ticket.tokenId)}
                              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                            >
                              Transfer Ticket
                            </motion.button>
                          </div>
                        ) : (
                          // Unclaimed ticket - show QR, Transfer, Claim, and Resale buttons
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => toggleQR(ticket.tokenId)}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                            >
                              {showQR[ticket.tokenId] ? "Hide QR" : "Show QR"}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setTransferringId(ticket.tokenId)}
                              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                            >
                              Transfer
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setResaleId(ticket.tokenId)}
                              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                            >
                              Set For Sale
                            </motion.button>
                          </div>
                        )}
                        {/* Resale Section */}
                        <AnimatePresence>
                          {resaleId === ticket.tokenId && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-4 border border-green-600/30 space-y-3"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-green-400">💸</span>
                                <span className="font-semibold text-green-300">List Ticket For Resale</span>
                              </div>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="Enter resale price in ETH"
                                value={resalePrice}
                                onChange={e => setResalePrice(e.target.value)}
                                className="w-full p-3 border-2 border-green-600 bg-neutral-800 text-white rounded-lg focus:border-green-400 focus:outline-none transition-colors duration-200 text-sm font-mono placeholder-neutral-400"
                              />
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => listTicketForResale(ticket.tokenId, resalePrice)}
                                  disabled={!resalePrice.trim() || isNaN(Number(resalePrice)) || Number(resalePrice) <= 0}
                                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Confirm Sale
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setResaleId(null);
                                    setResalePrice("");
                                    setResaleStatus("");
                                  }}
                                  className="px-4 py-2.5 bg-neutral-700 text-neutral-200 rounded-lg font-semibold hover:bg-neutral-600 transition-colors duration-200"
                                >
                                  Cancel
                                </motion.button>
                              </div>
                              {resaleStatus && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`p-3 rounded-lg text-sm font-medium ${resaleStatus.includes('✅')
                                    ? 'bg-green-900/50 text-green-300 border border-green-600/30'
                                    : resaleStatus.includes('❌')
                                      ? 'bg-red-900/50 text-red-300 border border-red-600/30'
                                      : 'bg-blue-900/50 text-blue-300 border border-blue-600/30'
                                    }`}
                                >
                                  {resaleStatus}
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Claim POA Button - only show when ticket is claimed */}
                        {ticket.isClaimed && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleClaimTicket(ticket.tokenId)}
                            disabled={claimingId === ticket.tokenId}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {claimingId === ticket.tokenId ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Claiming...
                              </>
                            ) : (
                              <>
                                <span>🏆</span>
                                Claim Proof of Attendance
                              </>
                            )}
                          </motion.button>
                        )}

                        {/* QR Code Section - Only for unclaimed tickets */}
                        <AnimatePresence>
                          {!ticket.isClaimed && showQR[ticket.tokenId] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="bg-gradient-to-br from-neutral-800/50 to-neutral-700/50 rounded-xl p-4 border-2 border-dashed border-neutral-600/50"
                            >
                              <div className="text-center">
                                <p className="text-sm font-semibold text-neutral-200 mb-3">
                                  🔒 Ownership Verification
                                </p>
                                <div className="bg-white p-3 rounded-lg inline-block shadow-sm">
                                  <QRCodeCanvas
                                    value={`https://MintMyTicket-self.vercel.app/verify?tokenId=${ticket.tokenId}&owner=${ticket.ownerWallet}`}
                                    size={140}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                    includeMargin
                                  />
                                </div>
                                <div className="mt-3 p-3 bg-gradient-to-r from-amber-900/50 to-orange-900/50 border border-amber-600/30 rounded-lg">
                                  <p className="text-xs text-amber-300 font-medium flex items-center gap-2">
                                    ⚠️ Security Warning
                                  </p>
                                  <p className="text-xs text-amber-400 mt-1">
                                    This QR code can only be scanned once for verification.
                                    <strong> Do not share with anyone!</strong>
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Transfer Section */}
                        <AnimatePresence>
                          {transferringId === ticket.tokenId && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="bg-gradient-to-br from-red-900/50 to-orange-900/50 rounded-xl p-4 border border-red-600/30 space-y-3"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-red-400">🔄</span>
                                <span className="font-semibold text-red-300">Transfer Ticket</span>
                              </div>

                              <input
                                type="text"
                                placeholder="Enter recipient wallet address (0x...)"
                                value={transferTo}
                                onChange={(e) => setTransferTo(e.target.value)}
                                className="w-full p-3 border-2 border-neutral-600 bg-neutral-800 text-white rounded-lg focus:border-red-400 focus:outline-none transition-colors duration-200 text-sm font-mono placeholder-neutral-400"
                              />

                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleTransfer(ticket.tokenId)}
                                  disabled={!transferTo.trim()}
                                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Confirm Transfer
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setTransferringId(null);
                                    setTransferTo("");
                                    setTxStatus("");
                                  }}
                                  className="px-4 py-2.5 bg-neutral-700 text-neutral-200 rounded-lg font-semibold hover:bg-neutral-600 transition-colors duration-200"
                                >
                                  Cancel
                                </motion.button>
                              </div>

                              {txStatus && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`p-3 rounded-lg text-sm font-medium ${txStatus.includes('✅')
                                    ? 'bg-green-900/50 text-green-300 border border-green-600/30'
                                    : txStatus.includes('❌')
                                      ? 'bg-red-900/50 text-red-300 border border-red-600/30'
                                      : 'bg-blue-900/50 text-blue-300 border border-blue-600/30'
                                    }`}
                                >
                                  {txStatus}
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default YourTicketPage;