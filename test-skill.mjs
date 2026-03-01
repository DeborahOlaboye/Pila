/**
 * Test calling a PILA skill via PinionClient (handles x402 auto-pay).
 *
 * Usage:
 *   PINION_PRIVATE_KEY=0xYOUR_PRIVATE_KEY node test-skill.mjs
 *
 * The wallet must have USDC on the skill's network (base-sepolia for testnet).
 * Get free testnet USDC at: https://faucet.circle.com  →  Base Sepolia
 */

import { PinionClient } from "pinion-os";

const privateKey = process.env.PINION_PRIVATE_KEY;
if (!privateKey) {
  console.error("Set PINION_PRIVATE_KEY=0x... before running.");
  console.error("  PINION_PRIVATE_KEY=0xabc123... node test-skill.mjs");
  process.exit(1);
}

// Point the client at your local PILA instance
const client = new PinionClient({
  privateKey,
  apiUrl: "http://localhost:3000",   // base URL — path is appended below
  network: "base-sepolia",           // match the network your skill is deployed on
});

console.log("Caller wallet:", client.address);
console.log("Calling skill...\n");

const result = await client.request(
  "POST",
  "/api/proxy/crypto-dip-mm7dyvnr", // path relative to apiUrl
  {}                                  // input body — add fields your skill needs
);

console.log("HTTP status :", result.status);
console.log("Paid (atoms):", result.paidAmount, "USDC");
console.log("Latency     :", result.responseTimeMs, "ms");
console.log("Response    :", JSON.stringify(result.data, null, 2));
