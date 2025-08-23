'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DemoTwo from "@/components/landingPage/DemoTwo";
import Feat1 from "@/components/features/Feat1";
import Feat2 from "@/components/features/Feat2";
import FooterDemo from "@/components/Footer";
import Chatbot from "./components/Chatbot";

export default function LandingPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="relative">
      <DemoTwo />
      <Feat1 />
      <Feat2 />
      <FooterDemo />

      {/* Chat Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97c-.645.258-.815-.343-.477-.663l1.8-1.35A5.965 5.965 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      </motion.button>

      {/* Chat Popup */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-20 right-6 w-80 bg-gradient-to-br from-neutral-900/90 to-neutral-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-700/40 z-50"
          >
            <div className="flex justify-between items-center p-4 border-b border-neutral-700/50">
              <h3 className="text-lg font-semibold text-white">MintMyTicket AI</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsChatOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            <Chatbot />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}