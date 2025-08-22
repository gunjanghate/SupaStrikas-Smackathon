import { ethers } from "ethers";



import TicketNFTAbi from "./TicketNFT_ABI.json";

export function getTicketContract(signerOrProvider: ethers.Signer | ethers.Provider) {
    const contractAddress = process.env.NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS;
    if (!contractAddress) {
        throw new Error("NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS is not defined");
    }
    return new ethers.Contract(contractAddress, TicketNFTAbi, signerOrProvider);
}
