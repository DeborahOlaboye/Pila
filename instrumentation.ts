export async function register() {
  // Only run in the Node.js runtime (not Edge), and not during build
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { restartLiveSkills } = await import("./lib/deploy");
    await restartLiveSkills().catch((err) =>
      console.error("[PILA] Auto-restart of live skills failed:", err)
    );
  }
}
