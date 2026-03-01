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
  // Strip markdown fences and any wrapping function declaration the AI may have added
  const cleaned = handlerCode
    .replace(/```[a-z]*/gi, "")
    .replace(/```/g, "")
    .replace(/^async\s*\(req,\s*res\)\s*=>\s*\{/, "")  // remove outer arrow fn opening
    .replace(/^async\s+function\s*\w*\s*\([^)]*\)\s*\{/, "")  // remove function declaration
    .replace(/\}[\s;]*$/, "")  // remove trailing closing brace
    .trim();

  return `
import { createSkillServer, skill } from "pinion-os/server";

const server = createSkillServer({
  payTo: "${walletAddress}",
  network: process.env.PINION_NETWORK || "base",
});

server.add(skill("${slug}", {
  price: "$${priceUsd}",
  endpoint: "/run",
  method: "POST",
  handler: async (req, res) => {
    try {
      ${cleaned}
    } catch (err) {
      res.status(500).json({ error: "Skill handler error", detail: err.message });
    }
  },
}));

const port = parseInt(process.env.SKILL_PORT || "4100");
server.listen(port);
`.trim();
}
