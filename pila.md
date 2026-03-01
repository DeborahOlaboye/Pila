# PILA — No-Code PinionOS Skill Builder & Marketplace
## Comprehensive Build Plan | PinionOS Hackathon 2026
### Target: 1st Place ($1,500)

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Why This Wins](#2-why-this-wins)
3. [Architecture Overview](#3-architecture-overview)
4. [Tech Stack](#4-tech-stack)
5. [Repository Structure](#5-repository-structure)
6. [Backend Design](#6-backend-design)
7. [Skill Deployment Engine](#7-skill-deployment-engine)
8. [Frontend Design](#8-frontend-design)
9. [PinionOS & OpenClaw Integration](#9-pinionos--openclaw-integration)
10. [Day-by-Day Build Plan](#10-day-by-day-build-plan)
11. [Testing Strategy](#11-testing-strategy)
12. [Demo Script](#12-demo-script)
13. [README Template](#13-readme-template)
14. [Submission Checklist](#14-submission-checklist)
15. [Environment Variables](#15-environment-variables)

---

## 1. Project Overview

### What Is PILA?

PILA is a no-code platform where anyone can create, deploy, and monetize a
PinionOS x402 skill in under 2 minutes — no TypeScript knowledge required.

You describe what your skill does in plain English, set a price in USDC, and
PILA generates the handler code, deploys a live x402-paywalled endpoint,
and starts earning immediately. A public marketplace lets agents and developers
discover, test, and call all published skills via the PinionOS SDK.

### The Problem It Solves

Right now, building a PinionOS skill server requires:
- Knowing TypeScript and the `createSkillServer` / `skill()` API
- Understanding EIP-3009 and x402 payment flows
- Deploying and hosting a server yourself
- Managing environment variables, wallet keys, facilitator config
- Manually writing the `openclaw.plugin.json` manifest

That is 30–60 minutes of setup minimum, and a steep learning curve for non-developers.

**PILA collapses this to a 2-minute form.**

### The Full Value Proposition

| Without PILA | With PILA |
|---|---|
| Write TypeScript handler | Describe in plain English |
| Configure `createSkillServer` | Click "Deploy" |
| Set up and pay for hosting | Managed endpoint, live instantly |
| Write `openclaw.plugin.json` by hand | Auto-generated for every skill |
| Manually track USDC earnings | Live earnings dashboard |
| No discoverability | Public searchable marketplace |

### Five Core Features
1. **Builder UI** — Form-based skill creation with AI-generated TypeScript handler code preview
2. **Deployment Engine** — Spins up isolated x402 skill server processes per skill
3. **Public Marketplace** — Browse, filter, live-test, and get SDK snippets for all skills
4. **Earnings Dashboard** — Real-time USDC earned, call volume, per-skill analytics
5. **OpenClaw Plugin Generator** — Auto-generates `openclaw.plugin.json` for instant OpenClaw integration

---

## 2. Why This Wins

### Against Each Judging Criterion

**Creativity ★★★★★**
No one has built a no-code deployment layer for x402 skills on any platform —
Solana, Base, or otherwise. This is a new product category: the "Vercel" of
agent skill monetization. The creative leap is unmistakable and the judges,
who built the PinionOS primitive, will instantly see the vision.

**Functionality ★★★★★**
Every feature is demonstrable live during the demo. Judges can watch:
- A skill get created from scratch in plain English
- Claude generate handler TypeScript in real time
- The skill deploy with a live endpoint URL
- USDC flow to the creator's wallet on Base
- The skill appear in the public marketplace
- A live test call return real data

**Completeness ★★★★★**
A full-stack web application with auth, builder, deployment pipeline, marketplace,
live test panel, and earnings dashboard reads as a shipped product — not a
hackathon prototype. This is the criterion where your full-stack skills matter most.

**Code Quality ★★★★★**
Clean Next.js 14 App Router + TypeScript + Prisma + well-separated concerns
(deployment engine, plugin generator, proxy layer each in their own module)
demonstrates professional architecture, not spaghetti hackathon code.

### The Meta-Argument
The PinionOS team built an infrastructure primitive. Every skill deployed through
PILA is a new node in their ecosystem. You are not just using their SDK —
you are multiplying their platform's reach. That is what first place looks like
to a builder team judging their own hackathon.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER / BROWSER                           │
│              Next.js Frontend (pila.app)                  │
│                                                                 │
│   Builder UI  │  Marketplace  │  Dashboard  │  Skill Detail    │
└───────────────────────────┬─────────────────────────────────────┘
                            │  Next.js API Routes
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PILA BACKEND                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Skill CRUD  │  │  AI Code Gen │  │  Deployment Engine   │  │
│  │  (Postgres)  │  │  (Claude API)│  │  (child_process)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Auth        │  │  Metrics     │  │  Plugin Generator    │  │
│  │  (NextAuth)  │  │  (call logs) │  │  (openclaw.json)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │  spawns isolated Node.js processes
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DEPLOYED SKILL SERVERS                         │
│                                                                 │
│   skill-abc/        skill-def/        skill-ghi/               │
│   POST /run         POST /run         POST /run                │
│   $0.02/call        $0.05/call        $0.01/call               │
│                                                                 │
│   Each is a pinion-os createSkillServer instance               │
│   Each has its own dedicated wallet for USDC earnings          │
│   x402 payment verified via facilitator.payai.network          │
└───────────────────────────┬─────────────────────────────────────┘
                            │  USDC settles on Base
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BASE L2 NETWORK                           │
│                     USDC Settlement                             │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**Each Skill Gets Its Own Isolated Server Process**
Using Node.js `child_process.fork()`, each deployed skill runs in isolation.
This prevents one skill's bugs from affecting others. For the hackathon this
is simpler and more demonstrable than Docker.

**Each Skill Gets Its Own Wallet**
When a skill is deployed, the backend generates a new Base wallet. USDC earned
from that skill accumulates in that wallet. Creators withdraw from the dashboard.

**AI Code Generation via Claude**
Handler code is generated by Claude based on the user's plain-English description.
The code is shown in a Monaco editor preview before deployment — users can see
and optionally edit it before going live.

**Unified Proxy Layer**
Since each skill runs on a different internal port, a proxy endpoint
(`/api/proxy/[slug]`) forwards requests to the correct process while logging
call metrics. The public-facing URL is always clean: `pila.app/proxy/[slug]`.

---

## 4. Tech Stack

### Frontend
| Tool | Purpose |
|------|---------|
| Next.js 14 (App Router) | Full-stack framework |
| TypeScript | Type safety throughout |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Component library |
| Monaco Editor | Code preview and editing panel |
| Recharts | Earnings charts in dashboard |
| RainbowKit + wagmi | Wallet connection |
| next-auth | Session management |
| Lucide React | Icon set |

### Backend
| Tool | Purpose |
|------|---------|
| Next.js API Routes | Backend endpoints |
| Prisma | ORM |
| PostgreSQL (Supabase) | Database |
| `pinion-os` | Skill server framework + PinionClient |
| `@anthropic-ai/sdk` | Claude API for code generation |
| `viem` | Wallet generation, Base chain interactions |
| Node.js `child_process` | Isolated skill server processes |
| `zod` | Input validation |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Vercel | Frontend + serverless API deployment |
| Supabase | Postgres database (free tier) |
| Base Sepolia | Testnet during development |
| Base Mainnet | Production USDC settlement |
| `facilitator.payai.network` | x402 payment verification |

---

## 5. Repository Structure

```
pila/
├── app/
│   ├── page.tsx                        # Landing page
│   ├── layout.tsx                      # Root layout, providers, nav
│   ├── marketplace/
│   │   ├── page.tsx                    # Browse all skills
│   │   └── [skillId]/
│   │       └── page.tsx                # Skill detail + live test panel
│   ├── builder/
│   │   └── page.tsx                    # Create new skill (auth required)
│   ├── dashboard/
│   │   └── page.tsx                    # My skills + earnings (auth required)
│   └── api/
│       ├── auth/[...nextauth]/
│       │   └── route.ts                # NextAuth handlers
│       ├── skills/
│       │   ├── route.ts                # GET all skills, POST create
│       │   └── [skillId]/
│       │       ├── route.ts            # GET, PATCH, DELETE
│       │       ├── deploy/route.ts     # POST deploy skill
│       │       ├── stop/route.ts       # POST stop skill
│       │       └── metrics/route.ts    # GET call history + earnings
│       ├── generate/
│       │   └── route.ts                # POST generate handler via Claude
│       ├── proxy/
│       │   └── [slug]/
│       │       └── route.ts            # Proxy to internal skill process
│       ├── plugin/
│       │   └── [skillId]/
│       │       └── route.ts            # GET openclaw.plugin.json
│       └── withdraw/
│           └── route.ts                # POST withdraw earnings
├── components/
│   ├── ui/                             # shadcn/ui components
│   ├── SkillCard.tsx                   # Marketplace grid card
│   ├── BuilderForm.tsx                 # Skill creation form
│   ├── CodePreview.tsx                 # Monaco editor panel
│   ├── EarningsChart.tsx               # Recharts area chart
│   ├── MetricsBadge.tsx                # Calls + earnings display
│   ├── SDKSnippet.tsx                  # Copy-to-clipboard code
│   ├── TestSkillPanel.tsx              # Live browser test panel
│   └── DeploymentStatus.tsx            # Animated deployment progress
├── lib/
│   ├── prisma.ts                       # Prisma client singleton
│   ├── pinion.ts                       # PinionClient setup
│   ├── claude.ts                       # Anthropic client + prompts
│   ├── deploy.ts                       # Skill deployment engine
│   ├── wallet.ts                       # Wallet generation + encryption
│   ├── plugin-generator.ts             # openclaw.plugin.json generator
│   └── constants.ts                    # Config, network settings
├── skill-runtime/
│   ├── template.ts                     # Skill server code template
│   └── runner.ts                       # Process spawner and manager
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── types/
│   └── index.ts                        # Shared TypeScript types
├── .env.example
├── README.md
└── package.json
```

---

## 6. Backend Design

### 6.1 Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  address   String   @unique  // wallet address (lowercase)
  createdAt DateTime @default(now())
  skills    Skill[]
}

model Skill {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id])

  // Identity
  name        String
  slug        String        @unique
  description String
  category    SkillCategory
  tags        String[]

  // Pricing
  priceUsd    Float                    // e.g. 0.02 for $0.02

  // Schema
  inputSchema  Json                    // { "city": "string" }
  outputSchema Json                    // { "temp": "number" }

  // Code
  handlerCode String                   // Generated TypeScript handler body

  // Deployment
  status        SkillStatus @default(DRAFT)
  walletAddress String?
  walletKey     String?                // AES-encrypted private key
  port          Int?
  endpointUrl   String?
  processId     String?

  // Metrics (denormalized for speed)
  totalCalls  Int      @default(0)
  totalEarned Float    @default(0)
  lastCalledAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  calls SkillCall[]
}

model SkillCall {
  id         String   @id @default(cuid())
  skillId    String
  skill      Skill    @relation(fields: [skillId], references: [id])
  callerAddr String?
  paidUsd    Float
  success    Boolean
  durationMs Int
  createdAt  DateTime @default(now())
}

enum SkillStatus {
  DRAFT
  DEPLOYING
  LIVE
  STOPPED
  ERROR
}

enum SkillCategory {
  DATA
  FINANCE
  AI
  UTILITY
  SOCIAL
  DEVELOPER
  CUSTOM
}
```

### 6.2 AI Code Generation Endpoint

```typescript
// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();

const bodySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(10),
  inputSchema: z.record(z.string()),
  outputSchema: z.record(z.string()),
  priceUsd: z.number().positive(),
});

const SYSTEM_PROMPT = `You are a TypeScript developer writing handler functions for
PinionOS x402 skill servers. Generate clean, working handler code.

Rules:
- The handler receives (req: Request, res: Response) — Express style
- Read input from req.body or req.params
- Always validate inputs and return clear error messages
- Return JSON via res.json({ ... })
- Use only built-in Node.js or universally available packages (no exotic deps)
- Write a one-line JSDoc comment at the top
- Return ONLY the handler function body — no imports, no exports, no wrappers
- Keep it under 30 lines`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, description, inputSchema, outputSchema, priceUsd } = parsed.data;

  const userPrompt = `Skill: ${name}
Description: ${description}
Price: $${priceUsd} USDC per call
Input: ${JSON.stringify(inputSchema)}
Output: ${JSON.stringify(outputSchema)}

Write the async handler function body.`;

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const code =
    message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ code: code.trim() });
}
```

### 6.3 Skills CRUD

```typescript
// app/api/skills/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/skills - public, returns all LIVE skills
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("q");
  const mine = searchParams.get("mine");

  const session = await getServerSession();

  const where: any = {};

  if (mine && session?.user?.name) {
    where.user = { address: session.user.name.toLowerCase() };
  } else {
    where.status = "LIVE";
  }

  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const skills = await prisma.skill.findMany({
    where,
    orderBy: { totalCalls: "desc" },
    select: {
      id: true, name: true, slug: true, description: true,
      category: true, priceUsd: true, totalCalls: true,
      totalEarned: true, status: true, endpointUrl: true,
      createdAt: true, walletAddress: true,
      // Never expose walletKey
    },
  });

  return NextResponse.json(skills);
}

// POST /api/skills - create a new skill (auth required)
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const user = await prisma.user.upsert({
    where: { address: session.user!.name!.toLowerCase() },
    create: { address: session.user!.name!.toLowerCase() },
    update: {},
  });

  const slug = body.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 50) + "-" + Date.now().toString(36);

  const skill = await prisma.skill.create({
    data: {
      userId: user.id,
      name: body.name,
      slug,
      description: body.description,
      category: body.category || "CUSTOM",
      tags: body.tags || [],
      priceUsd: body.priceUsd,
      inputSchema: body.inputSchema,
      outputSchema: body.outputSchema,
      handlerCode: body.handlerCode,
    },
  });

  return NextResponse.json(skill, { status: 201 });
}
```

---

## 7. Skill Deployment Engine

The technical core of PILA. Each skill deployment:
1. Generates a dedicated Base wallet for USDC earnings
2. Writes the user's handler into a `createSkillServer` template
3. Spawns an isolated Node.js child process
4. Waits for the process to signal readiness
5. Returns the live endpoint URL

```typescript
// lib/deploy.ts
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { fork, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import crypto from "crypto";

const runningProcesses = new Map<string, ChildProcess>();
let nextPort = 4100;

function allocatePort(): number {
  return nextPort++;
}

export async function deploySkill(skill: {
  id: string;
  name: string;
  slug: string;
  handlerCode: string;
  priceUsd: number;
  description: string;
}): Promise<{
  walletAddress: string;
  encryptedKey: string;
  port: number;
  endpointUrl: string;
  processId: string;
}> {
  // 1. Generate dedicated earning wallet
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  // 2. Write full skill server code to a temp file
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `sf-skill-`));
  const skillFile = path.join(tmpDir, "index.js");
  const port = allocatePort();

  await fs.writeFile(skillFile, buildSkillCode({
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    priceUsd: skill.priceUsd,
    handlerCode: skill.handlerCode,
    walletAddress: account.address,
  }));

  // 3. Spawn isolated process
  const child = fork(skillFile, [], {
    env: {
      ...process.env,
      SKILL_PORT: String(port),
      ADDRESS: account.address,
      PINION_PRIVATE_KEY: privateKey,
      FACILITATOR_URL: process.env.FACILITATOR_URL || "https://facilitator.payai.network",
      PINION_NETWORK: process.env.PINION_NETWORK || "base",
    },
    silent: true,
  });

  runningProcesses.set(skill.id, child);

  child.on("exit", (code) => {
    runningProcesses.delete(skill.id);
    console.log(`Skill ${skill.slug} exited with code ${code}`);
  });

  // 4. Wait for ready signal
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Skill ${skill.slug} startup timed out`)),
      12000
    );
    child.on("message", (msg: any) => {
      if (msg?.type === "ready") {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const endpointUrl = `${baseUrl}/api/proxy/${skill.slug}`;

  return {
    walletAddress: account.address,
    encryptedKey: encryptPrivateKey(privateKey),
    port,
    endpointUrl,
    processId: String(child.pid),
  };
}

export function stopSkill(skillId: string): void {
  const child = runningProcesses.get(skillId);
  if (child) {
    child.kill("SIGTERM");
    runningProcesses.delete(skillId);
  }
}

// Encrypt private key before storing in DB
function encryptPrivateKey(key: string): string {
  const secret = process.env.ENCRYPT_SECRET!;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(secret.padEnd(32).slice(0, 32)),
    iv
  );
  const encrypted = Buffer.concat([cipher.update(key), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function buildSkillCode({
  slug, name, description, priceUsd, handlerCode, walletAddress
}: {
  slug: string; name: string; description: string;
  priceUsd: number; handlerCode: string; walletAddress: string;
}): string {
  return `
const { createSkillServer, skill } = require("pinion-os/server");

const server = createSkillServer({
  payTo: "${walletAddress}",
  network: process.env.PINION_NETWORK || "base",
});

server.add(skill("${slug}", {
  price: "$${priceUsd}",
  endpoint: "/run",
  handler: async (req, res) => {
    try {
      ${handlerCode}
    } catch (err) {
      res.status(500).json({ error: "Skill handler error", detail: err.message });
    }
  },
}));

const port = parseInt(process.env.SKILL_PORT || "4100");

server.listen(port, () => {
  if (process.send) process.send({ type: "ready", port, skill: "${name}" });
  console.log("[PILA] Skill '${name}' live on port " + port);
});
`;
}
```

### Proxy Endpoint

```typescript
// app/api/proxy/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const skill = await prisma.skill.findUnique({
    where: { slug: params.slug },
  });

  if (!skill || skill.status !== "LIVE" || !skill.port) {
    return NextResponse.json(
      { error: "Skill not found or not running" },
      { status: 404 }
    );
  }

  const start = Date.now();
  const body = await req.text();

  // Forward payment headers + body to internal process
  const forwardHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const payment = req.headers.get("x-payment");
  if (payment) forwardHeaders["X-PAYMENT"] = payment;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`http://localhost:${skill.port}/run`, {
      method: "POST",
      headers: forwardHeaders,
      body,
    });
  } catch {
    return NextResponse.json({ error: "Skill unreachable" }, { status: 503 });
  }

  const duration = Date.now() - start;
  const success = upstreamRes.status === 200;

  // Log call asynchronously (don't await)
  prisma.skillCall.create({
    data: {
      skillId: skill.id,
      paidUsd: success ? skill.priceUsd : 0,
      success,
      durationMs: duration,
    },
  }).then(() => {
    if (success) {
      prisma.skill.update({
        where: { id: skill.id },
        data: {
          totalCalls: { increment: 1 },
          totalEarned: { increment: skill.priceUsd },
          lastCalledAt: new Date(),
        },
      });
    }
  });

  const responseText = await upstreamRes.text();
  return new NextResponse(responseText, {
    status: upstreamRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
```

---

## 8. Frontend Design

### 8.1 Landing Page

**Hero:**
```
PILA
Build & sell AI skills in 2 minutes.
No code. No servers. Just describe it — we deploy it.

[ Start Building → ]     [ Browse Marketplace ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  312 skills deployed  ·  $2,841 earned  ·  19,204 calls served
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**How It Works (3 steps visual):**
```
  1. Describe           2. Generate           3. Deploy & Earn
  ─────────────         ─────────────         ─────────────────
  Tell us what          Claude writes          Live x402 endpoint
  your skill does       the TypeScript         earning USDC in
  and set a price       handler for you        seconds
```

**Featured Skills:** 4 live skill cards from marketplace

**Stats auto-refresh** every 30s using `setInterval` + SWR

---

### 8.2 Builder Page (2-Column Layout)

**Left Column — Form:**

```
Build a New Skill
─────────────────────────────────

Skill Name *
┌─────────────────────────────────┐
│ Crypto Fear & Greed Score       │
└─────────────────────────────────┘

Category
┌──────────┐
│ Finance ▾│
└──────────┘

What does this skill do? *
┌─────────────────────────────────┐
│ Returns the current crypto      │
│ market fear & greed index       │
│ (0-100) with label and a brief  │
│ market interpretation.          │
└─────────────────────────────────┘

Input Schema (JSON) *
┌─────────────────────────────────┐
│ {}                              │
└─────────────────────────────────┘
(no input required for this skill)

Output Schema (JSON) *
┌─────────────────────────────────┐
│ {                               │
│   "score": "number",            │
│   "label": "string",            │
│   "interpretation": "string"    │
│ }                               │
└─────────────────────────────────┘

Price per call
┌────────┐
│$ 0.03  │  USDC
└────────┘

[ ✨ Generate Handler Code ]
```

**Right Column — Monaco Editor:**

After clicking Generate:
```typescript
/** Returns crypto fear & greed index with market interpretation */

// Simulate fear & greed index (replace with real API like alternative.me)
const score = Math.floor(Math.random() * 100);

const label =
  score <= 20 ? "Extreme Fear" :
  score <= 40 ? "Fear" :
  score <= 60 ? "Neutral" :
  score <= 80 ? "Greed" : "Extreme Greed";

const interpretation =
  score < 30 ? "Market is fearful — historically a buying opportunity" :
  score > 70 ? "Market is greedy — consider taking profits" :
  "Market sentiment is balanced — watch for breakouts";

res.json({ score, label, interpretation });
```

Below the editor:
```
[ Edit Code ]    [ 🚀 Deploy Skill ]
```

**After Deploy — Success Card:**
```
╔═══════════════════════════════════════════════════════════════╗
║  ✅  Your Skill is LIVE!                                      ║
║                                                               ║
║  Endpoint:  https://pila.app/api/proxy/crypto-fng-1k8b ║
║  Wallet:    0xABCD...1234 (earning USDC on Base)              ║
║  Price:     $0.03 per call                                    ║
║                                                               ║
║  ─── SDK Snippet ─────────────────────────────────────────── ║
║                                                               ║
║  import { PinionClient } from "pinion-os";                    ║
║  const p = new PinionClient({ privateKey: YOUR_KEY });        ║
║  const r = await p.callSkill(                                 ║
║    "https://pila.app/api/proxy/crypto-fng-1k8b",        ║
║    {}                                                         ║
║  );                                                           ║
║                                                               ║
║  [ Copy SDK Snippet ]  [ Marketplace ↗ ]  [ Plugin JSON ↓ ]  ║
╚═══════════════════════════════════════════════════════════════╝
```

**DeploymentStatus Animation:**
```
Generating wallet...      ⏳
Starting server...        ⏳
Testing endpoint...       ⏳
Live!                     ✅
```
Each step ticks with a 500ms delay for visual drama.

---

### 8.3 Marketplace Page

**Header:**
```
┌────────────────────────────────────────────────┐
│  🔍  Search skills...                          │
└────────────────────────────────────────────────┘

[ All ] [ Data ] [ Finance ] [ AI ] [ Utility ] [ Developer ] [ Custom ]
Sort: Most Called ▾
```

**Skill Grid (3 columns on desktop, 1 on mobile):**
```
┌─────────────────────────┐  ┌─────────────────────────┐
│  📈 Crypto Fear & Greed  │  │  🌤️ Weather Reporter    │
│  Returns current market  │  │  Returns current weather │
│  fear & greed score...   │  │  for any city...        │
│                          │  │                         │
│  FINANCE          $0.03  │  │  DATA             $0.02  │
│  ████████ 312 calls      │  │  █████ 142 calls         │
│  $9.36 earned            │  │  $2.84 earned            │
│                          │  │                         │
│  [ Test → ]  [ SDK ↗ ]  │  │  [ Test → ]  [ SDK ↗ ] │
└─────────────────────────┘  └─────────────────────────┘
```

---

### 8.4 Skill Detail Page

**Top Section:** Name, category, description, creator address, live badge

**Stats Bar:**
```
312 calls  ·  $9.36 earned  ·  ~45ms avg  ·  Live since Feb 26
```

**Live Test Panel:**
```
Test This Skill
───────────────────────────────
Input (JSON):
┌───────────────────────────────┐
│ {}                            │
└───────────────────────────────┘

[ Test Call ($0.03 USDC) ]

Response:
┌───────────────────────────────┐
│ {                             │
│   "score": 34,                │
│   "label": "Fear",            │
│   "interpretation": "Market   │
│   is fearful — historically   │
│   a buying opportunity"       │
│ }                             │
└───────────────────────────────┘
Latency: 41ms
```

**SDK Snippets (tabs):**
- TypeScript (PinionClient)
- curl (raw x402)

**OpenClaw Integration:**
```
[ ↓ Download openclaw.plugin.json ]
Install in OpenClaw: clawhub install crypto-fear-greed-1k8b
```

---

### 8.5 Dashboard Page

**My Skills Table:**
```
Name                  Status      Calls    Earned    Actions
─────────────────────────────────────────────────────────────
Crypto Fear & Greed   🟢 Live      312     $9.36    [Stop][Edit]
Weather Reporter      🟢 Live      142     $2.84    [Stop][Edit]
Stock Screener        ⏸ Stopped    87      $4.35    [Start][Delete]
```

**Earnings Overview:**
```
Total Earned: $16.55 USDC

[Recharts area chart — earnings over last 7 days]

Top Skill: Crypto Fear & Greed — $9.36
```

**Withdraw Panel:**
```
Withdraw Earnings
─────────────────────────────────────
Crypto Fear & Greed:  $9.36   [ Withdraw ]
Weather Reporter:     $2.84   [ Withdraw ]
Stock Screener:       $4.35   [ Withdraw ]

Total available: $16.55 USDC
[ Withdraw All to My Wallet ]

Destination: 0xYOUR...WALLET
```

---

### 8.6 Design System

**Colors:**
```css
--background:   #0F0F11;  /* near-black */
--surface:      #1A1A1F;  /* cards */
--border:       #2A2A35;  /* subtle lines */
--primary:      #7C3AED;  /* violet — actions */
--primary-h:    #8B5CF6;  /* hover */
--success:      #10B981;  /* live / earned */
--warning:      #F59E0B;  /* deploying */
--error:        #EF4444;  /* stopped / error */
--text:         #F9FAFB;
--text-muted:   #6B7280;
--code-bg:      #111827;
```

**Typography:** Inter (UI text) + JetBrains Mono (code, addresses, amounts)

**Animations:**
- Deployment steps: sequential fade-in with 500ms delays
- Stats ticker: smooth number increment on update
- Skill card hover: subtle border glow in primary color
- Earnings chart: smooth draw-on animation

---

## 9. PinionOS & OpenClaw Integration

### PinionOS SDK — Three Integration Points

**1. Skill Server Framework (every deployed skill)**
```typescript
// Inside each spawned skill process
const { createSkillServer, skill } = require("pinion-os/server");

const server = createSkillServer({
  payTo: walletAddress,   // Skill's earning wallet
  network: "base",
});

server.add(skill(slug, {
  price: `$${priceUsd}`,
  endpoint: "/run",
  handler: async (req, res) => {
    // User's AI-generated handler code
  },
}));
```

**2. PinionClient (live test panel calls)**
```typescript
// lib/pinion.ts
import { PinionClient } from "pinion-os";

export function getTestClient() {
  return new PinionClient({
    privateKey: process.env.PINION_PRIVATE_KEY!,
  });
}
```

The live test panel in the marketplace calls skills through a server-side
API route that uses this test client — users can test any skill from the
browser without needing their own wallet or USDC.

**3. Wallet Generation**
```typescript
// lib/wallet.ts
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export function generateSkillWallet() {
  const privateKey = generatePrivateKey();
  const { address } = privateKeyToAccount(privateKey);
  return { privateKey, address };
}
```

### OpenClaw Plugin Auto-Generation

```typescript
// lib/plugin-generator.ts
export function generateOpenClawPlugin(skill: {
  slug: string;
  name: string;
  description: string;
  endpointUrl: string;
  priceUsd: number;
  inputSchema: Record<string, string>;
}) {
  return {
    name: skill.slug,
    version: "1.0.0",
    displayName: skill.name,
    description: `${skill.description} — costs $${skill.priceUsd} USDC per call via x402`,
    tools: [
      {
        name: skill.slug.replace(/-/g, "_"),
        description: skill.description,
        inputSchema: {
          type: "object",
          properties: Object.fromEntries(
            Object.entries(skill.inputSchema).map(([k, v]) => [
              k,
              { type: v, description: k },
            ])
          ),
        },
        endpoint: skill.endpointUrl,
        payment: {
          protocol: "x402",
          price: `$${skill.priceUsd}`,
          network: "base",
          currency: "USDC",
        },
      },
    ],
    install: `clawhub install ${skill.slug}`,
  };
}
```

Served at `/api/plugin/[skillId]` — returns the JSON with
`Content-Disposition: attachment; filename="openclaw.plugin.json"`.

---

## 10. Day-by-Day Build Plan

**Hackathon window: Feb 22 – Mar 1, 2026 (7 days)**
**Deadline: March 1, 11:00**

---

### Day 1 (Feb 22) — Foundation

**Morning:**
- [ ] `npx create-next-app@latest pila --typescript --tailwind --app --src-dir --import-alias "@/*"`
- [ ] Install dependencies:
  ```bash
  npm install pinion-os @anthropic-ai/sdk prisma @prisma/client
  npm install viem wagmi @rainbow-me/rainbowkit next-auth
  npm install @monaco-editor/react recharts lucide-react zod
  npx shadcn@latest init
  npx shadcn@latest add button input card badge tabs toast dialog
  ```
- [ ] Create Supabase project → get `DATABASE_URL`
- [ ] Write `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Get Base Sepolia USDC from Coinbase faucet
- [ ] Set up `.env.local` with all keys

**Afternoon:**
- [ ] Configure RainbowKit + wagmi providers in `app/layout.tsx`
- [ ] Set up NextAuth with SIWE (Sign In With Ethereum)
- [ ] Build site navigation: Logo, Marketplace, Builder, Dashboard, Connect Wallet
- [ ] Landing page skeleton with hero and placeholder stats
- [ ] Confirm DB + auth working end-to-end

**Day 1 Done:** Running app, DB connected, wallet auth working.

---

### Day 2 (Feb 23) — AI Code Generation

**Morning:**
- [ ] Write `lib/claude.ts` with `generateHandlerCode()` function
- [ ] Write `app/api/generate/route.ts`
- [ ] Test with 5 different skill descriptions, refine system prompt until output is clean

**Afternoon:**
- [ ] Build `BuilderForm.tsx`: all form fields + validation
- [ ] Build `CodePreview.tsx` using `@monaco-editor/react`
- [ ] Wire "Generate" button → API call → render code in Monaco
- [ ] Build `app/builder/page.tsx` with two-column layout
- [ ] Auth guard: redirect to connect wallet if not signed in

**Day 2 Done:** User can fill builder form, click Generate, see TypeScript appear in Monaco.

---

### Day 3 (Feb 24) — Deployment Engine

**Morning:**
- [ ] Write `lib/wallet.ts`: `generateSkillWallet()`, `encryptPrivateKey()`, `decryptPrivateKey()`
- [ ] Write `skill-runtime/template.ts`: the `buildSkillCode()` function
- [ ] Write `lib/deploy.ts`: `deploySkill()` using `child_process.fork()`
- [ ] Write `app/api/skills/route.ts`: POST creates Skill in DB

**Afternoon:**
- [ ] Write `app/api/skills/[skillId]/deploy/route.ts`: calls `deploySkill()`, updates DB
- [ ] Write `app/api/proxy/[slug]/route.ts`: forwards to internal port, logs call
- [ ] Manual end-to-end test:
  1. POST to create skill
  2. POST to deploy
  3. Confirm child process running
  4. Call proxy with `PinionClient` on Base Sepolia
  5. Confirm USDC payment signed + response received
- [ ] Handle edge cases: port collision, timeout, bad handler code

**Day 3 Done:** Can deploy a real skill and call it with real x402 micropayment.

---

### Day 4 (Feb 25) — Deploy UX + Success State

**Morning:**
- [ ] Build `DeploymentStatus.tsx` with step-by-step animation
  (poll `/api/skills/[id]` every second until status = LIVE)
- [ ] Wire "Deploy" button in builder to show `DeploymentStatus`
- [ ] Build success card with endpoint URL, SDK snippet, plugin download

**Afternoon:**
- [ ] Build `SDKSnippet.tsx`: TypeScript tab + curl tab, copy-to-clipboard
- [ ] Write `lib/plugin-generator.ts`
- [ ] Write `app/api/plugin/[skillId]/route.ts`
- [ ] Write `app/api/skills/[skillId]/stop/route.ts`: kills process, updates DB
- [ ] Full builder flow test: create → generate → deploy → success card → download plugin

**Day 4 Done:** Full builder works end-to-end, plugin JSON downloadable.

---

### Day 5 (Feb 26) — Marketplace + Skill Detail

**Morning:**
- [ ] Build `SkillCard.tsx` component
- [ ] Build `app/marketplace/page.tsx`: fetches live skills, renders grid
- [ ] Add search (client-side filter on name/description)
- [ ] Add category filter tabs
- [ ] Add sort options (most called, newest, lowest price)

**Afternoon:**
- [ ] Build `app/marketplace/[skillId]/page.tsx`
- [ ] Build `TestSkillPanel.tsx`: JSON input, "Test" button → server-side call → show response
- [ ] Wire test panel to `/api/proxy/[slug]` (paid from PILA test wallet)
- [ ] SDK snippet tabs on skill detail
- [ ] Download plugin JSON button
- [ ] Stats: calls, earned, avg latency (calculated from SkillCall records)

**Day 5 Done:** Marketplace shows all skills, skill detail has working live test panel.

---

### Day 6 (Feb 27) — Dashboard + Polish

**Morning:**
- [ ] Build `app/dashboard/page.tsx`
- [ ] Skills table with status badges, metrics, start/stop/delete actions
- [ ] Write `app/api/skills/[skillId]/metrics/route.ts`
- [ ] Build `EarningsChart.tsx`: Recharts area chart of daily earnings
- [ ] Build withdraw panel (simulate transfer for demo, show txHash)
- [ ] Write `app/api/withdraw/route.ts`

**Afternoon:**
- [ ] Landing page final polish:
  - Live stats auto-refresh (SWR with 30s revalidation)
  - Featured skills section
  - How-it-works steps
- [ ] Global polish pass:
  - Loading skeletons on all data-fetching components
  - Error states with clear messages
  - Empty states (no skills yet, marketplace empty)
  - Toast notifications on all actions
  - Mobile responsiveness check on all pages
  - Consistent spacing and typography

**Day 6 Done:** Fully working product, polished across all pages and states.

---

### Day 7 (Mar 1) — Ship, Record, Submit

**Morning (3h):**
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Set all environment variables in Vercel dashboard
- [ ] Smoke test production:
  - Create a skill end-to-end on prod
  - Deploy it
  - Find it in marketplace
  - Test-call it from the live test panel
  - Verify earnings appear in dashboard
  - Download and inspect plugin JSON
- [ ] Fix any prod-only issues
- [ ] Pre-seed 4–5 quality example skills so marketplace looks active for judges

**Mid-Morning (2h):**
- [ ] Final README write (clean, comprehensive, see template)
- [ ] Push all code, ensure repo is public
- [ ] Code quality pass: remove debug logs, add comments to `deploy.ts`
- [ ] Tweet at @PinionOS: "Just shipped PILA for the @PinionOS hackathon — no-code skill builder & marketplace. Build + deploy an earning x402 skill in 2 minutes. [link] #PinionOS"

**Late Morning (1.5h):**
- [ ] Record demo video using screen recorder (aim for 2–3 min)
- [ ] Upload to YouTube (unlisted)
- [ ] **Submit on DoraHacks before 11:00**

---

## 11. Testing Strategy

### Manual Test Scenarios

**Auth:**
- Connect wallet → Sign In With Ethereum → session persists on refresh
- Accessing `/builder` without auth → redirected to connect

**Builder:**
- Form validation: empty name, price = 0, missing description → shows errors
- Code generation: test 4 different categories (data, finance, AI, utility)
- Monaco editor: manual edits persist when deploying
- Deploy with bad code (syntax error) → shows ERROR status, clear message
- Deploy twice: second deploy stops first process

**Deployment:**
- Deployed skill responds to direct curl on internal port
- Proxy correctly forwards with x402 headers
- Call without X-PAYMENT header → 402 response returned
- Call with valid signed payment → 200 + data returned
- Call logged in DB, totalCalls + totalEarned incremented
- Stop skill → process killed, status = STOPPED
- Restart stopped skill → new process, status = LIVE

**Marketplace:**
- DRAFT and STOPPED skills do not appear in marketplace
- Search finds skills by name and description
- Category filter works
- Live test panel calls real skill, shows real response

**Dashboard:**
- Only shows current user's skills
- Start/stop/delete work correctly
- Earnings chart shows data after calls are made
- Withdraw button (simulated) shows a txHash

**Plugin JSON:**
- JSON structure is valid
- All required fields present: name, version, tools, payment info
- Download works from both skill detail and builder success card

---

## 12. Demo Script

**Duration: 2.5 – 3 minutes**
**Setup: Two windows open — PILA app and a terminal**

**[0:00–0:15] Hook**
> "Building a PinionOS skill server from scratch takes TypeScript, server setup,
> and 30 minutes. Watch me deploy a live, earning x402 skill in 90 seconds.
> This is PILA."

**[0:15–0:50] Build a Skill**
> - Navigate to `/builder`
> - Fill form: Name = "Crypto Fear & Greed Index", Category = Finance,
>   Description = "Returns the current crypto fear & greed score with market interpretation"
>   Price = $0.03
> - Click "Generate Handler Code"
> - Watch Monaco populate with Claude's TypeScript in about 3 seconds
> - "Claude just wrote the handler. I can edit it if I want."

**[0:50–1:20] Deploy**
> - Click "Deploy Skill"
> - Watch animation: Generating wallet → Starting server → Live ✅
> - "We now have a live x402 endpoint. Each call settles $0.03 USDC to
>   a dedicated Base wallet."
> - Show endpoint URL, point to the SDK snippet

**[1:20–1:45] Call It**
> - Switch to terminal, paste the SDK snippet
> - Run it: `node test.js`
> - Show the response: `{ score: 34, label: "Fear", interpretation: "..." }`
> - "That call paid $0.03 USDC on Base. Automatic. No forms, no keys to share."

**[1:45–2:10] Marketplace**
> - Navigate to `/marketplace`
> - "Every skill is discoverable here — by any PinionOS client or OpenClaw agent."
> - Click "Test" on the Fear & Greed skill
> - Enter `{}`, click Test, see response appear in browser
> - Show the "Download openclaw.plugin.json" button: "Any OpenClaw user can install
>   this skill with one command."

**[2:10–2:35] Dashboard**
> - Navigate to `/dashboard`
> - "After those two calls, I've earned $0.06 USDC. I can see my call history,
>   earnings chart, and withdraw whenever I want."

**[2:35–3:00] Close**
> "PILA turns PinionOS from a developer primitive into a 2-minute product.
> Every skill deployed here becomes a new earning node in the PinionOS ecosystem —
> callable by any agent on Base, right now."
> Show GitHub repo briefly.

---

## 13. README Template

```markdown
# PILA

> Deploy earning PinionOS x402 skills in 2 minutes. No code required.

## What Is It?

PILA is a no-code platform built on PinionOS. Describe your skill in plain
English, set a USDC price, and PILA generates the handler code, deploys a
live x402-paywalled endpoint, and starts earning on Base automatically.

## How PinionOS Is Used

PILA uses the `pinion-os` package in three ways:

### 1. Skill Servers (`pinion-os/server`)
Every deployed skill is an isolated Node.js process running:
```typescript
const { createSkillServer, skill } = require("pinion-os/server");
const server = createSkillServer({ payTo: skillWallet, network: "base" });
server.add(skill(slug, { price: "$0.03", endpoint: "/run", handler }));
server.listen(port);
```
Each skill has a dedicated wallet. USDC from x402 payments settles directly
to that wallet on Base via `facilitator.payai.network`.

### 2. PinionClient (live test panel)
The marketplace test panel uses `PinionClient` server-side to make real paid
calls, so visitors can test any skill without their own wallet or USDC.

### 3. Wallet generation
Each deployed skill gets a unique Base wallet generated via viem, ensuring
earnings are isolated and creator-controlled.

## Features
- No-code skill builder with Claude-generated TypeScript handlers
- One-click deployment to live x402 endpoints
- Public marketplace with search, live test panel, and SDK snippets
- Real-time earnings dashboard with USDC withdrawal
- Auto-generated `openclaw.plugin.json` for every skill

## Tech Stack
Next.js 14 · TypeScript · Prisma · Supabase · pinion-os · Claude API · viem

## Setup
\`\`\`bash
git clone https://github.com/[you]/pila
cd pila && npm install
cp .env.example .env.local   # Fill in all values
npx prisma migrate dev
npm run dev
\`\`\`

## Live App
https://pila.vercel.app

## Demo Video
[YouTube link]
```

---

## 14. Submission Checklist

### Code
- [ ] Public GitHub repository, clean commit history, no secrets committed
- [ ] README clearly explains how `pinion-os` is used (specific SDK functions)
- [ ] `.env.example` documents all required variables
- [ ] Code is readable, well-commented where complex

### Core Functionality
- [ ] Skill creation form works with validation
- [ ] Claude code generation produces working handler code
- [ ] Deployment creates a live x402 endpoint callable via `PinionClient`
- [ ] x402 payments work on Base (verifiable USDC transfer)
- [ ] Proxy routes correctly log calls and update earnings
- [ ] Marketplace shows live skills with search and category filter
- [ ] Live test panel calls real skills from the browser
- [ ] Dashboard shows correct stats and earnings
- [ ] `openclaw.plugin.json` downloads correctly and is valid

### Deployment
- [ ] Frontend deployed on Vercel with public URL
- [ ] Supabase DB running in production
- [ ] 4–5 pre-seeded skills on marketplace for judges to explore
- [ ] All Vercel env vars set

### Submission Requirements
- [ ] Tweet mentioning @PinionOS with app link and short description
- [ ] GitHub repo link ready
- [ ] Demo video recorded (under 3 min), uploaded to YouTube
- [ ] DoraHacks submission form completed before **March 1, 11:00**

---

## 15. Environment Variables

```bash
# ─── Database ──────────────────────────────────────────────────
DATABASE_URL=postgresql://...              # Supabase Postgres URL

# ─── Auth ──────────────────────────────────────────────────────
NEXTAUTH_SECRET=                           # 32+ random characters
NEXTAUTH_URL=https://pila.vercel.app

# ─── AI ────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=                         # For Claude code generation

# ─── PinionOS / x402 ───────────────────────────────────────────
PINION_PRIVATE_KEY=0x...                   # Test wallet (USDC on Base)
PINION_NETWORK=base                        # or base-sepolia for dev
FACILITATOR_URL=https://facilitator.payai.network

# ─── App ───────────────────────────────────────────────────────
NEXT_PUBLIC_BASE_URL=https://pila.vercel.app
ENCRYPT_SECRET=                            # 32-char secret for wallet key encryption

# ─── Optional ──────────────────────────────────────────────────
BASE_RPC_URL=https://mainnet.base.org
```

---

*Built for the PinionOS Hackathon — Feb 22 to March 1, 2026*
*Strategy: Win 1st place ($1,500) by building the product layer the PinionOS ecosystem needs*