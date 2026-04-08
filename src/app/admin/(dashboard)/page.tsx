"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  languages: number;
  versions: number;
  books: number;
  verses: number;
  users: number;
  apiKeys: number;
  requests: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();
      if (!cancelled && json.success) {
        setData(json.data);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = data
    ? [
        { label: "Languages", value: data.languages },
        { label: "Versions", value: data.versions },
        { label: "Books", value: data.books },
        { label: "Verses", value: data.verses.toLocaleString() },
        { label: "Users", value: data.users },
        { label: "API Keys", value: data.apiKeys },
        { label: "API Requests", value: data.requests.toLocaleString() },
      ]
    : [];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Overview of your BibleHaus instance.
        </p>
      </div>

      {data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-[var(--line-soft)] bg-white p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--ink-strong)]">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-muted)]">Loading...</p>
      )}
    </div>
  );
}
