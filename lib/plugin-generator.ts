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
