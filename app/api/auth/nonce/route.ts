import { NextResponse } from "next/server";
import { generateNonce } from "siwe";

// Return a fresh nonce for SIWE message construction.
// In production you'd store this in a cache/session to prevent replay attacks.
export async function GET() {
  const nonce = generateNonce();
  return NextResponse.json({ nonce });
}
