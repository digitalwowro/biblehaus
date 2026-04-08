"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  overview: {
    total: number;
    last24h: number;
    last7d: number;
    last30d: number;
  };
  keyStats: {
    id: number;
    name: string;
    domain: string;
    isActive: boolean;
    lastUsedAt: string | null;
    userName: string;
    totalRequests: number;
  }[];
  dailyStats: { date: string; count: number }[];
  topEndpoints: { path: string; count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const res = await fetch("/api/admin/analytics");
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

  if (!data) {
    return <p className="text-sm text-[var(--ink-muted)]">Loading...</p>;
  }

  const maxDaily = Math.max(...data.dailyStats.map((d) => d.count), 1);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
          Analytics
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          API usage statistics and request logs.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Requests", value: data.overview.total },
          { label: "Last 24 Hours", value: data.overview.last24h },
          { label: "Last 7 Days", value: data.overview.last7d },
          { label: "Last 30 Days", value: data.overview.last30d },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--line-soft)] bg-white p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--ink-strong)]">
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <div className="mt-6 rounded-2xl border border-[var(--line-soft)] bg-white p-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
          Requests — Last 7 Days
        </h3>
        <div className="mt-4 flex items-end gap-2" style={{ height: 120 }}>
          {data.dailyStats.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-[var(--ink-muted)]">
                {d.count}
              </span>
              <div
                className="w-full rounded-t-md bg-[var(--accent-strong)]"
                style={{
                  height: `${Math.max((d.count / maxDaily) * 80, 2)}px`,
                  opacity: d.count === 0 ? 0.2 : 1,
                }}
              />
              <span className="text-[10px] text-[var(--ink-subtle)]">
                {new Date(d.date + "T00:00:00").toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top endpoints */}
        <div className="rounded-2xl border border-[var(--line-soft)] bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
            Top Endpoints (7 days)
          </h3>
          {data.topEndpoints.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">No requests yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {data.topEndpoints.map((ep) => (
                <div key={ep.path} className="flex items-center justify-between">
                  <code className="text-xs text-[var(--ink-muted)]">{ep.path}</code>
                  <span className="text-xs font-semibold text-[var(--ink-strong)]">
                    {ep.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-key stats */}
        <div className="rounded-2xl border border-[var(--line-soft)] bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
            Usage by API Key
          </h3>
          {data.keyStats.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">No API keys created yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {data.keyStats.map((k) => (
                <div key={k.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink-strong)]">{k.name}</p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {k.userName} · {k.domain}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--ink-strong)]">
                      {k.totalRequests.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[var(--ink-subtle)]">
                      {k.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
