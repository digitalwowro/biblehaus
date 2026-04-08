"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";

interface Language {
  id: number;
  code: string;
  name: string;
  nativeName: string;
  direction: string;
  _count?: { versions: number };
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Language | null>(null);
  const [form, setForm] = useState({ code: "", name: "", nativeName: "", direction: "ltr" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function fetchLanguages() {
    const res = await fetch("/api/admin/languages");
    const data = await res.json();
    if (data.success) setLanguages(data.data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadLanguages() {
      const res = await fetch("/api/admin/languages");
      const data = await res.json();
      if (!cancelled && data.success) {
        setLanguages(data.data);
      }
      if (!cancelled) {
        setLoading(false);
      }
    }

    void loadLanguages();

    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ code: "", name: "", nativeName: "", direction: "ltr" });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(lang: Language) {
    setEditing(lang);
    setForm({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      direction: lang.direction,
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const url = editing
      ? `/api/admin/languages/${editing.id}`
      : "/api/admin/languages";
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
    fetchLanguages();
  }

  async function handleDelete(lang: Language) {
    if (!confirm(`Delete language "${lang.name}"?`)) return;

    const res = await fetch(`/api/admin/languages/${lang.id}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!data.success) {
      alert(data.error.message);
      return;
    }

    fetchLanguages();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            Languages
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Manage Bible languages
          </p>
        </div>
        <Button onClick={openCreate}>Add Language</Button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--ink-muted)]">Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: "code", header: "Code" },
            { key: "name", header: "Name" },
            { key: "nativeName", header: "Native Name" },
            { key: "direction", header: "Direction" },
            {
              key: "versions",
              header: "Versions",
              render: (lang: Language) =>
                String(lang._count?.versions ?? 0),
            },
          ]}
          data={languages}
          keyField="id"
          actions={(lang: Language) => (
            <>
              <Button variant="secondary" onClick={() => openEdit(lang)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => handleDelete(lang)}>
                Delete
              </Button>
            </>
          )}
          emptyMessage="No languages yet. Add one to get started."
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Language" : "Add Language"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-3 text-sm text-[var(--accent-red)]">
              {formError}
            </div>
          )}
          <Input
            id="code"
            label="Code (ISO 639)"
            placeholder="e.g. en, ro, he"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
          <Input
            id="name"
            label="Name"
            placeholder="e.g. English"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            id="nativeName"
            label="Native Name"
            placeholder="e.g. English, Romana"
            value={form.nativeName}
            onChange={(e) => setForm({ ...form, nativeName: e.target.value })}
            required
          />
          <Select
            id="direction"
            label="Text Direction"
            value={form.direction}
            onChange={(e) => setForm({ ...form, direction: e.target.value })}
            options={[
              { value: "ltr", label: "Left to Right" },
              { value: "rtl", label: "Right to Left" },
            ]}
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
