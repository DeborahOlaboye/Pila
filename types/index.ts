export type SkillStatus = "DRAFT" | "DEPLOYING" | "LIVE" | "STOPPED" | "ERROR";
export type SkillCategory = "DATA" | "FINANCE" | "AI" | "UTILITY" | "SOCIAL" | "DEVELOPER" | "CUSTOM";

export interface Skill {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string;
  category: SkillCategory;
  tags: string[];
  priceUsd: number;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  handlerCode: string;
  status: SkillStatus;
  walletAddress?: string | null;
  port?: number | null;
  endpointUrl?: string | null;
  processId?: string | null;
  totalCalls: number;
  totalEarned: number;
  lastCalledAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SkillCall {
  id: string;
  skillId: string;
  callerAddr?: string | null;
  paidUsd: number;
  success: boolean;
  durationMs: number;
  createdAt: Date | string;
}

export interface PublicSkill {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: SkillCategory;
  priceUsd: number;
  totalCalls: number;
  totalEarned: number;
  status: SkillStatus;
  endpointUrl?: string | null;
  walletAddress?: string | null;
  createdAt: Date | string;
}
