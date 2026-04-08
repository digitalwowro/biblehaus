"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";

interface Version {
  id: number;
  abbreviation: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  language: { name: string; code: string };
}

interface Book {
  id: number;
  bookNumber: number;
  name: string;
  abbreviation: string | null;
  testament: string;
  totalChapters: number;
  _count: { chapters: number };
}

export default function VersionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [version, setVersion] = useState<Version | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const res = await fetch(`/api/admin/versions/${id}/books`);
      const data = await res.json();
      if (!cancelled && data.success) {
        setVersion(data.data.version);
        setBooks(data.data.books);
      }
      if (!cancelled) {
        setLoading(false);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="text-sm text-[var(--ink-muted)]">Loading...</p>;
  }

  if (!version) {
    return <p className="text-sm text-[var(--accent-red)]">Version not found.</p>;
  }

  const otBooks = books.filter((b) => b.testament === "OT");
  const ntBooks = books.filter((b) => b.testament === "NT");

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/versions"
          className="text-sm text-[var(--ink-muted)] transition hover:text-[var(--accent-strong)]"
        >
          &larr; Back to Versions
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            {version.name}
          </h2>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              version.isPublished
                ? "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                : "border-[var(--line-strong)] bg-[var(--surface-subtle)] text-[var(--ink-muted)]"
            }`}
          >
            {version.isPublished ? "Published" : "Draft"}
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {version.abbreviation} - {version.language.name}
          {version.description && ` - ${version.description}`}
        </p>
      </div>

      {books.length === 0 ? (
        <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--surface-subtle)]/45 text-sm text-[var(--ink-subtle)]">
          No books imported yet. Use the Upload page to import Bible data for this version.
        </div>
      ) : (
        <div className="space-y-8">
          {otBooks.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                Old Testament ({otBooks.length} books)
              </h3>
              <BookTable books={otBooks} />
            </div>
          )}
          {ntBooks.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                New Testament ({ntBooks.length} books)
              </h3>
              <BookTable books={ntBooks} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BookTable({ books }: { books: Book[] }) {
  return (
    <DataTable
      columns={[
        { key: "bookNumber", header: "#" },
        { key: "name", header: "Name" },
        {
          key: "abbreviation",
          header: "Abbr",
          render: (b: Book) => b.abbreviation || "-",
        },
        { key: "testament", header: "Testament" },
        {
          key: "totalChapters",
          header: "Chapters",
          render: (b: Book) => String(b.totalChapters),
        },
      ]}
      data={books}
      keyField="id"
    />
  );
}
