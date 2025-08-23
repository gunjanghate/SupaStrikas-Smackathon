"use client";
import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import Link from "next/link";
import React, { useRef, useState, useEffect } from "react";
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Check } from 'lucide-react';
import { useWeb3 } from '@/context/Web3Context';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';


interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface MobileNavToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

interface NavbarButtonProps {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      // IMPORTANT: Change this to class of `fixed` if you want the navbar to be fixed
      className={cn("fixed inset-x-0 top-2 z-40 w-full", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
            child as React.ReactElement<{ visible?: boolean }>,
            { visible },
          )
          : child,
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
          : "none",
        width: visible ? "40%" : "100%",
        y: visible ? 20 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      style={{
        minWidth: "800px",
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start rounded-full bg-transparent px-4 py-2 lg:flex",
        visible && "bg-neutral-950/80",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-neutral-300 transition duration-200 hover:text-neutral-100 lg:flex lg:space-x-2",
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative px-4 py-2 text-neutral-300"
          key={`link-${idx}`}
          href={item.link}
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-full bg-neutral-800"
            />
          )}
          <span className="relative text-lg z-20">{item.name}</span>
        </a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
          : "none",
        width: visible ? "90%" : "100%",
        paddingRight: visible ? "12px" : "0px",
        paddingLeft: visible ? "12px" : "0px",
        borderRadius: visible ? "4px" : "2rem",
        y: visible ? 20 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between bg-transparent px-0 py-2 lg:hidden",
        visible && "bg-neutral-950/80",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-lg bg-neutral-950 px-4 py-8 shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle: React.FC<MobileNavToggleProps> = ({
  isOpen,
  onClick,
}) => {
  return isOpen ? (
    <IconX className="text-white" onClick={onClick} />
  ) : (
    <IconMenu2 className="text-white" onClick={onClick} />
  );
};

export const NavbarLogo = () => {
  return (
    <a
      href="/"
      className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-white"
    >
      <img
        src="https://assets.aceternity.com/logo-dark.png"
        alt="logo"
        width={30}
        height={30}
      />
      <span className="font-semibold text-lg font-sans text-purple-400">MintMyTicket</span>
    </a>
  );
};

export const NavbarButton: React.FC<NavbarButtonProps & React.HTMLAttributes<HTMLElement>> = ({
  href,
  as: Tag = "a" as any,
  children,
  className,
  variant = "primary",
  ...props
}) => {
  const baseStyles =
    "px-4 py-2 rounded-md  button bg-white text-black text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center";

  const variantStyles = {
    primary:
      "shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    secondary: "bg-transparent shadow-none text-white",
    dark: "bg-black text-white shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    gradient:
      "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
  };

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <Tag
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};

export const NavbarWalletButton = () => {
  const { address, isConnected, connectWallet, disconnectWallet, chainId } = useWeb3();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const openInExplorer = () => {
    if (!address) return;
    const baseUrl = chainId === 11155111 // Sepolia chain ID
      ? "https://sepolia.etherscan.io/address/"
      : "https://etherscan.io/address/";
    window.open(`${baseUrl}${address}`, '_blank');
  };

  // Fetch balance whenever address/chain changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !window.ethereum) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const bal = await provider.getBalance(address);
        setBalance(Number(ethers.formatEther(bal)).toFixed(4)); // 4 decimal places
      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    };

    fetchBalance();
  }, [address, chainId]);

  if (!isConnected) {
    return (
      <motion.button
        onClick={connectWallet}
        className="relative px-6 py-2.5 border-2 hover:border-purple-700 border-t-indigo-600 border-purple-600 border-b-purple-600 transition-all duration-200 hover:bg-gradient-to-r from-indigo-600 to-purple-600 hover:text-white font-semibold rounded-full hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center gap-1 md:space-x-2 md:gap-0">
          <Wallet className="w-4 h-4" />
          <span className='text-sm md:text-lg'>Connect Wallet</span>
        </div>
      </motion.button>
    );
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 px-4 py-2.5 bg-neutral-900/50 border border-neutral-700 rounded-full hover:bg-neutral-800/50 transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-md"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
            </p>
            {balance && (
              <p className="text-xs text-neutral-400">{balance} ETH</p>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-neutral-900/90 backdrop-blur-md rounded-xl shadow-lg border border-neutral-700 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-neutral-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
                <div>
                  <p className="font-medium text-white">Connected</p>
                  <p className="text-sm text-neutral-400">
                    {chainId === 11155111 ? "Sepolia Testnet" : "Ethereum Mainnet"}
                  </p>
                  {balance && (
                    <p className="text-xs text-neutral-300">{balance} ETH</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-2">
              <div className="px-3 py-2 text-xs text-neutral-400 uppercase tracking-wide font-semibold">
                Account
              </div>

              <button
                onClick={() => router.push("/your-events")}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-neutral-800 rounded-lg font-semibold text-purple-400 hover:text-purple-300 transition-all duration-200"
              >
                🎪 Your Events
              </button>

              <button
                onClick={copyAddress}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-neutral-800 rounded-lg transition-colors duration-150"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-neutral-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">
                    {copied ? 'Copied!' : 'Copy Address'}
                  </p>
                  <p className="text-xs text-neutral-400 font-mono">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                  </p>
                </div>
              </button>

              <button
                onClick={openInExplorer}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-neutral-800 rounded-lg transition-colors duration-150"
              >
                <ExternalLink className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-white">View on Explorer</p>
                  <p className="text-xs text-neutral-400">Open in block explorer</p>
                </div>
              </button>

              <div className="border-t border-neutral-700 mt-2 pt-2">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    disconnectWallet();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-red-900/30 rounded-lg transition-colors duration-150 text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Disconnect</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
      )}
    </div>
  );
};