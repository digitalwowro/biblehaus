"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";
import { t, type Locale } from "@/lib/i18n/translations";

interface AccountUser {
  id: number;
  name: string;
  email: string;
  maxApiKeys: number | null;
  isSuspended: boolean;
}

interface AccountApiKey {
  id: number;
  key: string;
  name: string;
  domain: string;
  isActive: boolean;
  createdAt: string;
  _count?: { requests: number };
}

interface AccountResponse {
  user: AccountUser;
  keys: AccountApiKey[];
  maxApiKeys: number | null;
  totalKeys: number;
  remainingKeys: number | null;
}

export function AccountPageClient({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [data, setData] = useState<AccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [form, setForm] = useState({ name: "", domain: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function fetchAccount() {
    const res = await fetch("/api/account/api-keys");
    const payload = await res.json();

    if (!payload.success) {
      if (payload.error?.code === "UNAUTHORIZED") {
        router.push("/login");
        router.refresh();
        return;
      }

      setFormError(payload.error?.message ?? t(locale, "account.load_error"));
      setLoading(false);
      return;
    }

    setData(payload.data as AccountResponse);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      const res = await fetch("/api/account/api-keys");
      const payload = await res.json();

      if (cancelled) return;

      if (!payload.success) {
        if (payload.error?.code === "UNAUTHORIZED") {
          router.push("/login");
          router.refresh();
          return;
        }

        setFormError(payload.error?.message ?? t(locale, "account.load_error"));
        setLoading(false);
        return;
      }

      setData(payload.data as AccountResponse);
      setLoading(false);
    }

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  function openCreateModal() {
    setForm({ name: "", domain: "" });
    setFormError("");
    setCreateModalOpen(true);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const res = await fetch("/api/account/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await res.json();
    setSaving(false);

    if (!payload.success) {
      setFormError(payload.error.message);
      return;
    }

    setCreateModalOpen(false);
    setNewKeyValue(payload.data.rawKey);
    setNewKeyModalOpen(true);
    await fetchAccount();
  }

  async function handleDelete(key: AccountApiKey) {
    if (!confirm(t(locale, "account.delete_confirm").replace("{name}", key.name))) {
      return;
    }

    const res = await fetch(`/api/account/api-keys/${key.id}`, {
      method: "DELETE",
    });
    const payload = await res.json();

    if (!payload.success) {
      alert(payload.error.message);
      return;
    }

    await fetchAccount();
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/account/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function maskKey(key: string) {
    if (key.length <= 10) return key;
    return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
  }

  function usageLabel(total: number, max: number | null) {
    if (max === null) {
      return `${total} ${t(locale, total === 1 ? "account.key_singular" : "account.key_plural")} ${t(locale, "account.in_use")}`;
    }

    return `${total} ${t(locale, "account.of")} ${max} ${t(locale, "account.keys_in_use")}`;
  }

  const account = data?.user;
  const remainingKeys = data?.remainingKeys;
  const limitReached =
    data?.maxApiKeys !== null &&
    remainingKeys !== null &&
    remainingKeys !== undefined &&
    remainingKeys <= 0;

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-[28px] border border-[var(--line-soft)] bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.05)] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
            {t(locale, "account.portal")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            {t(locale, "account.title")}
          </h1>
          {account && (
            <div className="mt-3 space-y-1 text-sm text-[var(--ink-muted)]">
              <p>
                {t(locale, "account.signed_in_as")}{" "}
                <span className="font-semibold text-[var(--ink-strong)]">
                  {account.name}
                </span>
              </p>
              <p>{account.email}</p>
              <p>{usageLabel(data?.totalKeys ?? 0, data?.maxApiKeys ?? null)}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={openCreateModal}
            disabled={!data || Boolean(account?.isSuspended) || Boolean(limitReached)}
          >
            {t(locale, "account.generate_key")}
          </Button>
          <Button variant="secondary" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? t(locale, "account.signing_out") : t(locale, "account.sign_out")}
          </Button>
        </div>
      </div>

      {account?.isSuspended && (
        <div className="mt-6 rounded-2xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-4 text-sm text-[var(--accent-red)]">
          {t(locale, "account.suspended_notice")}
        </div>
      )}

      {!account?.isSuspended && limitReached && (
        <div className="mt-6 rounded-2xl border border-[rgba(178,122,26,0.22)] bg-[rgba(178,122,26,0.08)] p-4 text-sm text-[var(--accent-amber)]">
          {t(locale, "account.limit_notice")}
        </div>
      )}

      {formError && !createModalOpen && (
        <div className="mt-6 rounded-2xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-4 text-sm text-[var(--accent-red)]">
          {formError}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-[var(--ink-muted)]">{t(locale, "common.loading")}</p>
        ) : (
          <DataTable
            columns={[
              { key: "name", header: t(locale, "api.key_name") },
              {
                key: "key",
                header: t(locale, "api.key"),
                render: (key: AccountApiKey) => (
                  <code className="font-mono text-xs text-[var(--ink-muted)]">
                    {maskKey(key.key)}
                  </code>
                ),
              },
              { key: "domain", header: t(locale, "api.domain") },
              {
                key: "createdAt",
                header: t(locale, "api.created"),
                render: (key: AccountApiKey) =>
                  new Date(key.createdAt).toLocaleDateString(),
              },
              {
                key: "requests",
                header: t(locale, "api.requests"),
                render: (key: AccountApiKey) => String(key._count?.requests ?? 0),
              },
              {
                key: "status",
                header: t(locale, "api.status"),
                render: (key: AccountApiKey) => (
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                      key.isActive
                        ? "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                        : "border-[var(--line-strong)] bg-[var(--surface-subtle)] text-[var(--ink-muted)]"
                    }`}
                  >
                    {key.isActive ? t(locale, "common.active") : t(locale, "common.inactive")}
                  </span>
                ),
              },
            ]}
            data={data?.keys ?? []}
            keyField="id"
            actions={(key: AccountApiKey) => (
              <Button variant="danger" onClick={() => handleDelete(key)}>
                {t(locale, "common.delete")}
              </Button>
            )}
            emptyMessage={t(locale, "account.empty")}
          />
        )}
      </div>

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t(locale, "account.generate_key")}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-3 text-sm text-[var(--accent-red)]">
              {formError}
            </div>
          )}
          <Input
            id="name"
            label={t(locale, "api.key_name")}
            placeholder={t(locale, "account.key_name_placeholder")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            id="domain"
            label={t(locale, "api.domain")}
            placeholder={t(locale, "account.domain_placeholder")}
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateModalOpen(false)}
            >
              {t(locale, "common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t(locale, "account.generating") : t(locale, "account.generate_key")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={newKeyModalOpen}
        onClose={() => setNewKeyModalOpen(false)}
        title={t(locale, "account.key_created")}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink-muted)]">
            {t(locale, "account.copy_key_notice")}
          </p>
          <div className="rounded-[18px] border border-[var(--line-strong)] bg-[var(--surface-subtle)] p-4">
            <code className="block break-all font-mono text-sm text-[var(--ink-strong)]">
              {newKeyValue}
            </code>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(newKeyValue);
              }}
            >
              {t(locale, "common.copy")}
            </Button>
            <Button onClick={() => setNewKeyModalOpen(false)}>
              {t(locale, "common.done")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
