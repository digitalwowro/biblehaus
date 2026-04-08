"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";

interface User {
  id: number;
  name: string;
  email: string;
}

interface ApiKey {
  id: number;
  key: string;
  name: string;
  domain: string;
  isActive: boolean;
  createdAt: string;
  user: User;
  _count?: { requests: number };
  rawKey?: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [form, setForm] = useState({ userId: "", name: "", domain: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function fetchData() {
    const [keysRes, usersRes] = await Promise.all([
      fetch("/api/admin/api-keys"),
      fetch("/api/admin/users"),
    ]);
    const keysData = await keysRes.json();
    const usersData = await usersRes.json();
    if (keysData.success) setKeys(keysData.data);
    if (usersData.success) setUsers(usersData.data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const [keysRes, usersRes] = await Promise.all([
        fetch("/api/admin/api-keys"),
        fetch("/api/admin/users"),
      ]);
      const keysData = await keysRes.json();
      const usersData = await usersRes.json();
      if (!cancelled && keysData.success) {
        setKeys(keysData.data);
      }
      if (!cancelled && usersData.success) {
        setUsers(usersData.data);
      }
      if (!cancelled) {
        setLoading(false);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setForm({ userId: "", name: "", domain: "" });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setFormError(data.error.message);
      return;
    }

    setModalOpen(false);
    setNewKeyValue(data.data.rawKey);
    setNewKeyModal(true);
    fetchData();
  }

  async function toggleActive(key: ApiKey) {
    await fetch(`/api/admin/api-keys/${key.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !key.isActive }),
    });
    fetchData();
  }

  async function handleDelete(key: ApiKey) {
    if (!confirm(`Delete API key "${key.name}"?`)) return;

    await fetch(`/api/admin/api-keys/${key.id}`, { method: "DELETE" });
    fetchData();
  }

  function maskKey(key: string) {
    if (key.length <= 10) return key;
    return key.substring(0, 7) + "..." + key.substring(key.length - 4);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            API Keys
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Manage API keys for users
          </p>
        </div>
        <Button onClick={openCreate}>Generate Key</Button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--ink-muted)]">Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            {
              key: "key",
              header: "Key",
              render: (k: ApiKey) => (
                <code className="font-mono text-xs text-[var(--ink-muted)]">
                  {maskKey(k.key)}
                </code>
              ),
            },
            {
              key: "user",
              header: "User",
              render: (k: ApiKey) => k.user.name,
            },
            { key: "domain", header: "Domain" },
            {
              key: "requests",
              header: "Requests",
              render: (k: ApiKey) => String(k._count?.requests ?? 0),
            },
            {
              key: "isActive",
              header: "Status",
              render: (k: ApiKey) => (
                <button
                  onClick={() => toggleActive(k)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                    k.isActive
                      ? "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                      : "border-[var(--line-strong)] bg-[var(--surface-subtle)] text-[var(--ink-muted)]"
                  }`}
                >
                  {k.isActive ? "Active" : "Inactive"}
                </button>
              ),
            },
          ]}
          data={keys}
          keyField="id"
          actions={(k: ApiKey) => (
            <Button variant="danger" onClick={() => handleDelete(k)}>
              Delete
            </Button>
          )}
          emptyMessage="No API keys yet. Generate one to get started."
        />
      )}

      {/* Create Key Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Generate API Key"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-3 text-sm text-[var(--accent-red)]">
              {formError}
            </div>
          )}
          <Select
            id="userId"
            label="User"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            placeholder="Select a user"
            options={users.map((u) => ({
              value: String(u.id),
              label: `${u.name} (${u.email})`,
            }))}
            required
          />
          <Input
            id="name"
            label="Key Name"
            placeholder="e.g. Production, Staging"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            id="domain"
            label="Domain"
            placeholder="e.g. example.com"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Generating..." : "Generate"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Key Display Modal */}
      <Modal
        open={newKeyModal}
        onClose={() => setNewKeyModal(false)}
        title="API Key Created"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink-muted)]">
            Copy this key now. It will not be shown again.
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
              Copy
            </Button>
            <Button onClick={() => setNewKeyModal(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
