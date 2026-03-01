"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutGrid, PlusCircle, BarChart3 } from "lucide-react";
import { ConnectWallet } from "./ConnectWallet";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/marketplace", label: "Marketplace", icon: LayoutGrid },
    { href: "/builder", label: "Build", icon: PlusCircle },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      style={{
        background: "rgba(15,15,17,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #2A2A35",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 64, gap: 8 }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginRight: 32 }}>
          <Image src="/logo.png" alt="PILA" width={36} height={36} style={{ borderRadius: 8 }} />
          <span style={{ fontWeight: 700, fontSize: 18, color: "#F9FAFB", letterSpacing: "-0.02em" }}>PILA</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.15s",
                color: isActive(href) ? "#8B5CF6" : "#9CA3AF",
                background: isActive(href) ? "rgba(124,58,237,0.1)" : "transparent",
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {/* Wallet connect */}
        <ConnectWallet />
      </div>
    </nav>
  );
}
