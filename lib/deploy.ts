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

const isVercel = !!process.env.VERCEL;

/** Kill any process listening on `port` (best-effort, non-fatal). */
async function freePort(port: number): Promise<void> {
  try {
    const { execSync } = await import("child_process");
    // lsof works on macOS/Linux; suppress errors on Windows/no match
    const pids = execSync(`lsof -ti tcp:${port}`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean);
    for (const pid of pids) {
      try { process.kill(parseInt(pid), "SIGKILL"); } catch { /* already gone */ }
    }
  } catch { /* lsof not available or no process on port */ }
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
  if (isVercel) {
    throw new Error("Skill deployment requires a persistent server. Vercel serverless does not support background processes. Please run PILA on Railway, Render, or a VPS for the deploy feature.");
  }

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

  // Kill anything still occupying this port (e.g. a zombie from a previous deploy)
  await freePort(port);

  const projectRoot = path.resolve(process.cwd());
  const child = spawn(process.execPath, [skillFile], {
    env: {
      ...process.env,
      SKILL_PORT: String(port),
      ADDRESS: walletAddress,
      PINION_PRIVATE_KEY: privateKey,
      FACILITATOR_URL:
        process.env.FACILITATOR_URL || "https://x402.org/facilitator",
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

export async function restartLiveSkills(): Promise<void> {
  if (isVercel) return;

  const { prisma } = await import("./prisma");
  const { decryptPrivateKey } = await import("./wallet");

  const liveSkills = await prisma.skill.findMany({ where: { status: "LIVE" } });

  // Bump nextPort past all ports already reserved by live skills so new
  // deployments never collide with restarted skill processes.
  for (const skill of liveSkills) {
    if (skill.port && skill.port >= nextPort) {
      nextPort = skill.port + 1;
    }
  }

  for (const skill of liveSkills) {
    if (!skill.walletKey || !skill.port) continue;
    if (runningProcesses.has(skill.id)) continue;

    try {
      const privateKey = decryptPrivateKey(skill.walletKey);

      const skillsDir = path.join(process.cwd(), ".skill-processes");
      await fs.mkdir(skillsDir, { recursive: true });
      const tmpDir = path.join(skillsDir, `skill-${skill.id}`);
      await fs.mkdir(tmpDir, { recursive: true });
      const skillFile = path.join(tmpDir, "index.mjs");

      const wrapperCode = buildSkillCode({
        slug: skill.slug,
        name: skill.name,
        description: skill.description,
        priceUsd: skill.priceUsd,
        handlerCode: skill.handlerCode,
        walletAddress: skill.walletAddress!,
      });
      await fs.writeFile(skillFile, wrapperCode);

      // Free the port in case a zombie is still holding it
      await freePort(skill.port);

      const projectRoot = path.resolve(process.cwd());
      const child = spawn(process.execPath, [skillFile], {
        env: {
          ...process.env,
          SKILL_PORT: String(skill.port),
          ADDRESS: skill.walletAddress!,
          PINION_PRIVATE_KEY: privateKey,
          FACILITATOR_URL: process.env.FACILITATOR_URL || "https://x402.org/facilitator",
          PINION_NETWORK: process.env.PINION_NETWORK || "base",
          PILA_IPC: "1",
          NODE_PATH: path.join(projectRoot, "node_modules"),
        },
        stdio: ["ignore", "pipe", "pipe"],
      });

      runningProcesses.set(skill.id, child);

      child.on("exit", (code) => {
        runningProcesses.delete(skill.id);
        console.log(`[PILA] Skill ${skill.slug} exited with code ${code}`);
      });

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

      console.log(`[PILA] Auto-restarted skill: ${skill.slug} on port ${skill.port}`);
    } catch (err) {
      console.error(`[PILA] Failed to restart skill ${skill.slug}:`, err);
      await prisma.skill.update({ where: { id: skill.id }, data: { status: "ERROR" } });
    }
  }
}
