import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You write the BODY of an async Express handler function for a PinionOS skill server.

CRITICAL: Output ONLY the statements that go inside the handler body. Do NOT output:
- The function declaration or arrow function wrapper
- Any async (req, res) => { ... } wrapping
- Any imports or exports
- Markdown code fences

CORRECT output example:
const { city } = req.body;
if (!city) return res.json({ error: "city required" });
const r = await fetch(\`https://wttr.in/\${city}?format=j1\`);
const d = await r.json();
res.json({ temp: d.current_condition[0].temp_C });

Rules:
- req.body is already parsed JSON — read inputs from it
- Always validate required inputs
- Use native fetch() for HTTP calls
- Return data via res.json({ ... })
- No exotic npm packages
- Under 25 lines

ABSOLUTE RULES — violation will break the skill:
- NEVER use placeholder, fictional, or example URLs such as api.example.com, example.org, placeholder.com, or any URL you are not certain is real and publicly accessible without authentication.
- If the skill requires an external API that needs a key or doesn't exist as a free public endpoint, implement the logic directly in JavaScript instead (calculations, string manipulation, etc.) and return a computed result.
- Only call real, free, no-auth-required public APIs. Known working examples: wttr.in (weather), api.coinbase.com/v2/prices/:pair/spot (crypto price), api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd (crypto), numbersapi.com/:number (trivia), api.adviceslip.com/advice (advice).
- When in doubt, compute the answer with JavaScript math/logic rather than inventing an API URL.`;


export async function generateHandlerCode(params: {
  name: string;
  description: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  priceUsd: number;
}): Promise<string> {
  const userPrompt = `Skill: ${params.name}
Description: ${params.description}
Input fields: ${JSON.stringify(params.inputSchema)}
Output fields: ${JSON.stringify(params.outputSchema)}

Write ONLY the handler body statements (no function wrapper, no markdown).`;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 600,
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  // Strip markdown fences and any function wrapper the model may have added anyway
  const code = raw
    .replace(/```[\w]*/g, "")
    .replace(/```/g, "")
    .trim();

  // If model still wrapped in a function, extract the body
  const fnBodyMatch = code.match(/(?:async\s*)?\(req,\s*res\)\s*=>\s*\{([\s\S]*)\}\s*;?\s*$/)
    ?? code.match(/(?:async\s+)?function\s*\w*\s*\([^)]*\)\s*\{([\s\S]*)\}\s*;?\s*$/);
  if (fnBodyMatch) {
    return fnBodyMatch[1].trim();
  }

  return code;
}
