// Use spawn instead of fork — spawn runs `node <file>` directly so
// Turbopack doesn't try to statically resolve the dynamic file path.
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";
import { generateSkillWallet, encryptPrivateKey } from "./wallet";
import { buildSkillCode } from "@/skill-runtime/template";

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
  const { privateKey, address: walletAddress } = generateSkillWallet();

  const skillsDir = path.join(process.cwd(), ".skill-processes");
  await fs.mkdir(skillsDir, { recursive: true });
  const tmpDir = path.join(skillsDir, `skill-${skill.id}`);
  await fs.mkdir(tmpDir, { recursive: true });
  const skillFile = path.join(tmpDir, "index.mjs");
  const port = allocatePort();

  // Write a wrapper that sends IPC "ready" message back
  const wrapperCode = buildSkillCode({
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    priceUsd: skill.priceUsd,
    handlerCode: skill.handlerCode,
    walletAddress,
  });
  await fs.writeFile(skillFile, wrapperCode);

  const projectRoot = path.resolve(process.cwd());
  const child = spawn(process.execPath, [skillFile], {
    env: {
      ...process.env,
      SKILL_PORT: String(port),
      ADDRESS: walletAddress,
      PINION_PRIVATE_KEY: privateKey,
      FACILITATOR_URL:
        process.env.FACILITATOR_URL || "https://facilitator.payai.network",
      PINION_NETWORK: process.env.PINION_NETWORK || "base",
      PILA_IPC: "1",
      // Allow temp skill file to resolve node_modules from project root
      NODE_PATH: path.join(projectRoot, "node_modules"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  runningProcesses.set(skill.id, child);

  child.on("exit", (code) => {
    runningProcesses.delete(skill.id);
    console.log(`[PILA] Skill ${skill.slug} exited with code ${code}`);
  });

  // Wait for the skill to log it's ready (parse stdout)
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Skill ${skill.slug} startup timed out`)),
      15000
    );
    let stderrOutput = "";

    child.stderr?.on("data", (data: Buffer) => {
      stderrOutput += data.toString();
      console.error(`[PILA skill stderr] ${data.toString()}`);
    });

    child.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      console.log(`[PILA skill stdout] ${text}`);
      if (text.includes("pinion skill server on port")) {
        clearTimeout(timeout);
        resolve();
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on("exit", (code) => {
      if (code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Skill process exited with code ${code}:\n${stderrOutput}`));
      }
    });
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const endpointUrl = `${baseUrl}/api/proxy/${skill.slug}`;

  return {
    walletAddress,
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

export function isRunning(skillId: string): boolean {
  return runningProcesses.has(skillId);
}
