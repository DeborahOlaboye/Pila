import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createWalletClient, createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { decryptPrivateKey } from "@/lib/wallet";

const USDC: Record<string, `0x${string}`> = {
  base:           "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

const erc20Abi = [
  { name: "balanceOf", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }] },
  { name: "transfer",  type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ type: "bool" }] },
] as const;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { skillId } = await req.json();
  const userAddress = session.user.name.toLowerCase() as `0x${string}`;

  const skill = await prisma.skill.findFirst({
    where: { id: skillId, user: { address: userAddress } },
  });
  if (!skill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!skill.walletKey || !skill.walletAddress) {
    return NextResponse.json({ error: "Skill has no wallet — deploy it first" }, { status: 400 });
  }

  const networkName = (process.env.PINION_NETWORK || "base-sepolia") as "base" | "base-sepolia";
  const chain = networkName === "base" ? base : baseSepolia;
  const usdcAddress = USDC[networkName];

  let privateKey: string;
  try {
    privateKey = decryptPrivateKey(skill.walletKey);
  } catch {
    return NextResponse.json({ error: "Could not decrypt skill wallet key" }, { status: 500 });
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const publicClient = createPublicClient({ chain, transport: http() });

  const balance = await publicClient.readContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });

  if (balance === 0n) {
    return NextResponse.json({
      error: `Skill wallet (${account.address}) has no USDC balance yet. Earnings may not have settled on-chain.`,
    }, { status: 400 });
  }

  const walletClient = createWalletClient({ account, chain, transport: http() });

  let txHash: `0x${string}`;
  try {
    txHash = await walletClient.writeContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [userAddress, balance],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("insufficient") || msg.includes("gas") || msg.includes("funds")) {
      return NextResponse.json({
        error: `Skill wallet needs ETH for gas. Send a small amount of ETH to ${account.address} on ${networkName} then retry.`,
        skillWallet: account.address,
      }, { status: 400 });
    }
    return NextResponse.json({ error: `Transfer failed: ${msg}` }, { status: 500 });
  }

  const amount = Number(balance) / 1e6;
  return NextResponse.json({ ok: true, amount, txHash, to: userAddress });
}
