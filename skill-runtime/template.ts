export function buildSkillCode({
  slug,
  name,
  description,
  priceUsd,
  handlerCode,
  walletAddress,
}: {
  slug: string;
  name: string;
  description: string;
  priceUsd: number;
  handlerCode: string;
  walletAddress: string;
}): string {
  const indentedHandler = handlerCode.split("\n").join("\n      ");
  const isPaid = priceUsd > 0;

  return `
import express from "express";
${isPaid ? `import { paymentMiddleware } from "x402-express";` : ""}

const app = express();
app.use(express.json());

// CORS
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-PAYMENT, Accept");
  res.header("Access-Control-Expose-Headers", "X-PAYMENT-RESPONSE");
  if (_req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});

${isPaid ? `
// x402 payment enforcement
const walletAddress = process.env.ADDRESS || "${walletAddress}";
const network = process.env.PINION_NETWORK || "base";
const facilitatorUrl = process.env.FACILITATOR_URL || "https://x402.org/facilitator";

app.use(paymentMiddleware(walletAddress, {
  "POST /run": {
    price: "$${priceUsd}",
    network,
  },
}, { url: facilitatorUrl }));
` : ""}

// Skill handler
app.post("/run", async (req, res) => {
  try {
    ${indentedHandler}
  } catch (err) {
    res.status(500).json({ error: "Skill handler error", detail: String(err) });
  }
});

// Catalog endpoint for agent discovery
app.get("/catalog", (_req, res) => {
  res.json({
    slug: "${slug}",
    name: "${name}",
    description: "${description}",
    price: "$${priceUsd}",
    network: process.env.PINION_NETWORK || "base",
    payTo: process.env.ADDRESS || "${walletAddress}",
    endpoint: "/run",
    method: "POST",
  });
});

const port = parseInt(process.env.SKILL_PORT || "4100");
app.listen(port, () => {
  console.log(\`pinion skill server on port \${port}\`);
});
`.trim();
}
