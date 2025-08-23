'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
type EventData = {
  _id: string;
  eventName: string;
  date: string;
  venue: string;
  description: string;
  image: string;
  price: string;
  maxTickets: number;
  mintedCount: number;
  organizerWallet: string;
  verifiedOrganizer: boolean;
  isActive: boolean;
  createdAt: string;
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const eventData = await response.json();
        setEvents(eventData);
      } catch (err) {
        console.error("Failed to load events from API", err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Loading skeleton component
  const EventSkeleton = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden w-full max-w-md mx-auto"
    >
      <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/60 backdrop-blur-xl border border-neutral-700/30 rounded-2xl p-6 shadow-2xl">
        <div className="animate-pulse space-y-4">
          <div className="bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 rounded-xl h-48 w-full"></div>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 h-6 rounded-lg w-3/4"></div>
            <div className="bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 h-4 rounded w-full"></div>
            <div className="bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 h-4 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const EventCard = ({ event, index }: { event: EventData; index: number }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Format the image URL if it's IPFS
    const imageUrl = event.image?.startsWith('ipfs://')
      ? event.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
      : event.image;

    // Format date
    const formatDate = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    // Calculate availability
    const availableTickets = event.maxTickets - event.mintedCount;
    const isFullyBooked = availableTickets <= 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.6,
          delay: index * 0.1,
          ease: "easeOut"
        }}
        whileHover={{
          y: -8,
          scale: 1.02,
          transition: { duration: 0.3 }
        }}
        className="group relative overflow-hidden cursor-pointer rounded-2xl max-w-md mx-auto"
      >
        {/* Glowing background effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>

        {/* Main card */}
        <div className="relative bg-gradient-to-br from-neutral-900/95 to-neutral-800/80 backdrop-blur-xl border border-neutral-700/40 rounded-2xl overflow-hidden shadow-2xl group-hover:shadow-3xl transition-all duration-500">

          {/* Decorative top gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          {/* Status badges */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            {event.verifiedOrganizer && (
              <motion.div
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
              >
                ✓ Verified
              </motion.div>
            )}
            {isFullyBooked && (
              <motion.div
                className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                Sold Out
              </motion.div>
            )}
          </div>

          <div className="p-6">
            {/* Image container */}
            <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-700">
              {!imageError && imageUrl ? (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 animate-pulse rounded-xl"></div>
                  )}
                  <motion.img
                    src={imageUrl}
                    alt={event.eventName}
                    className={`w-full h-48 object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                </>
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center">
                  <div className="text-center text-neutral-400">
                    <div className="text-4xl mb-2">🎪</div>
                    <div className="text-sm font-medium">Event Image</div>
                  </div>
                </div>
              )}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Title */}
              <motion.h2
                className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300 line-clamp-2"
                whileHover={{ x: 2 }}
              >
                {event.eventName}
              </motion.h2>

              {/* Event Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                  <span className="text-indigo-400">📅</span>
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                  <span className="text-purple-400">📍</span>
                  <span>{event.venue}</span>
                </div>
              </div>

              {/* Price and Availability */}
              <div className="flex items-center justify-between gap-4">
                <motion.div
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-900/50 to-emerald-900/50 text-green-300 px-4 py-2 rounded-full text-sm font-semibold shadow-sm border border-green-600/30"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.15)"
                  }}
                >
                  <motion.div
                    className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  ></motion.div>
                  🎟️ {event.price} ETH
                </motion.div>

                <motion.div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border ${isFullyBooked
                    ? 'bg-gradient-to-r from-red-900/50 to-rose-900/50 text-red-300 border-red-600/30'
                    : availableTickets <= 5
                      ? 'bg-gradient-to-r from-orange-900/50 to-amber-900/50 text-orange-300 border-orange-600/30'
                      : 'bg-gradient-to-r from-blue-900/50 to-indigo-900/50 text-blue-300 border-blue-600/30'
                    }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {availableTickets}/{event.maxTickets} left
                </motion.div>
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-neutral-300 text-sm leading-relaxed line-clamp-2 group-hover:text-neutral-200 transition-colors duration-300">
                  {event.description}
                </p>
              )}

              {/* Bottom section */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-700/50">
                {/* Event ID Badge */}
                <motion.div
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-neutral-800 to-neutral-700 text-neutral-300 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-neutral-600/30"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 4px 12px rgba(107, 114, 128, 0.15)"
                  }}
                >
                  <motion.div
                    className="w-2 h-2 bg-gradient-to-r from-neutral-500 to-neutral-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  ></motion.div>
                  Event ID: {event._id.slice(-6)}
                </motion.div>

                {/* Event icon */}
                <motion.div
                  className="text-2xl"
                  whileHover={{
                    scale: 1.2,
                    rotate: [0, -10, 10, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  🎪
                </motion.div>
              </div>

              {/* View/Mint Ticket Button */}
              <motion.button
                className={`w-full px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group/btn ${isFullyBooked || !event.isActive
                  ? 'bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  }`}
                onClick={() => {
                  if (!isFullyBooked && event.isActive) {
                    router.push(`/mint?eventId=${event._id}`);
                  }
                }}
                whileHover={!isFullyBooked && event.isActive ? { scale: 1.02 } : {}}
                whileTap={!isFullyBooked && event.isActive ? { scale: 0.98 } : {}}
                disabled={isFullyBooked || !event.isActive}
              >
                {/* Button background animation */}
                {!isFullyBooked && event.isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                )}

                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isFullyBooked ? 'Sold Out' : !event.isActive ? 'Event Inactive' : 'Mint Ticket'}
                  {!isFullyBooked && event.isActive && (
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  )}
                </span>
              </motion.button>

            </div>
          </div>

          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pt-36 bg-black p-6 flex flex-col justify-center items-center px-12 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-300/5 via-blue-600/10 to-blue-600/5"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-pink-500/20 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-purple-500/20 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-blue-400/10 rounded-full blur-3xl"></div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.div
            className="text-4xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎫
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            All Available Events
          </h1>
        </div>
        <p className="text-neutral-400 text-lg">
          Discover amazing events and mint your tickets on the blockchain
        </p>
      </motion.div>

      {/* Events Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[1, 2, 3].map((i) => (
              <EventSkeleton key={i} />
            ))}
          </motion.div>
        ) : events.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <motion.div
              className="text-8xl mb-6"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🎪
            </motion.div>
            <h3 className="text-3xl font-bold text-white mb-4">No Events Found</h3>
            <p className="text-neutral-400 max-w-md mx-auto text-lg">
              No events are currently available. Check back soon for exciting new events!
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="events"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {events.map((event, index) => (
              <EventCard
                key={event._id}
                event={event}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions and Disclaimers Footer */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-16 w-full max-w-7xl space-y-8"
      >
        {/* Instructions Section */}
        <div className="bg-gradient-to-br from-neutral-900/60 to-neutral-800/40 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="text-3xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              📖
            </motion.div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              How to Use MintMyTicket
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Connect Your Wallet</h3>
                  <p className="text-neutral-400 text-sm">Connect your MetaMask or compatible Web3 wallet to interact with the platform.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Browse Events</h3>
                  <p className="text-neutral-400 text-sm">Explore available events and check details like date, venue, and ticket availability.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Mint Your Ticket</h3>
                  <p className="text-neutral-400 text-sm">Click "Mint Ticket" to purchase your NFT ticket with ETH on the Sepolia testnet.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-rose-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Receive NFT Ticket</h3>
                  <p className="text-neutral-400 text-sm">Your ticket will be minted as an NFT and stored in your wallet for verification.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  5
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Verify at Event</h3>
                  <p className="text-neutral-400 text-sm">Use the verification system to claim your ticket and gain entry to the event.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-yellow-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  6
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Manage Your Tickets</h3>
                  <p className="text-neutral-400 text-sm">View all your tickets in "Your Tickets" section and track their status.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Information */}
        <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-600/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🌐</span>
            <h3 className="text-xl font-bold text-blue-300">Network Information</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-300"><span className="font-semibold text-blue-300">Network:</span> Ethereum Sepolia Testnet</p>
              <p className="text-neutral-300"><span className="font-semibold text-blue-300">Chain ID:</span> 11155111</p>
            </div>
            <div>
              <p className="text-neutral-300"><span className="font-semibold text-blue-300">Currency:</span> SepoliaETH (Test ETH)</p>
              <p className="text-neutral-300"><span className="font-semibold text-blue-300">Gas Fees:</span> Required for transactions</p>
            </div>
          </div>
        </div>

        {/* Disclaimers */}
        <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/20 border border-yellow-600/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-xl font-bold text-yellow-300">Important Disclaimers</h3>
          </div>

          <div className="space-y-3 text-sm text-neutral-300">
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <p><span className="font-semibold text-yellow-300">Testnet Only:</span> This platform operates on the Sepolia testnet. Transactions use test ETH with no real monetary value.</p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <p><span className="font-semibold text-yellow-300">Beta Platform:</span> This is a demonstration platform. Features may be experimental and subject to changes.</p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <p><span className="font-semibold text-yellow-300">Wallet Security:</span> Always verify transaction details before confirming. Never share your private keys or seed phrases.</p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <p><span className="font-semibold text-yellow-300">Event Verification:</span> Only verified organizers can create events. Look for the verified checkmark on event cards.</p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <p><span className="font-semibold text-yellow-300">No Refunds:</span> NFT ticket purchases are final. Please ensure event details are correct before minting.</p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <p><span className="font-semibold text-yellow-300">Technical Requirements:</span> A Web3 wallet (MetaMask recommended) and Sepolia testnet setup are required.</p>
            </div>
          </div>
        </div>

        {/* Support and Links */}
        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/20 border border-purple-600/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🛠️</span>
            <h3 className="text-xl font-bold text-purple-300">Support & Resources</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-purple-300 mb-2">Get Test ETH</h4>
              <p className="text-neutral-400">Visit Sepolia faucets to get free test ETH for transactions.</p>
            </div>

            <div>
              <h4 className="font-semibold text-purple-300 mb-2">MetaMask Setup</h4>
              <p className="text-neutral-400">Add Sepolia network to your MetaMask wallet for seamless interaction.</p>
            </div>

            <div>
              <h4 className="font-semibold text-purple-300 mb-2">Need Help?</h4>
              <p className="text-neutral-400">Check our documentation or contact support for assistance.</p>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}