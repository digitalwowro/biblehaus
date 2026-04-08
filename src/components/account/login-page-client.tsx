"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n/translations";
import { BrandLogo } from "@/components/brand/logo";

export function LoginPageClient({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/account/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.error.message);
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setErrorMsg(t(locale, "account.login.unexpected"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center">
      <div className="w-full max-w-sm rounded-[24px] border border-[var(--line-soft)] bg-white p-8 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <BrandLogo size="login" priority />
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            {t(locale, "account.portal")}
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {t(locale, "account.login.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div
              className="rounded-xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-3 text-sm text-[var(--accent-red)]"
              aria-live="polite"
            >
              {errorMsg}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]"
            >
              {t(locale, "form.email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent-strong)]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]"
            >
              {t(locale, "form.password")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent-strong)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--accent-strong)] px-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            aria-busy={loading}
          >
            {loading ? t(locale, "account.login.submitting") : t(locale, "nav.login")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          {t(locale, "account.login.help")}
        </p>
        <p className="mt-2 text-center text-sm">
          <Link
            href="/"
            className="font-medium text-[var(--accent-strong)] transition hover:text-[var(--accent-strong-hover)]"
          >
            {t(locale, "account.login.back")}
          </Link>
        </p>
      </div>
    </div>
  );
}
