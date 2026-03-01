"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { SiweMessage } from "siwe";
import { Loader2 } from "lucide-react";

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const { data: session, status } = useSession();
  const [signing, setSigning] = useState(false);
  const didSign = useRef<string | null>(null);

  // Auto-sign in when wallet connects, auto-sign out when it disconnects
  useEffect(() => {
    if (isConnected && address && !session && status !== "loading") {
      // Skip if we already attempted for this address in this session
      if (didSign.current === address) return;
      handleSiweSignIn(address, chain?.id ?? 8453);
    }

    if (!isConnected && session) {
      didSign.current = null;
      signOut({ redirect: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, session, status]);

  async function handleSiweSignIn(addr: string, chainId: number) {
    setSigning(true);
    didSign.current = addr;
    try {
      // 1. Get nonce from NextAuth
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();

      // 2. Build EIP-4361 message
      const message = new SiweMessage({
        domain: window.location.host,
        address: addr,
        statement: "Sign in to PILA to build and manage your x402 skills.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });
      const messageStr = message.prepareMessage();

      // 3. Request wallet signature
      const signature = await signMessageAsync({ message: messageStr });

      // 4. Sign into NextAuth with the verified signature
      const result = await signIn("credentials", {
        address: addr,
        message: messageStr,
        signature,
        redirect: false,
      });

      if (result?.error) {
        console.error("SIWE sign-in failed:", result.error);
        didSign.current = null;
      }
    } catch (err) {
      // User rejected the signature — disconnect cleanly
      console.error("Sign in cancelled:", err);
      didSign.current = null;
      disconnect();
    } finally {
      setSigning(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {signing && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 8,
          background: "#1A1A1F", border: "1px solid #2A2A35",
          fontSize: 13, color: "#8B5CF6",
        }}>
          <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          Signing in...
        </div>
      )}
      <ConnectButton.Custom>
        {({
          account,
          chain: connectedChain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && account && connectedChain;

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
              })}
            >
              {!connected ? (
                <button
                  onClick={openConnectModal}
                  style={{
                    padding: "8px 18px", borderRadius: 8, border: "none",
                    background: "linear-gradient(135deg, #7C3AED, #8B5CF6)",
                    color: "white", fontSize: 14, fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 0 16px rgba(124,58,237,0.35)",
                    transition: "all 0.15s",
                  }}
                >
                  Connect Wallet
                </button>
              ) : connectedChain?.unsupported ? (
                <button
                  onClick={openChainModal}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: "1px solid #EF4444",
                    background: "rgba(239,68,68,0.1)", color: "#EF4444",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Wrong Network ↗
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  {/* Chain pill */}
                  <button
                    onClick={openChainModal}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 8,
                      background: "#1A1A1F", border: "1px solid #2A2A35",
                      color: "#9CA3AF", fontSize: 12, cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    {connectedChain?.hasIcon && (
                      <div style={{ width: 14, height: 14, borderRadius: "50%", overflow: "hidden", background: connectedChain.iconBackground }}>
                        {connectedChain.iconUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={connectedChain.name ?? "Chain"}
                            src={connectedChain.iconUrl}
                            style={{ width: 14, height: 14 }}
                          />
                        )}
                      </div>
                    )}
                    {connectedChain?.name}
                  </button>

                  {/* Account pill */}
                  <button
                    onClick={openAccountModal}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 14px", borderRadius: 8,
                      background: "#1A1A1F", border: "1px solid #2A2A35",
                      color: "#F9FAFB", fontSize: 13, cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    {/* Avatar circle */}
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                      flexShrink: 0,
                    }} />
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
                      {account.displayName}
                    </span>
                    {account.displayBalance && (
                      <span style={{ color: "#6B7280", fontSize: 11 }}>
                        {account.displayBalance}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        }}
      </ConnectButton.Custom>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
