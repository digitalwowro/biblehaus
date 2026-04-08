"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Locale, locales, localeLabels } from "@/lib/i18n/translations";
import { Flag } from "@/components/flags";

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function switchLocale(locale: Locale) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-muted)] transition hover:border-[var(--accent-strong)] hover:text-[var(--accent-strong)]"
      >
        <Flag locale={current} />
        <span>{current.toUpperCase()}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`transition ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 3.75L5 6.25L7.5 3.75"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-[var(--line-soft)] bg-white py-1 shadow-lg">
          {locales.map((locale) => {
            const label = localeLabels[locale];
            const isActive = locale === current;
            return (
              <button
                key={locale}
                onClick={() => switchLocale(locale)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-[var(--surface-subtle)] ${
                  isActive
                    ? "font-semibold text-[var(--accent-strong)]"
                    : "text-[var(--ink-muted)]"
                }`}
              >
                <Flag locale={locale} />
                <span>{label.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
