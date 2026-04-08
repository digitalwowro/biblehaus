"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface Version {
  id: number;
  abbreviation: string;
  name: string;
  language: { name: string };
}

type UploadState = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [versionId, setVersionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{
    books: number;
    chapters: number;
    verses: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVersions() {
      const res = await fetch("/api/admin/versions");
      const data = await res.json();
      if (!cancelled && data.success) {
        setVersions(data.data);
      }
    }

    void loadVersions();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpload() {
    if (!file || !versionId) return;

    setState("uploading");
    setMessage("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("versionId", versionId);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        setState("error");
        setMessage(data.error.message);
        return;
      }

      setState("success");
      setMessage(data.data.message);
      setResult(data.data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setState("error");
      setMessage("Upload failed. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
          Upload Bible Data
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Import books, chapters, and verses from a CSV or JSON file.
        </p>
      </div>

      <div className="max-w-xl space-y-5">
        <div className="rounded-2xl border border-[var(--line-soft)] bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
            Expected CSV Format
          </h3>
          <code className="mt-2 block whitespace-pre-wrap font-mono text-xs leading-6 text-[var(--ink-muted)]">
            book_number,book_name,book_abbreviation,testament,chapter,verse,text{"\n"}
            1,Genesis,Gen,OT,1,1,&quot;In the beginning God created...&quot;
          </code>
          <p className="mt-3 text-xs text-[var(--ink-subtle)]">
            JSON files should be an array of objects with the same fields.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--line-soft)] bg-white p-5">
          <Select
            id="versionId"
            label="Bible Version"
            value={versionId}
            onChange={(e) => setVersionId(e.target.value)}
            placeholder="Select a version"
            options={versions.map((v) => ({
              value: String(v.id),
              label: `${v.abbreviation} - ${v.name} (${v.language.name})`,
            }))}
          />

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              File (CSV or JSON)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-[var(--ink-muted)] file:mr-3 file:rounded-xl file:border file:border-[var(--line-strong)] file:bg-[var(--surface-card)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--ink-muted)] file:transition hover:file:bg-[var(--surface-subtle)]"
            />
          </div>

          {file && (
            <p className="text-xs text-[var(--ink-muted)]">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || !versionId || state === "uploading"}
            className="w-full"
          >
            {state === "uploading" ? "Importing..." : "Upload & Import"}
          </Button>
        </div>

        {state === "success" && result && (
          <div className="rounded-2xl border border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] p-5">
            <p className="text-sm font-semibold text-[var(--accent-strong)]">
              Import successful
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">{message}</p>
            <div className="mt-3 flex gap-6">
              <div>
                <p className="text-2xl font-semibold text-[var(--ink-strong)]">
                  {result.books}
                </p>
                <p className="text-xs text-[var(--ink-subtle)]">Books</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--ink-strong)]">
                  {result.chapters}
                </p>
                <p className="text-xs text-[var(--ink-subtle)]">Chapters</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--ink-strong)]">
                  {result.verses}
                </p>
                <p className="text-xs text-[var(--ink-subtle)]">Verses</p>
              </div>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-2xl border border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] p-5">
            <p className="text-sm font-semibold text-[var(--accent-red)]">
              Import failed
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
