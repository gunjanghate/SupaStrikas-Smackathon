"use client"
import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useEffect } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { WordRotate } from "./magicui/word-rotate";
import { cn } from "@/lib/utils";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
 
import { FiArrowRight } from "react-icons/fi";
import {
  useMotionTemplate,
  useMotionValue,
  motion,
  animate,
} from "framer-motion";
const COLORS_TOP = ["#A259FF", "#C084FC", "#9333EA", "#7C3AED"];

// const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];
export const AuroraHero = () => {
  const color = useMotionValue(COLORS_TOP[0]);

  useEffect(() => {
    animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 5,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, []);

  const backgroundImage = useMotionTemplate`radial-gradient(130% 130% at 50% 10%, #020617 50%, ${color})`;
  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 4px 20px ${color}`;

  return (
    <motion.section
      style={{
        backgroundImage,
      }}
      className="relative grid min-h-screen place-content-center overflow-hidden bg-gray-950 px-4 py-24 text-gray-200"
    >
      <div className="relative z-10 flex flex-col items-center">
        <AnimatedShinyText className="inline-flex items-center justify-center border-1 rounded-4xl px-4 py-1 transition text-neutral-400 ease-out hover:text-neutral-200 hover:duration-300 hover:dark:text-neutral-400">
          <span>✨ Introducing MintMyTicket</span>
          <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
        </AnimatedShinyText>
        <motion.h1
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl bg-gradient-to-br from-white to-gray-400 bg-clip-text text-center text-3xl font-medium leading-tight text-transparent sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight"
        >
          The Future of Event Ticketing
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            ease: "easeOut",
            delay: 0.5,
            type: "spring",
            stiffness: 60,
            damping: 12,
          }}
          className="my-6 max-w-xl text-center text-base leading-relaxed md:text-lg md:leading-relaxed"
        >
            The first Web3-native event platform that eliminates fake tickets through
            <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent "> NFT technology</span>,
            crypto payments, and instant QR verification.
        </motion.p>
        <motion.button
                  initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            ease: "easeOut",
            delay: 0.7,
            type: "spring",
            stiffness: 60,
            damping: 12,
          }}
          style={{
            border,
            boxShadow,
          }}
          whileHover={{
            scale: 1.05,
          }}
          whileTap={{
            scale: 0.985,
          }}
          className="group relative flex w-fit items-center gap-1.5 rounded-full bg-gray-950/10 px-4 py-2 text-gray-50 transition-colors hover:bg-gray-950/50"
        >
          Browse Events
          <FiArrowRight className="transition-transform group-hover:-rotate-45 group-active:-rotate-12" />
        </motion.button>
      </div>

      <div className="absolute inset-0 z-0">
        <Canvas>
          <Stars radius={100} count={1000} factor={4} fade speed={3} />
        </Canvas>
      </div>
    </motion.section>
  );
};