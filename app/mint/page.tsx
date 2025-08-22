'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MintFormTicket from '../components/MintFormTicket';
import { FormData } from '@/types';

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

export default function MintPage() {
  const [formData, setFormData] = useState<FormData>({
    eventId: '',
    eventName: '',
    eventDate: '',
    venue: '',
    seatNumber: '',
    price: '',
    bannerImage: null,
    tokenURI: '',
  });

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadEventData = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
          setError('No event ID provided');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/events/${eventId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setNotFound(true);
          } else {
            setError('Failed to fetch event data');
          }
          setLoading(false);
          return;
        }

        const event: EventData = await response.json();
        setEventData(event);

        // Format the image URL if it's IPFS
        const imageUrl = event.image?.startsWith('ipfs://')
          ? event.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
          : event.image;

        // Populate form data with event information
        setFormData({
          eventId: event._id,
          eventName: event.eventName,
          eventDate: event.date,
          venue: event.venue,
          seatNumber: '', // This will be filled by user
          price: event.price,
          bannerImage: imageUrl,
          tokenURI: '',
        });

      } catch (error) {
        console.error("Failed to load event data", error);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };


    loadEventData();
  }, []);
  const [availableTickets, setAvailableTickets] = useState(0);

  useEffect(() => {
    if (eventData) {
      setAvailableTickets(eventData.maxTickets - eventData.mintedCount);
    }
  }, [eventData]);
  const isFullyBooked = availableTickets <= 0;
  const isEventActive = eventData?.isActive;


  const LoadingScreen = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black flex items-center justify-center p-6 relative"
    >
      {/* Dark background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/20 via-neutral-800/10 to-neutral-700/20"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>

      <div className="text-center relative z-10">
        <motion.div
          className="text-6xl mb-6"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🎫
        </motion.div>
        <motion.h2
          className="text-2xl font-bold text-white mb-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading Event Details...
        </motion.h2>
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );

  // Error component
  const ErrorScreen = ({ message, icon }: { message: string; icon: string }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-black flex items-center justify-center p-6 relative"
    >
      {/* Dark background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/20 via-neutral-800/10 to-neutral-700/20"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-2xl"></div>

      <motion.div
        className="text-center bg-gradient-to-br from-neutral-900/90 to-neutral-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-neutral-700/40 max-w-md relative z-10"
        whileHover={{ scale: 1.02 }}
      >
        <motion.div
          className="text-6xl mb-6"
          animate={{
            rotate: [0, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {icon}
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-4">Oops!</h2>
        <p className="text-neutral-300 mb-6">{message}</p>
        <motion.button
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => window.history.back()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Go Back
        </motion.button>
      </motion.div>
    </motion.div>
  );

  if (loading) return <LoadingScreen />;
  if (notFound) return <ErrorScreen message="Event not found. Please check the event ID and try again." icon="🔍" />;
  if (error) return <ErrorScreen message={error} icon="⚠️" />;



  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-black pt-20 relative"
      >
        {/* Dark background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/20 via-neutral-800/10 to-neutral-700/20"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-3xl"></div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className=" backdrop-blur-xl border-b border-neutral-700/50 sticky top-0 z-10"
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between flex-col gap-4 md:gap-1 md:flex-row">
              <div className="flex items-center gap-4">
                <motion.button
                  className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors duration-300"
                  onClick={() => window.history.back()}
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.span
                    className="text-xl"
                    whileHover={{ x: -2 }}
                  >
                    ←
                  </motion.span>
                  Back to Events
                </motion.button>
                <div className="w-px h-6 bg-neutral-600"></div>
                <div className="flex items-center gap-3">
                  <motion.div
                    className="text-2xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    🎫
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      Mint Your Ticket
                    </h1>
                    <p className="text-sm text-neutral-400">Secure your spot on the blockchain</p>
                  </div>
                </div>
              </div>

              {/* Status badges */}
              {eventData && (
                <div className="flex items-center gap-2">
                  {eventData.verifiedOrganizer && (
                    <motion.div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                    >
                      ✓ Verified Organizer
                    </motion.div>
                  )}
                  {isFullyBooked ? (
                    <motion.div
                      className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      🚫 Sold Out
                    </motion.div>
                  ) : (
                    <motion.div
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg ${availableTickets <= 5
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                        }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      🎟️ {availableTickets} tickets left
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Event Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl sticky top-32 border border-neutral-700/40 hover:border-purple-500/50 transition-all duration-300">
                {/* Event Image */}
                <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-700">
                  {formData.bannerImage ? (
                    <motion.img
                      src={formData.bannerImage}
                      alt={formData.eventName}
                      className="w-full h-48 object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center">
                      <div className="text-center text-neutral-400">
                        <div className="text-4xl mb-2">🎪</div>
                        <div className="text-sm font-medium">Event Image</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">
                      {formData.eventName}
                    </h2>
                    {eventData?.description && (
                      <p className="text-neutral-300 text-sm leading-relaxed">
                        {eventData.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <motion.div
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-neutral-800/50 to-neutral-700/50 rounded-xl border border-neutral-600/30"
                      whileHover={{ scale: 1.02 }}
                    >
                      <span className="text-indigo-400 text-lg">📅</span>
                      <div>
                        <div className="text-sm font-medium text-white">Event Date</div>
                        <div className="text-sm text-neutral-300">
                          {new Date(formData.eventDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-neutral-800/50 to-neutral-700/50 rounded-xl border border-neutral-600/30"
                      whileHover={{ scale: 1.02 }}
                    >
                      <span className="text-purple-400 text-lg">📍</span>
                      <div>
                        <div className="text-sm font-medium text-white">Venue</div>
                        <div className="text-sm text-neutral-300">{formData.venue}</div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl border border-green-600/30"
                      whileHover={{ scale: 1.02 }}
                    >
                      <span className="text-green-400 text-lg">💰</span>
                      <div>
                        <div className="text-sm font-medium text-white">Ticket Price</div>
                        <div className="text-lg font-bold text-green-300">{formData.price} ETH</div>
                      </div>
                    </motion.div>

                    {eventData && (
                      <motion.div
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl border border-blue-600/30"
                        whileHover={{ scale: 1.02 }}
                      >
                        <span className="text-blue-400 text-lg">🎟️</span>
                        <div>
                          <div className="text-sm font-medium text-white">Availability</div>
                          <div className="text-sm text-neutral-300">
                            {eventData.mintedCount} minted / {eventData.maxTickets} total
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mint Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-neutral-700/40">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    className="text-3xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    ⚡
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Mint Your NFT Ticket</h2>
                    <p className="text-neutral-300">Fill in your details to mint your blockchain ticket</p>
                  </div>
                </div>

                {!isEventActive ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 bg-gradient-to-r from-red-900/30 to-rose-900/30 rounded-xl border border-red-600/30"
                  >
                    <div className="text-4xl mb-4">⏸️</div>
                    <h3 className="text-xl font-bold text-red-300 mb-2">Event Inactive</h3>
                    <p className="text-red-400">This event is currently not accepting new ticket mints.</p>
                  </motion.div>
                ) : isFullyBooked ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 bg-gradient-to-r from-red-900/30 to-rose-900/30 rounded-xl border border-red-600/30"
                  >
                    <div className="text-4xl mb-4">🎫</div>
                    <h3 className="text-xl font-bold text-red-300 mb-2">Event Sold Out</h3>
                    <p className="text-red-400">All tickets for this event have been minted.</p>
                  </motion.div>
                ) : (
                  <MintFormTicket formData={formData} setFormData={setFormData} />
                  // <div>Mint Form</div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Debug Info (Development Only) */}
          {/* {process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 bg-gray-900 text-green-400 p-6 rounded-2xl shadow-2xl font-mono text-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔧</span>
                <h3 className="font-bold">Development Debug Info</h3>
              </div>
              <details>
                <summary className="cursor-pointer hover:text-green-300 mb-2">Form Data</summary>
                <pre className="whitespace-pre-wrap bg-gray-800 p-4 rounded-xl overflow-auto">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </details>
              {eventData && (
                <details className="mt-4">
                  <summary className="cursor-pointer hover:text-green-300 mb-2">Event Data</summary>
                  <pre className="whitespace-pre-wrap bg-gray-800 p-4 rounded-xl overflow-auto">
                    {JSON.stringify(eventData, null, 2)}
                  </pre>
                </details>
              )}
            </motion.div>
          )} */}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}