import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a TypeScript developer writing handler functions for PinionOS x402 skill servers. Generate clean, working handler code.

Rules:
- The handler receives (req: Request, res: Response) — Express-style
- Read input from req.body (already parsed as JSON)
- Always validate inputs and return clear error messages
- Return JSON via res.json({ ... })
- Use only built-in Node.js or universally available packages (no exotic deps)
- For external API calls, use native fetch()
- Write a one-line JSDoc comment at the top
- Return ONLY the handler function body — no imports, no exports, no wrappers
- Keep it under 30 lines
- Make the code actually functional with real logic`;

export async function generateHandlerCode(params: {
  name: string;
  description: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  priceUsd: number;
}): Promise<string> {
  const userPrompt = `Skill: ${params.name}
Description: ${params.description}
Price: $${params.priceUsd} USDC per call
Input: ${JSON.stringify(params.inputSchema)}
Output: ${JSON.stringify(params.outputSchema)}

Write the async handler function body.`;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 800,
    temperature: 0.3,
  });

  const code = completion.choices[0]?.message?.content ?? "";
  return code.trim();
}
