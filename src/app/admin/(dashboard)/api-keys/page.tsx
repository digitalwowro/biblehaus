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

interface UsersResponse {
  users: User[];
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [createForm, setCreateForm] = useState({ userId: "", name: "", domain: "" });
  const [editForm, setEditForm] = useState({
    name: "",
    domain: "",
    isActive: "true",
  });
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [createFormError, setCreateFormError] = useState("");
  const [editFormError, setEditFormError] = useState("");

  async function fetchData() {
    const [keysRes, usersRes] = await Promise.all([
      fetch("/api/admin/api-keys"),
      fetch("/api/admin/users"),
    ]);
    const keysData = await keysRes.json();
    const usersData = await usersRes.json();
    if (keysData.success) setKeys(keysData.data);
    if (usersData.success) {
      const payload = usersData.data as UsersResponse;
      setUsers(payload.users);
    }
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
        const payload = usersData.data as UsersResponse;
        setUsers(payload.users);
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
    setCreateForm({ userId: "", name: "", domain: "" });
    setCreateFormError("");
    setCreateModalOpen(true);
  }

  function openEdit(key: ApiKey) {
    setEditingKey(key);
    setEditForm({
      name: key.name,
      domain: key.domain,
      isActive: String(key.isActive),
    });
    setEditFormError("");
    setEditModalOpen(true);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateFormError("");
    setSavingCreate(true);

    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });

    const data = await res.json();
    setSavingCreate(false);

    if (!data.success) {
      setCreateFormError(data.error.message);
      return;
    }

    setCreateModalOpen(false);
    setNewKeyValue(data.data.rawKey);
    setNewKeyModal(true);
    fetchData();
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingKey) return;

    setEditFormError("");
    setSavingEdit(true);

    const res = await fetch(`/api/admin/api-keys/${editingKey.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        domain: editForm.domain,
        isActive: editForm.isActive === "true",
      }),
    });

    const data = await res.json();
    setSavingEdit(false);

    if (!data.success) {
      setEditFormError(data.error.message);
      return;
    }

    setEditModalOpen(false);
    await fetchData();
  }

  async function handleRegenerate() {
    if (!editingKey) return;
    if (!confirm(`Regenerate API key "${editingKey.name}"?`)) return;

    setEditFormError("");
    setSavingEdit(true);

    const res = await fetch(`/api/admin/api-keys/${editingKey.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        domain: editForm.domain,
        isActive: editForm.isActive === "true",
        regenerate: true,
      }),
    });

    const data = await res.json();
    setSavingEdit(false);

    if (!data.success) {
      setEditFormError(data.error.message);
      return;
    }

    setEditModalOpen(false);
    setNewKeyValue(data.data.rawKey);
    setNewKeyModal(true);
    await fetchData();
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
            { key: "name", header: "Key Name" },
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
              header: "User Name",
              render: (k: ApiKey) => k.user.name,
            },
            {
              key: "userEmail",
              header: "Email",
              render: (k: ApiKey) => k.user.email,
            },
            { key: "domain", header: "Domain" },
            {
              key: "requests",
              header: "Requests",
              render: (k: ApiKey) => String(k._count?.requests ?? 0),
            },
            {
              key: "createdAt",
              header: "Created",
              render: (k: ApiKey) =>
                new Date(k.createdAt).toLocaleDateString(),
            },
            {
              key: "isActive",
              header: "Status",
              render: (k: ApiKey) => (
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                    k.isActive
                      ? "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                      : "border-[var(--line-strong)] bg-[var(--surface-subtle)] text-[var(--ink-muted)]"
                  }`}
                >
                  {k.isActive ? "Active" : "Inactive"}
                </span>
              ),
            },
          ]}
          data={keys}
          keyField="id"
          actions={(k: ApiKey) => (
            <>
              <Button variant="secondary" onClick={() => openEdit(k)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => handleDelete(k)}>
                Delete
              </Button>
            </>
          )}
          emptyMessage="No API keys yet. Generate one to get started."
        />
      )}

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Generate API Key"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createFormError && (
            <div className="rounded-xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-3 text-sm text-[var(--accent-red)]">
              {createFormError}
            </div>
          )}
          <Select
            id="userId"
            label="User"
            value={createForm.userId}
            onChange={(e) =>
              setCreateForm({ ...createForm, userId: e.target.value })
            }
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
            value={createForm.name}
            onChange={(e) =>
              setCreateForm({ ...createForm, name: e.target.value })
            }
            required
          />
          <Input
            id="domain"
            label="Domain"
            placeholder="e.g. example.com"
            value={createForm.domain}
            onChange={(e) =>
              setCreateForm({ ...createForm, domain: e.target.value })
            }
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={savingCreate}>
              {savingCreate ? "Generating..." : "Generate"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit API Key"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editFormError && (
            <div className="rounded-xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-3 text-sm text-[var(--accent-red)]">
              {editFormError}
            </div>
          )}
          <Input
            id="edit-name"
            label="Key Name"
            placeholder="e.g. Production, Staging"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Input
            id="edit-domain"
            label="Domain"
            placeholder="e.g. example.com"
            value={editForm.domain}
            onChange={(e) =>
              setEditForm({ ...editForm, domain: e.target.value })
            }
            required
          />
          <Select
            id="edit-status"
            label="Status"
            value={editForm.isActive}
            onChange={(e) =>
              setEditForm({ ...editForm, isActive: e.target.value })
            }
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleRegenerate}
              disabled={savingEdit}
            >
              {savingEdit ? "Saving..." : "Regenerate Key"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={savingEdit}>
              {savingEdit ? "Saving..." : "Update"}
            </Button>
          </div>
        </form>
      </Modal>

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
