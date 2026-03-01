# PILA

> Deploy earning PinionOS x402 skills in 2 minutes. No code required.

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Built on PinionOS](https://img.shields.io/badge/Built%20on-PinionOS-blueviolet)](https://pinion.xyz)
[![Base Network](https://img.shields.io/badge/Network-Base-blue)](https://base.org)

## What Is It?

PILA is a no-code platform built on PinionOS. Describe your skill in plain English, set a USDC price, and PILA:

1. **Generates** TypeScript handler code via Claude AI
2. **Deploys** a live x402-paywalled endpoint instantly
3. **Earns** USDC automatically — settled on Base via `facilitator.payai.network`

No TypeScript knowledge, server setup, or wallet management required.

---

## How PinionOS Is Used

PILA uses the `pinion-os` package in three critical ways:

### 1. Skill Servers (`pinion-os/server`) — The Core

Every deployed skill is an isolated Node.js child process running:

```typescript
const { createSkillServer, skill } = require("pinion-os/server");

const server = createSkillServer({
  payTo: skillWalletAddress, // Dedicated earning wallet per skill
  network: "base",
});

server.add(
  skill(slug, {
    price: "$0.03",
    endpoint: "/run",
    handler: async (req, res) => {
      // AI-generated handler code runs here
    },
  })
);

server.listen(port);
```

Each skill has a **dedicated wallet**. USDC from x402 payments settles directly to that wallet on Base via `facilitator.payai.network`. No shared treasury — creators own their earnings.

### 2. PinionClient (Live Test Panel)

The marketplace test panel uses `PinionClient` server-side to make real paid calls, so visitors can test any skill from the browser without needing their own wallet or USDC:

```typescript
import { PinionClient } from "pinion-os";

const client = new PinionClient({
  privateKey: process.env.PINION_PRIVATE_KEY,
});

const result = await client.callSkill(endpointUrl, inputPayload);
```

### 3. Wallet Generation via viem

Each deployed skill gets a unique Base wallet generated with `viem/accounts`, ensuring earnings are isolated and creator-controlled:

```typescript
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privateKey = generatePrivateKey();
const { address } = privateKeyToAccount(privateKey);
// Private key is AES-256-CBC encrypted before storage
```

---

## Features

- **No-code skill builder** — Describe in English, Claude writes the TypeScript
- **One-click deployment** — Live x402 endpoint in under 2 minutes
- **Public marketplace** — Search, filter, live test panel, SDK snippets
- **Real-time earnings dashboard** — USDC tracking with 7-day chart
- **OpenClaw integration** — Auto-generated `openclaw.plugin.json` for every skill
- **Per-skill wallets** — Isolated USDC earnings, withdraw anytime

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL (Supabase) |
| AI | Claude API (`claude-opus-4-6`) |
| Blockchain | PinionOS, viem, Base Network |
| Auth | NextAuth.js (wallet-based) |
| Charts | Recharts |

---

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Anthropic API key
- Base Sepolia wallet with testnet USDC

### Installation

```bash
git clone https://github.com/yourusername/pila
cd pila
npm install
```

### Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

```env
DATABASE_URL=postgresql://...         # Supabase Postgres URL
NEXTAUTH_SECRET=                       # 32+ random characters
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...          # Claude API key
PINION_PRIVATE_KEY=0x...              # Test wallet (USDC on Base)
PINION_NETWORK=base-sepolia           # or "base" for mainnet
FACILITATOR_URL=https://facilitator.payai.network
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ENCRYPT_SECRET=                        # 32-char AES encryption secret
```

### Database

```bash
npx prisma migrate dev --name init
# or for quick setup:
npx prisma db push
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
User Browser
    │
    ▼ Next.js App (pila.app)
    │
    ├── /marketplace     — Browse all live skills
    ├── /builder         — Create & deploy skills
    ├── /dashboard       — Earnings & skill management
    │
    ▼ Next.js API Routes
    │
    ├── /api/generate    — Claude code generation
    ├── /api/skills      — Skill CRUD
    ├── /api/proxy/[slug]— Forwards to live skill process
    ├── /api/plugin/[id] — OpenClaw plugin JSON
    └── /api/withdraw    — USDC withdrawal
    │
    ▼ Skill Deployment Engine (lib/deploy.ts)
    │
    ├── skill-abc/  ← createSkillServer process  → USDC wallet A
    ├── skill-def/  ← createSkillServer process  → USDC wallet B
    └── skill-ghi/  ← createSkillServer process  → USDC wallet C
    │
    ▼ Base L2 Network — USDC Settlement
```

---

## Demo

The full demo flow:

1. Connect wallet → navigate to `/builder`
2. Fill form: Name, description, price, schemas
3. Click **Generate Handler Code** — Claude writes TypeScript in ~3s
4. Click **Deploy Skill** — watches animated deployment steps
5. Get live endpoint URL + SDK snippet + OpenClaw plugin
6. Browse `/marketplace` → test skill from browser with no wallet needed
7. `/dashboard` → see real-time earnings + withdraw USDC

---

## Project Structure

```
pila/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── marketplace/page.tsx        # Skill browser
│   ├── marketplace/[skillId]/      # Skill detail + test panel
│   ├── builder/page.tsx            # No-code skill creation
│   ├── dashboard/page.tsx          # Earnings & management
│   └── api/                        # All backend routes
├── components/
│   ├── BuilderForm.tsx             # Core no-code builder UI
│   ├── SkillCard.tsx               # Marketplace grid card
│   ├── TestSkillPanel.tsx          # Live browser test
│   ├── SDKSnippet.tsx              # Copy-ready code snippets
│   ├── DeploymentStatus.tsx        # Animated deploy progress
│   └── EarningsChart.tsx           # Recharts area chart
├── lib/
│   ├── deploy.ts                   # child_process skill spawner
│   ├── claude.ts                   # Anthropic SDK wrapper
│   ├── wallet.ts                   # viem wallet generation
│   ├── plugin-generator.ts         # OpenClaw JSON builder
│   └── prisma.ts                   # Prisma singleton
├── skill-runtime/
│   └── template.ts                 # createSkillServer code template
└── prisma/schema.prisma            # DB schema
```

---

## PinionOS Hackathon 2026

Built for the PinionOS Hackathon (Feb 22 – Mar 1, 2026).

**The meta-argument:** PinionOS built an infrastructure primitive. Every skill deployed through PILA is a new earning node in their ecosystem. PILA doesn't just use PinionOS — it multiplies its reach.

---

## License

MIT
