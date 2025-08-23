'use client';

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

type Message = {
  sender: "user" | "bot";
  text: string;
};

type MenuOption = {
  id: string;
  title: string;
};

const MessageBubble: React.FC<{ sender: "user" | "bot"; text: string }> = ({ sender, text }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className={`flex ${sender === "user" ? "justify-end" : "justify-start"} mb-3`}
  >
    <div
      className={`max-w-[70%] p-3 rounded-lg ${
        sender === "user"
          ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
          : "bg-gradient-to-r from-neutral-700 to-neutral-600 text-neutral-200"
      }`}
    >
      {text}
    </div>
  </motion.div>
);

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "Hi 👋 I’m your MintMyTicket AI. Need help with MetaMask or getting started?" },
  ]);
  const [input, setInput] = useState("");
  const [menu, setMenu] = useState<MenuOption[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef(`sess_${Date.now()}`);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("https://smackk-backend.vercel.app/api/menu")
      .then((r) => r.json())
      .then((d) => setMenu(d.menu || []))
      .catch(() => setMenu([]));

    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const pushMessage = (m: Message) => setMessages((prev) => [...prev, m]);

  const sendIntent = async (intentId: string, title: string) => {
    pushMessage({ sender: "user", text: title });
    setLoading(true);
    try {
      const res = await fetch("https://smackk-backend.vercel.app/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionRef.current, intent: intentId }),
      });
      const json = await res.json();
      pushMessage({ sender: "bot", text: json.reply || "No reply" });
    } catch (err) {
      pushMessage({ sender: "bot", text: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    pushMessage({ sender: "user", text: input });
    setLoading(true);
    try {
      const res = await fetch("https://smackk-backend.vercel.app/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionRef.current, message: input }),
      });
      const json = await res.json();
      pushMessage({ sender: "bot", text: json.reply || "No reply" });
    } catch (err) {
      pushMessage({ sender: "bot", text: "Network error. Try again." });
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex flex-col h-[400px] w-full">
      <div
        ref={chatWindowRef}
        className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-br from-neutral-900/80 to-neutral-800/80"
      >
        {messages.map((m, i) => (
          <MessageBubble key={i} sender={m.sender} text={m.text} />
        ))}
        {loading && <MessageBubble sender="bot" text="⏳ Thinking..." />}
      </div>

      <div className="p-3 border-t border-neutral-700/50">
        <div className="flex flex-wrap gap-2 mb-3">
          {menu.map((opt) => (
            <motion.button
              key={opt.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendIntent(opt.id, opt.title)}
              className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium hover:shadow-lg transition-all duration-200"
            >
              {opt.title}
            </motion.button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 p-2 bg-neutral-800 text-white rounded-lg border border-neutral-700 focus:border-purple-500 focus:outline-none text-sm placeholder-neutral-400"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!input.trim()}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </motion.button>
        </div>
      </div>
    </div>
  );
}