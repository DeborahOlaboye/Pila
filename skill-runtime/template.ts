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
  return `
import { createSkillServer, skill } from "pinion-os/server";

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
server.listen(port);
`.trim();
}
