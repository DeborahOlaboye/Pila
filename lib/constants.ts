export const SKILL_CATEGORIES = [
  "DATA",
  "FINANCE",
  "AI",
  "UTILITY",
  "SOCIAL",
  "DEVELOPER",
  "CUSTOM",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  DATA: "Data",
  FINANCE: "Finance",
  AI: "AI",
  UTILITY: "Utility",
  SOCIAL: "Social",
  DEVELOPER: "Developer",
  CUSTOM: "Custom",
};

export const CATEGORY_ICONS: Record<string, string> = {
  DATA: "📊",
  FINANCE: "💰",
  AI: "🤖",
  UTILITY: "⚡",
  SOCIAL: "🌐",
  DEVELOPER: "🛠️",
  CUSTOM: "✨",
};

export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const FACILITATOR_URL =
  process.env.FACILITATOR_URL || "https://facilitator.payai.network";

export const PINION_NETWORK = process.env.PINION_NETWORK || "base-sepolia";
