"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  _count?: { apiKeys: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (data.success) setUsers(data.data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!cancelled && data.success) {
        setUsers(data.data);
      }
      if (!cancelled) {
        setLoading(false);
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "" });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({ name: user.name, email: user.email });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const url = editing ? `/api/admin/users/${editing.id}` : "/api/admin/users";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
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
    fetchUsers();
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete user "${user.name}"?`)) return;

    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await res.json();

    if (!data.success) {
      alert(data.error.message);
      return;
    }

    fetchUsers();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            Users
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Manage API users
          </p>
        </div>
        <Button onClick={openCreate}>Add User</Button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--ink-muted)]">Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            {
              key: "apiKeys",
              header: "API Keys",
              render: (user: User) => String(user._count?.apiKeys ?? 0),
            },
            {
              key: "createdAt",
              header: "Created",
              render: (user: User) =>
                new Date(user.createdAt).toLocaleDateString(),
            },
          ]}
          data={users}
          keyField="id"
          actions={(user: User) => (
            <>
              <Button variant="secondary" onClick={() => openEdit(user)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => handleDelete(user)}>
                Delete
              </Button>
            </>
          )}
          emptyMessage="No users yet. Add one to get started."
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit User" : "Add User"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-3 text-sm text-[var(--accent-red)]">
              {formError}
            </div>
          )}
          <Input
            id="name"
            label="Name"
            placeholder="e.g. John Smith"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="e.g. john@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
