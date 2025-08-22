'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { FormData } from "@/types";
import { uploadFileToPinata, uploadMetadataToPinata } from "@/lib/pinata";
import { getTicketContract } from "@/lib/contract";
import { ethers } from "ethers";
import ShareToX from "./ShareToX";

type MintFormTicketProps = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
};

const SEPOLIA_CHAIN_ID = 11155111;

const MintFormTicket: React.FC<MintFormTicketProps> = ({ formData, setFormData }) => {
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  console.log(formData.eventId);

  const [xData, setxData] = useState({
    eventName: "",
    date: "",
    venue: "",
    seatNumber: "",
  });

  const [isSuccess, setIsSuccess] = useState(false);

  // Keep preview in sync with selected file or existing string URI
  useEffect(() => {
    // If bannerImage is a string (already uploaded CID/URL), use it
    if (typeof formData.bannerImage === "string" && formData.bannerImage) {
      setPreviewUrl(formData.bannerImage);
      return;
    }

    // If bannerImage is a File, create object URL for preview
    if (formData.bannerImage && typeof formData.bannerImage !== "string") {
      const url = URL.createObjectURL(formData.bannerImage as File);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }

    // fallback
    setPreviewUrl(null);
  }, [formData.bannerImage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, bannerImage: file }));
      // preview handled by effect
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMinting(true);
    setError("");
    setIsSuccess(false);
    console.log("🚀 Starting ticket minting process");

    try {
      if (!window.ethereum) throw new Error("MetaMask not found. Please install MetaMask.");

      // Request accounts (prompts wallet)
      await window.ethereum.request({ method: "eth_requestAccounts" });
      console.log("✅ MetaMask accounts requested successfully");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log("✅ Provider and network obtained:", network.chainId);

      // Enforce Sepolia
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        throw new Error("Please switch your wallet network to Sepolia Testnet and try again.");
      }
      console.log("✅ Network validation passed - on Sepolia");

      const signer = await provider.getSigner();
      const contract = getTicketContract(signer);
      console.log("✅ Signer and contract instances created");

      // Prepare image: if File -> upload; if string -> reuse
      let imageURI: string | undefined = undefined;
      if (formData.bannerImage) {
        if (typeof formData.bannerImage === "string") {
          imageURI = formData.bannerImage;
          console.log("✅ Using existing image URI:", imageURI);
        } else {
          setUploading(true);
          console.log("📤 Starting image upload to Pinata");
          imageURI = await uploadFileToPinata(formData.bannerImage as File);
          console.log("✅ Image uploaded to Pinata:", imageURI);
          setUploading(false);
        }
      }

      // Build metadata JSON (ERC-721 standard style)
      const metadata: any = {
        name: `${formData.eventName} - ${formData.seatNumber}`,
        description: `Ticket for ${formData.eventName} on ${formData.eventDate} at ${formData.venue}`,
        image: imageURI ?? "",
        attributes: [
          { trait_type: "Event", value: formData.eventName },
          { trait_type: "Date", value: formData.eventDate },
          { trait_type: "Location", value: formData.venue },
          { trait_type: "Seat", value: formData.seatNumber },
          { trait_type: "Price", value: `${formData.price} ETH` },
        ],
      };
      console.log("✅ Metadata object created:", metadata);

      // Upload metadata JSON to Pinata -> returns tokenURI
      console.log("📤 Starting metadata upload to Pinata");
      const tokenURI = await uploadMetadataToPinata(metadata);
      console.log("✅ Metadata uploaded to Pinata:", tokenURI);

      // Read nextTokenId (contract should expose public nextTokenId)
      const nextIdRaw = await contract.nextTokenId();
      // robust conversion: BigInt | BigNumber | string
      const tokenId = Number(nextIdRaw?.toString?.() ?? String(nextIdRaw));
      console.log("✅ Next token ID retrieved:", tokenId);

      // Mint
      const userAddress = await signer.getAddress();
      const priceWei = ethers.parseEther(formData.price || "0"); // will throw if invalid
      console.log("✅ User address and price prepared:", userAddress, priceWei.toString());

      console.log("🔨 Starting contract mint transaction");
      const tx = await contract.mintTicket(
        userAddress,
        formData.eventName,
        formData.eventDate,
        formData.venue,
        formData.seatNumber,
        priceWei,
        tokenURI,
        {
          value: priceWei,  // 🔥 ADD THIS LINE - sends ETH with the transaction
        }
      );
      console.log("✅ Mint transaction submitted:", tx.hash);

      console.log("⏳ Waiting for transaction confirmation");
      const receipt = await tx.wait();
      const txHashFinal = (receipt as any)?.transactionHash ?? (tx as any)?.hash ?? "";
      setTxHash(txHashFinal);
      console.log("✅ Ticket Minted:", txHashFinal);

      // Save ticket to DB (normalize owner address lower-case)
      console.log("💾 Saving ticket to database");
      console.log("Event Data:", formData.eventId);
      await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: formData.eventId,
          tokenId,
          tokenURI,
          txHash: txHashFinal,
          ownerWallet: userAddress.toLowerCase(),
        }),
      });
      console.log("✅ Ticket saved to DB");

      // Update minted count
      console.log("📊 Updating minted count for event");
      await fetch(`/api/events/${formData.eventId}/minted`, {
        method: "PATCH",
      });
      console.log("✅ Minted count updated");

      setIsSuccess(true);
      setxData({
        eventName: formData.eventName,
        date: formData.eventDate,
        venue: formData.venue,
        seatNumber: formData.seatNumber,
      });
      console.log("🎉 Minting process completed successfully!");
    } catch (err: unknown) {
      console.error("Mint error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Mint failed. See console for details.");
      }
    } finally {
      setMinting(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6 flex flex-col justify-center items-center relative">
      {/* Dark background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/20 via-neutral-800/10 to-neutral-700/20"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-3xl"></div>

      <div className="max-w-2xl mx-auto w-full relative z-10">
        <div className="bg-gradient-to-br from-neutral-900/95 to-neutral-800/80 backdrop-blur-xl border border-neutral-700/40 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-neutral-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Mint Your Ticket</h2>
                <p className="text-indigo-400 text-sm">Create your NFT ticket on Sepolia Testnet</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form className="p-6 space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Name */}
              <div className="group">
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Event Name</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="eventName"
                  placeholder="Event Name"
                  value={formData.eventName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-600 rounded-xl bg-neutral-800/50 text-neutral-300 cursor-not-allowed transition-all duration-200 focus:outline-none"
                  readOnly
                />
              </div>

              {/* Event Date */}
              <div className="group">
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Date</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="eventDate"
                  placeholder="Date"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-600 rounded-xl bg-neutral-800/50 text-neutral-300 cursor-not-allowed transition-all duration-200 focus:outline-none"
                  readOnly
                />
              </div>

              {/* Venue */}
              <div className="group">
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Venue</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="venue"
                  placeholder="Venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-600 rounded-xl bg-neutral-800/50 text-neutral-300 cursor-not-allowed transition-all duration-200 focus:outline-none"
                  readOnly
                />
              </div>

              {/* Seat Number */}
              <div className="group">
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                    </svg>
                    <span>Seat Number</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="seatNumber"
                  placeholder="e.g., A-12, VIP-001"
                  value={formData.seatNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-600 rounded-xl bg-neutral-800/80 text-white placeholder-neutral-400 transition-all duration-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 focus:outline-none hover:border-neutral-500"
                />
              </div>

              {/* Price */}
              <div className="group md:col-span-2">
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>Price (in ETH)</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="price"
                    placeholder="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-16 border border-neutral-600 rounded-xl bg-neutral-800/80 text-white placeholder-neutral-400 transition-all duration-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 focus:outline-none hover:border-neutral-500"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-sm">
                    ETH
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Image Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-neutral-300">
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Banner Image</span>
                </span>
              </label>

              <div className="relative">
                <input
                  type="file"
                  id="banner-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="banner-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-600 rounded-xl cursor-pointer bg-neutral-800/50 hover:bg-neutral-700/50 transition-all duration-200 hover:border-indigo-400 group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-2 text-neutral-400 group-hover:text-indigo-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-neutral-400 group-hover:text-indigo-400 transition-colors duration-200">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-neutral-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </label>
              </div>

              {/* Image Preview */}
              <div className="relative overflow-hidden rounded-xl border border-neutral-600 bg-neutral-800/50">
                <Image
                  src={previewUrl ?? "/placeholder.png"}
                  alt="Banner preview"
                  height={200}
                  width={400}
                  className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={minting || uploading}
              className={`relative w-full py-4 px-6 rounded-xl font-semibold text-white text-lg transition-all duration-300 transform ${minting || uploading
                ? "bg-neutral-600 cursor-not-allowed scale-95"
                : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 hover:scale-105 hover:shadow-xl active:scale-95"
                } shadow-lg`}
            >
              <div className="flex items-center justify-center space-x-3">
                {(minting || uploading) && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                )}
                <span>
                  {uploading ? "Uploading Image..." : minting ? "Minting Ticket..." : "🎫 Mint Ticket"}
                </span>
              </div>

              {/* Loading overlay */}
              {(minting || uploading) && (
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
            </button>

            {/* Success Message */}
            {txHash && (
              <div className="p-4 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-600/30 rounded-xl animate-fadeIn">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-300">Ticket minted successfully! 🎉</h3>
                    <p className="mt-1 text-sm text-green-400">
                      Transaction:{" "}
                      <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs bg-green-800/50 text-green-300 px-2 py-1 rounded hover:bg-green-700/50 transition-colors duration-200 underline"
                      >
                        {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      </a>
                    </p>
                  </div>
                  {isSuccess && (
                    <ShareToX
                      title="🎟️ Just Minted My NFT Ticket on MintMyTicket!"
                      content={`I'm attending '${xData.eventName}' on ${xData.date} at ${xData.venue} 🎉 My seat: ${xData.seatNumber}. Mint yours now on MintMyTicket — powered by Web3!`}
                      hashtags={["MintMyTicket", "NFTtickets", "Web3Events", "ProofOfAttendance", "Blockchain"]}
                      url="https://MintMyTicket-self.vercel.app/events"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-gradient-to-r from-red-900/50 to-rose-900/50 border border-red-600/30 rounded-xl animate-fadeIn">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-300">Minting failed</h3>
                    <p className="mt-1 text-sm text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      </div>
    </div>
  );
};

export default MintFormTicket;
