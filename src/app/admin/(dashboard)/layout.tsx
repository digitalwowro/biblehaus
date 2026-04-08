"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/logo";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/languages", label: "Languages" },
  { href: "/admin/versions", label: "Versions" },
  { href: "/admin/upload", label: "Upload" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/api-keys", label: "API Keys" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[var(--surface-base)]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--line-soft)] bg-white">
        <div className="border-b border-[var(--line-soft)] px-5 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo href="/" size="sidebar" />
            <div>
              <h1 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                BibleHaus
              </h1>
              <p className="text-[11px] text-[var(--ink-subtle)]">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[var(--surface-subtle)] text-[var(--ink-strong)]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--line-soft)] p-3">
          <button
            onClick={async () => {
              await fetch("/api/admin/auth/logout", { method: "POST" });
              window.location.href = "/admin/login";
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
