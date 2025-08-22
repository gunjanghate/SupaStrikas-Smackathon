import { NextResponse, NextRequest } from "next/server";
import Ticket from "@/models/Ticket";
import { connectToDB } from "@/lib/mongo";

export async function PATCH(req: NextRequest, { params }: { params: { tokenId: string } }) {
    try {
        const { tokenId } = params;
        const { newOwnerWallet, newtxnHash } = await req.json();

        if (!newOwnerWallet) {
            return NextResponse.json({ error: "newOwnerWallet is required" }, { status: 400 });
        }

        await connectToDB();
        const ticket = await Ticket.findOne({ tokenId: Number(tokenId) });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        ticket.ownerWallet = newOwnerWallet;
        ticket.txHash = newtxnHash;
        await ticket.save();

        return NextResponse.json({ message: "Ticket bought successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error in PATCH /api/tickets/[tokenId]/bought:", error);
        return NextResponse.json({ error: "Failed to buy ticket" }, { status: 500 });
    }
}
