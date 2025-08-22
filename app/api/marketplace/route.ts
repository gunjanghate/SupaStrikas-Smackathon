import { ethers } from 'ethers';
import { NextResponse } from 'next/server';
import { getTicketContract } from '@/lib/contract';

export async function GET() {
  try {
    const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/4K2DjLA6wM5WY41lW1YkYzoysm8AKPC9');
    const contract = getTicketContract(provider);

    const maxSupply = Number((await contract.maxSupply()).toString());
    const nextTokenId = Number((await contract.nextTokenId()).toString());

    const listings: Array<{
      tokenId: number;
      resalePrice: string;
      metadata: any;
    }> = [];

    for (let i = 0; i < nextTokenId && i < maxSupply; i++) {
      try {
        const price = await contract.getResalePrice(i);
        const isClaimed = await contract.isClaimed(i);

        if (price > 0 && !isClaimed) {
          const tokenURI = await contract.tokenURI(i);
          const metaRes = await fetch(
            tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/'),
            { cache: 'no-store' }
          );

          if (!metaRes.ok) {
            throw new Error(`Failed to fetch metadata for token ${i}`);
          }

          const metadata = await metaRes.json();
          listings.push({
            tokenId: i,
            resalePrice: ethers.formatEther(price),
            metadata,
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch details for token ${i}:`, err);
      }
    }

    return NextResponse.json(listings, { status: 200 });
  } catch (err) {
    console.error('Error fetching listed tickets:', err);
    return NextResponse.json(
      { error: 'Failed to fetch listed tickets' },
      { status: 500 }
    );
  }
}