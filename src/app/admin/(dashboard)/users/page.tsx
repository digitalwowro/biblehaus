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
  maxApiKeys: number | null;
  isSuspended: boolean;
  createdAt: string;
  _count?: { apiKeys: number };
}

interface AdminUser {
  id: number;
  name: string | null;
  email: string;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  adminUsers: AdminUser[];
  currentAdminId: number | null;
}

type CreateMode = "user" | "admin";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>("user");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    maxApiKeys: "",
  });
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [savingUser, setSavingUser] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [userFormError, setUserFormError] = useState("");
  const [adminFormError, setAdminFormError] = useState("");

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (data.success) {
      const payload = data.data as UsersResponse;
      setUsers(payload.users);
      setAdminUsers(payload.adminUsers);
      setCurrentAdminId(payload.currentAdminId);
    }
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!cancelled && data.success) {
        const payload = data.data as UsersResponse;
        setUsers(payload.users);
        setAdminUsers(payload.adminUsers);
        setCurrentAdminId(payload.currentAdminId);
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
    setEditingUser(null);
    setCreateMode("user");
    setUserForm({ name: "", email: "", password: "", maxApiKeys: "" });
    setUserFormError("");
    setUserModalOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: "",
      maxApiKeys: user.maxApiKeys === null ? "" : String(user.maxApiKeys),
    });
    setUserFormError("");
    setUserModalOpen(true);
  }

  function openAdminEdit(adminUser: AdminUser) {
    setEditingAdmin(adminUser);
    setAdminForm({
      name: adminUser.name ?? "",
      email: adminUser.email,
      password: "",
    });
    setAdminFormError("");
    setAdminModalOpen(true);
  }

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUserFormError("");
    setSavingUser(true);

    const isCreatingAdmin = !editingUser && createMode === "admin";

    if (isCreatingAdmin && !userForm.password) {
      setSavingUser(false);
      setUserFormError("Password is required for admin users.");
      return;
    }

    const url = editingUser
      ? `/api/admin/users/${editingUser.id}`
      : isCreatingAdmin
        ? "/api/admin/admin-users"
        : "/api/admin/users";
    const method = editingUser ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm),
    });

    const data = await res.json();
    setSavingUser(false);

    if (!data.success) {
      setUserFormError(data.error.message);
      return;
    }

    setUserModalOpen(false);
    await fetchUsers();
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAdmin) return;

    setAdminFormError("");
    setSavingAdmin(true);

    const res = await fetch(`/api/admin/admin-users/${editingAdmin.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminForm),
    });

    const data = await res.json();
    setSavingAdmin(false);

    if (!data.success) {
      setAdminFormError(data.error.message);
      return;
    }

    setAdminModalOpen(false);
    await fetchUsers();
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

  async function handleSuspendToggle(user: User) {
    const nextState = !user.isSuspended;
    const actionLabel = nextState ? "suspend" : "reactivate";

    if (!confirm(`${actionLabel[0].toUpperCase()}${actionLabel.slice(1)} user "${user.name}"?`)) {
      return;
    }

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSuspended: nextState }),
    });
    const data = await res.json();

    if (!data.success) {
      alert(data.error.message);
      return;
    }

    await fetchUsers();
  }

  async function handleAdminDelete(adminUser: AdminUser) {
    if (adminUser.id === currentAdminId) return;
    if (!confirm(`Delete admin user "${adminUser.email}"?`)) return;

    const res = await fetch(`/api/admin/admin-users/${adminUser.id}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!data.success) {
      alert(data.error.message);
      return;
    }

    await fetchUsers();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            Users
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Manage API users and review admin accounts
          </p>
        </div>
        <Button onClick={openCreate}>Add Account</Button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--ink-muted)]">Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "User Name" },
            { key: "email", header: "Email" },
            {
              key: "apiKeys",
              header: "API Keys",
              render: (user: User) => String(user._count?.apiKeys ?? 0),
            },
            {
              key: "maxApiKeys",
              header: "Max API Keys",
              render: (user: User) =>
                user.maxApiKeys === null ? "Unlimited" : String(user.maxApiKeys),
            },
            {
              key: "createdAt",
              header: "Created",
              render: (user: User) =>
                new Date(user.createdAt).toLocaleDateString(),
            },
            {
              key: "status",
              header: "Status",
              render: (user: User) => (
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    user.isSuspended
                      ? "border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] text-[var(--accent-red)]"
                      : "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                  }`}
                >
                  {user.isSuspended ? "Suspended" : "Active"}
                </span>
              ),
            },
          ]}
          data={users}
          keyField="id"
          actions={(user: User) => (
            <>
              <Button variant="secondary" onClick={() => openEdit(user)}>
                Edit
              </Button>
              <Button
                variant={user.isSuspended ? "secondary" : "danger"}
                onClick={() => handleSuspendToggle(user)}
              >
                {user.isSuspended ? "Reactivate" : "Suspend"}
              </Button>
              <Button variant="danger" onClick={() => handleDelete(user)}>
                Delete
              </Button>
            </>
          )}
          emptyMessage="No users yet. Add one to get started."
        />
      )}

      <div className="mt-10">
        <div className="mb-4">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            Admin Users
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Accounts that can access the admin dashboard
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--ink-muted)]">Loading...</p>
        ) : (
          <DataTable
            columns={[
              {
                key: "name",
                header: "User Name",
                render: (adminUser: AdminUser) => adminUser.name || "Admin",
              },
              { key: "email", header: "Email" },
              {
                key: "createdAt",
                header: "Created",
                render: (adminUser: AdminUser) =>
                  new Date(adminUser.createdAt).toLocaleDateString(),
              },
            ]}
            data={adminUsers}
            keyField="id"
            actions={(adminUser: AdminUser) => (
              <>
                <Button
                  variant="secondary"
                  onClick={() => openAdminEdit(adminUser)}
                >
                  Edit
                </Button>
                {adminUser.id === currentAdminId ? (
                  <Button variant="secondary" disabled>
                    Current
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={() => handleAdminDelete(adminUser)}
                  >
                    Delete
                  </Button>
                )}
              </>
            )}
            emptyMessage="No admin users found."
          />
        )}
      </div>

      <Modal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={
          editingUser
            ? "Edit User"
            : createMode === "admin"
              ? "Add Admin User"
              : "Add User"
        }
      >
        <form onSubmit={handleUserSubmit} className="space-y-4">
          {userFormError && (
            <div className="rounded-xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-3 text-sm text-[var(--accent-red)]">
              {userFormError}
            </div>
          )}
          {!editingUser && (
            <div>
              <p className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                Account Type
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={createMode === "user" ? "primary" : "secondary"}
                  onClick={() => setCreateMode("user")}
                >
                  API User
                </Button>
                <Button
                  type="button"
                  variant={createMode === "admin" ? "primary" : "secondary"}
                  onClick={() => setCreateMode("admin")}
                >
                  Admin User
                </Button>
              </div>
            </div>
          )}
          <Input
            id="name"
            label="User Name"
            placeholder="e.g. John Smith"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="e.g. john@example.com"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            required
          />
          <Input
            id="password"
            label={
              editingUser
                ? "Password"
                : createMode === "admin"
                  ? "Password"
                  : "Password (optional)"
            }
            type="password"
            placeholder={
              editingUser
                ? "Leave blank to keep the current password"
                : createMode === "admin"
                  ? "Required for admin users"
                  : "Set a password"
            }
            value={userForm.password}
            onChange={(e) =>
              setUserForm({ ...userForm, password: e.target.value })
            }
            autoComplete="new-password"
            required={!editingUser && createMode === "admin"}
          />
          {(editingUser || createMode === "user") && (
            <Input
              id="max-api-keys"
              label="Max API Keys"
              type="number"
              min="1"
              placeholder="Leave blank for unlimited"
              value={userForm.maxApiKeys}
              onChange={(e) =>
                setUserForm({ ...userForm, maxApiKeys: e.target.value })
              }
            />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={savingUser}>
              {savingUser ? "Saving..." : editingUser ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        title="Edit Admin User"
      >
        <form onSubmit={handleAdminSubmit} className="space-y-4">
          {adminFormError && (
            <div className="rounded-xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-3 text-sm text-[var(--accent-red)]">
              {adminFormError}
            </div>
          )}
          <Input
            id="admin-name"
            label="User Name"
            placeholder="e.g. Admin"
            value={adminForm.name}
            onChange={(e) =>
              setAdminForm({ ...adminForm, name: e.target.value })
            }
          />
          <Input
            id="admin-email"
            label="Email"
            type="email"
            placeholder="e.g. admin@example.com"
            value={adminForm.email}
            onChange={(e) =>
              setAdminForm({ ...adminForm, email: e.target.value })
            }
            required
          />
          <Input
            id="admin-password"
            label="Password"
            type="password"
            placeholder="Leave blank to keep the current password"
            value={adminForm.password}
            onChange={(e) =>
              setAdminForm({ ...adminForm, password: e.target.value })
            }
            autoComplete="new-password"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAdminModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={savingAdmin}>
              {savingAdmin ? "Saving..." : "Update"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
