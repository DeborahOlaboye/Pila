# PILA

> Deploy earning PinionOS x402 skills in 2 minutes. No code required.

## What Is It?

PILA is a no-code platform built on PinionOS. Describe your skill in plain English, set a USDC price, and PILA:

1. **Generates** TypeScript handler code via Groq (Llama 3.3 70B)
2. **Deploys** a live x402-paywalled endpoint instantly
3. **Earns** USDC automatically — settled on Base via the x402 facilitator

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

Each skill has a **dedicated wallet**. USDC from x402 payments settles directly to that wallet on Base via the x402 facilitator. No shared treasury — creators own their earnings.

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

- **No-code skill builder** — Describe in English, Groq (Llama 3.3 70B) writes the TypeScript
- **One-click deployment** — Live x402 endpoint in under 2 minutes
- **Auto-restart on boot** — Live skills are automatically restarted when the server restarts
- **Public marketplace** — Search, filter, live test panel, SDK snippets
- **Real-time earnings dashboard** — USDC tracking with 7-day chart
- **OpenClaw integration** — Auto-generated `openclaw.plugin.json` for every skill
- **Per-skill wallets** — Isolated USDC earnings, withdraw anytime

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| UI Components | Monaco Editor, Recharts, lucide-react, sonner, RainbowKit |
| Backend | Next.js API Routes, Prisma ORM 5 |
| Database | PostgreSQL (Supabase) |
| AI Code Gen | Groq SDK (`llama-3.3-70b-versatile`) |
| Blockchain | PinionOS, viem, wagmi, Base Network |
| Auth | NextAuth.js v4 + SIWE (Sign-In with Ethereum) |

---

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Base wallet with USDC (for the test client)

### Installation

```bash
git clone https://github.com/yourusername/pila
cd pila
npm install
```

### Environment Variables

Create `.env.local` in the project root with the following values:

```env
DATABASE_URL=postgresql://...         # Supabase / Postgres connection URL
NEXTAUTH_SECRET=                       # 32+ random characters
NEXTAUTH_URL=http://localhost:3000
GROQ_API_KEY=gsk_...                  # Groq API key (for Llama code generation)
PINION_PRIVATE_KEY=0x...              # Test wallet private key (USDC on Base)
PINION_NETWORK=base                    # "base" for mainnet, "base-sepolia" for testnet
FACILITATOR_URL=https://x402.org/facilitator
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ENCRYPT_SECRET=                        # 32-char AES encryption secret for wallet keys
```

### Database

```bash
npx prisma db push
# or for tracked migrations:
npx prisma migrate dev --name init
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
    ├── /                — Landing page + live stats
    ├── /marketplace     — Browse all live skills
    ├── /builder         — Create & deploy skills
    ├── /dashboard       — Earnings & skill management
    │
    ▼ Next.js API Routes
    │
    ├── /api/generate         — Groq code generation
    ├── /api/skills           — Skill CRUD
    ├── /api/skills/[skillId] — Single skill detail
    ├── /api/proxy/[slug]     — Forwards requests to live skill process
    ├── /api/plugin/[skillId] — OpenClaw plugin JSON
    ├── /api/test             — Server-side skill test calls (PinionClient)
    ├── /api/stats            — Platform-wide stats (skills, calls, earned)
    └── /api/withdraw         — USDC withdrawal
    │
    ▼ Skill Deployment Engine (lib/deploy.ts)
    │                         ← auto-restarted on boot via instrumentation.ts
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
3. Click **Generate Handler Code** — Groq writes TypeScript in ~2s
4. Click **Deploy Skill** — watches animated deployment steps
5. Get live endpoint URL + SDK snippet + OpenClaw plugin
6. Browse `/marketplace` → test skill from browser with no wallet needed
7. `/dashboard` → see real-time earnings + withdraw USDC

---

## Project Structure

```
pila/
├── app/
│   ├── page.tsx                       # Landing page + stats + featured skills
│   ├── marketplace/page.tsx           # Skill browser with search & filters
│   ├── marketplace/[skillId]/         # Skill detail + live test panel
│   ├── builder/page.tsx               # No-code skill creation
│   ├── dashboard/page.tsx             # Earnings & skill management
│   └── api/
│       ├── generate/route.ts          # Groq code generation
│       ├── skills/route.ts            # Skill list + create
│       ├── skills/[skillId]/route.ts  # Skill detail + update + delete
│       ├── proxy/[slug]/route.ts      # Reverse proxy to skill processes
│       ├── plugin/[skillId]/route.ts  # OpenClaw plugin JSON
│       ├── test/route.ts              # PinionClient test calls
│       ├── stats/route.ts             # Platform stats
│       ├── withdraw/route.ts          # USDC withdrawal
│       └── auth/                      # NextAuth + SIWE handlers
├── components/
│   ├── BuilderForm.tsx                # Core no-code builder UI
│   ├── SkillCard.tsx                  # Marketplace grid card
│   ├── TestSkillPanel.tsx             # Live browser test
│   ├── SDKSnippet.tsx                 # Copy-ready code snippets
│   ├── DeploymentStatus.tsx           # Animated deploy progress
│   ├── EarningsChart.tsx              # Recharts area chart
│   ├── MetricsBadge.tsx               # Skill metric pill badges
│   ├── Navbar.tsx                     # Top navigation
│   ├── ConnectWallet.tsx              # RainbowKit wallet button
│   ├── Providers.tsx                  # wagmi/RainbowKit/ReactQuery providers
│   └── ui/                            # Shared UI primitives
├── lib/
│   ├── deploy.ts                      # child_process skill spawner + port allocator
│   ├── claude.ts                      # Groq SDK wrapper (code generation)
│   ├── wallet.ts                      # viem wallet generation + AES encryption
│   ├── plugin-generator.ts            # OpenClaw JSON builder
│   ├── auth.ts                        # NextAuth + SIWE config
│   ├── wagmi.ts                       # wagmi/viem client config
│   ├── constants.ts                   # Shared constants
│   └── prisma.ts                      # Prisma singleton
├── skill-runtime/
│   └── template.ts                    # createSkillServer code template
├── instrumentation.ts                 # Auto-restarts live skills on server boot
└── prisma/schema.prisma               # DB schema (User, Skill, SkillCall)
```

---

## Deployment

Skill deployment uses persistent child processes — **serverless platforms (Vercel) are not supported** for the deploy feature. Use a persistent server:

- [Railway](https://railway.app) — recommended
- [Render](https://render.com)
- Any VPS (DigitalOcean, Hetzner, etc.)

The marketplace, builder UI, and read-only API routes work fine on serverless. Only `deploySkill` requires a persistent Node.js process.

---

Built for the PinionOS Hackathon.

**The meta-argument:** PinionOS built an infrastructure primitive. Every skill deployed through PILA is a new earning node in their ecosystem. PILA doesn't just use PinionOS — it multiplies its reach.

---

## License

MIT
