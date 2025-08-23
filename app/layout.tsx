import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import NavbarDemo from "@/components/NavBarDemo";
import { Web3Provider } from "@/context/Web3Context";
import { Analytics } from "@vercel/analytics/next";

const montserrat = Montserrat({
  variable: "--font-montserrat", // ✅ fixed spelling
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MintMyTicket – Decentralized Event Ticketing",
  description:
    "Mint, manage, and verify event tickets on-chain using MintMyTicket – a blockchain-powered ticketing platform ensuring transparency and security.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} antialiased bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100`}
      >
        <Web3Provider>
          <NavbarDemo />
          {children}
          <Analytics />
        </Web3Provider>
      </body>
    </html>
  );
}
