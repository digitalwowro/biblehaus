"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";

interface Language {
  id: number;
  code: string;
  name: string;
}

interface Version {
  id: number;
  abbreviation: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  language: Language;
  _count?: { books: number };
}

export default function VersionsPage() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Version | null>(null);
  const [form, setForm] = useState({
    languageId: "",
    abbreviation: "",
    name: "",
    description: "",
    isPublished: false,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function fetchData() {
    const [versionsRes, langsRes] = await Promise.all([
      fetch("/api/admin/versions"),
      fetch("/api/admin/languages"),
    ]);
    const versionsData = await versionsRes.json();
    const langsData = await langsRes.json();
    if (versionsData.success) setVersions(versionsData.data);
    if (langsData.success) setLanguages(langsData.data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const [versionsRes, langsRes] = await Promise.all([
        fetch("/api/admin/versions"),
        fetch("/api/admin/languages"),
      ]);
      const versionsData = await versionsRes.json();
      const langsData = await langsRes.json();
      if (!cancelled && versionsData.success) {
        setVersions(versionsData.data);
      }
      if (!cancelled && langsData.success) {
        setLanguages(langsData.data);
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
    setEditing(null);
    setForm({ languageId: "", abbreviation: "", name: "", description: "", isPublished: false });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(ver: Version) {
    setEditing(ver);
    setForm({
      languageId: String(ver.language.id),
      abbreviation: ver.abbreviation,
      name: ver.name,
      description: ver.description || "",
      isPublished: ver.isPublished,
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const url = editing
      ? `/api/admin/versions/${editing.id}`
      : "/api/admin/versions";
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
    fetchData();
  }

  async function handleDelete(ver: Version) {
    if (!confirm(`Delete version "${ver.name}"?`)) return;

    const res = await fetch(`/api/admin/versions/${ver.id}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!data.success) {
      alert(data.error.message);
      return;
    }

    fetchData();
  }

  async function togglePublish(ver: Version) {
    await fetch(`/api/admin/versions/${ver.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !ver.isPublished }),
    });
    fetchData();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            Versions
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Manage Bible versions
          </p>
        </div>
        <Button onClick={openCreate}>Add Version</Button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--ink-muted)]">Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: "abbreviation", header: "Abbr" },
            {
              key: "name",
              header: "Name",
              render: (ver: Version) => (
                <Link
                  href={`/admin/versions/${ver.id}`}
                  className="font-medium text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
                >
                  {ver.name}
                </Link>
              ),
            },
            {
              key: "language",
              header: "Language",
              render: (ver: Version) => ver.language.name,
            },
            {
              key: "books",
              header: "Books",
              render: (ver: Version) => String(ver._count?.books ?? 0),
            },
            {
              key: "isPublished",
              header: "Status",
              render: (ver: Version) => (
                <button
                  onClick={() => togglePublish(ver)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                    ver.isPublished
                      ? "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                      : "border-[var(--line-strong)] bg-[var(--surface-subtle)] text-[var(--ink-muted)]"
                  }`}
                >
                  {ver.isPublished ? "Published" : "Draft"}
                </button>
              ),
            },
          ]}
          data={versions}
          keyField="id"
          actions={(ver: Version) => (
            <>
              <Button variant="secondary" onClick={() => openEdit(ver)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => handleDelete(ver)}>
                Delete
              </Button>
            </>
          )}
          emptyMessage="No versions yet. Add one to get started."
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Version" : "Add Version"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-3 text-sm text-[var(--accent-red)]">
              {formError}
            </div>
          )}
          <Select
            id="languageId"
            label="Language"
            value={form.languageId}
            onChange={(e) => setForm({ ...form, languageId: e.target.value })}
            placeholder="Select a language"
            options={languages.map((l) => ({
              value: String(l.id),
              label: l.name,
            }))}
            required
          />
          <Input
            id="abbreviation"
            label="Abbreviation"
            placeholder="e.g. KJV, NIV"
            value={form.abbreviation}
            onChange={(e) => setForm({ ...form, abbreviation: e.target.value })}
            required
          />
          <Input
            id="name"
            label="Name"
            placeholder="e.g. King James Version"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            id="description"
            label="Description"
            placeholder="Optional description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.isPublished}
              onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition ${
                form.isPublished ? "bg-[var(--accent-strong)]" : "bg-[var(--line-strong)]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                  form.isPublished ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-[var(--ink-muted)]">
              {form.isPublished ? "Published" : "Draft"}
            </span>
          </div>
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
