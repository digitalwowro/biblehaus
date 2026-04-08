"use client";

import { useState, useRef, useEffect } from "react";
import { useTTS } from "@/hooks/use-tts";
import { t, type Locale } from "@/lib/i18n/translations";

interface Verse {
  id: number | bigint;
  verseNumber: number;
  text: string;
}

interface VerseListProps {
  verses: Verse[];
  bookName: string;
  chapterNumber: number;
  basePath: string;
  version: string;
  bookNumber: number;
  ttsEnabled: boolean;
  locale: Locale;
}

export function VerseList({
  verses,
  bookName,
  chapterNumber,
  basePath,
  version,
  bookNumber,
  ttsEnabled,
  locale,
}: VerseListProps) {
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const tts = useTTS({
    version,
    bookNumber,
    chapter: chapterNumber,
    verses,
  });

  // Highlight and scroll to hash verse on mount (client only)
  useEffect(() => {
    if (activeVerse === null) return;
    const timeout = window.setTimeout(() => {
      document
        .getElementById(`v${activeVerse}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [activeVerse]);

  useEffect(() => {
    function syncFromHash() {
      const match = window.location.hash.match(/^#v(\d+)$/);
      if (!match) {
        setActiveVerse(null);
        setShowPopover(false);
        return;
      }
      setActiveVerse(parseInt(match[1], 10));
      setShowPopover(false);
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-verse]") && !target.closest("[data-popover]") && !target.closest("[data-tts-controls]")) {
        setActiveVerse(null);
        setShowPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Auto-scroll to currently playing verse during chapter mode
  useEffect(() => {
    if (tts.mode === "chapter" && tts.playingVerse !== null) {
      document.getElementById(`v${tts.playingVerse}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [tts.playingVerse, tts.mode]);

  function handleVerseClick(verseNumber: number) {
    if (activeVerse === verseNumber && showPopover) {
      setActiveVerse(null);
      setShowPopover(false);
    } else {
      setActiveVerse(verseNumber);
      setShowPopover(true);
    }
    setCopied(null);
  }

  function getReference(verseNumber: number) {
    return `${bookName} ${chapterNumber}:${verseNumber}`;
  }

  function getVerseUrl(verseNumber: number) {
    return `${window.location.origin}${basePath}/${chapterNumber}#v${verseNumber}`;
  }

  async function copyToClipboard(text: string, type: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  }

  function handleCopyRefFirst(verse: Verse) {
    const text = `${getReference(verse.verseNumber)} - "${verse.text}"`;
    copyToClipboard(text, "ref-first");
  }

  function handleCopyRefLast(verse: Verse) {
    const text = `"${verse.text}" - ${getReference(verse.verseNumber)}`;
    copyToClipboard(text, "ref-last");
  }

  function handleShare(verse: Verse) {
    copyToClipboard(getVerseUrl(verse.verseNumber), "share");
  }

  const isChapterPlaying = tts.mode === "chapter" && (tts.isPlaying || tts.playingVerse !== null);

  return (
    <div ref={containerRef}>
      {/* Chapter listen controls */}
      {ttsEnabled && (
        <div data-tts-controls className="mb-4 flex items-center gap-2">
          {!isChapterPlaying ? (
            <button
              onClick={() => tts.playChapterFrom(1)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line-soft)] bg-white px-3.5 py-2 text-sm font-medium text-[var(--ink-muted)] transition hover:border-[var(--accent-strong)] hover:text-[var(--accent-strong)]"
            >
              <SpeakerIcon className="h-4 w-4" />
              {t(locale, "tts.listen")}
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line-soft)] bg-white px-1.5 py-1 shadow-sm">
              {tts.isPlaying ? (
                <button
                  onClick={() => tts.pausePlayback()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--accent-strong)] transition hover:bg-[var(--surface-subtle)]"
                  title={t(locale, "tts.pause")}
                >
                  <PauseIcon className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => tts.resumePlayback()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--accent-strong)] transition hover:bg-[var(--surface-subtle)]"
                  title={t(locale, "tts.resume")}
                >
                  <PlayIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => tts.stopPlayback()}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                title={t(locale, "tts.stop")}
              >
                <StopIcon className="h-4 w-4" />
              </button>
              <div className="mx-1 h-4 w-px bg-[var(--line-soft)]" />
              <span className="px-1.5 text-xs font-medium text-[var(--ink-muted)]">
                {tts.isLoading ? (
                  t(locale, "common.loading")
                ) : (
                  <>
                    {t(locale, "tts.verse")} {tts.playingVerse} / {verses.length}
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Verse list */}
      <div className="space-y-0 text-base leading-[1.85] text-[var(--ink-strong)]">
        {verses.map((v) => {
          const isActive = activeVerse === v.verseNumber;
          const isTTSPlaying = tts.playingVerse === v.verseNumber;
          return (
            <div key={String(v.id)}>
              <p
                id={`v${v.verseNumber}`}
                data-verse={v.verseNumber}
                onClick={() => handleVerseClick(v.verseNumber)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 transition ${
                  isTTSPlaying
                    ? "bg-[rgba(34,122,89,0.12)] border-l-[3px] border-[var(--accent-strong)]"
                    : isActive
                      ? "bg-[rgba(34,122,89,0.08)]"
                      : "hover:bg-[var(--surface-subtle)]"
                }`}
              >
                <sup className="mr-1 text-[11px] font-semibold text-[var(--accent-strong)]">
                  {v.verseNumber}
                </sup>
                {v.text}
              </p>

              {isActive && showPopover && (
                <div
                  data-popover
                  className="ml-3 mt-1 mb-1 inline-flex items-center gap-1 rounded-xl border border-[var(--line-soft)] bg-white px-1.5 py-1 shadow-md"
                >
                  <span className="pl-1.5 pr-1 text-[11px] font-semibold text-[var(--ink-subtle)]">
                    {getReference(v.verseNumber)}
                  </span>

                  <div className="mx-0.5 h-4 w-px bg-[var(--line-soft)]" />

                  {/* Copy: reference first */}
                  <button
                    onClick={() => handleCopyRefFirst(v)}
                    title={`${getReference(v.verseNumber)} \u2013 "..."`}
                    className={`relative flex h-7 w-7 items-center justify-center rounded-lg transition ${
                      copied === "ref-first"
                        ? "bg-[rgba(34,122,89,0.12)] text-[var(--accent-strong)]"
                        : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="4" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M6 4V2.5A1.5 1.5 0 0 1 7.5 1H13a1.5 1.5 0 0 1 1.5 1.5V9A1.5 1.5 0 0 1 13 10.5H10" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M3.5 7.5H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M3.5 10H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Copy: reference last */}
                  <button
                    onClick={() => handleCopyRefLast(v)}
                    title={`"..." \u2013 ${getReference(v.verseNumber)}`}
                    className={`relative flex h-7 w-7 items-center justify-center rounded-lg transition ${
                      copied === "ref-last"
                        ? "bg-[rgba(34,122,89,0.12)] text-[var(--accent-strong)]"
                        : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="4" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M6 4V2.5A1.5 1.5 0 0 1 7.5 1H13a1.5 1.5 0 0 1 1.5 1.5V9A1.5 1.5 0 0 1 13 10.5H10" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M3.5 10H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M3.5 12.5H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>

                  <div className="mx-0.5 h-4 w-px bg-[var(--line-soft)]" />

                  {/* Share / copy URL */}
                  <button
                    onClick={() => handleShare(v)}
                    title={t(locale, "verse.copy_link")}
                    className={`relative flex h-7 w-7 items-center justify-center rounded-lg transition ${
                      copied === "share"
                        ? "bg-[rgba(34,122,89,0.12)] text-[var(--accent-strong)]"
                        : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M6.5 9.5L9.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      <path d="M9 5L10.8 3.2a2 2 0 0 1 2.8 0v0a2 2 0 0 1 0 2.8L11 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      <path d="M7 8L5.2 9.8a2 2 0 0 0 0 2.8v0a2 2 0 0 0 2.8 0L10 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Play verse */}
                  {ttsEnabled && (
                    <>
                      <div className="mx-0.5 h-4 w-px bg-[var(--line-soft)]" />
                      <button
                        onClick={() => tts.playSingleVerse(v.verseNumber)}
                        title={t(locale, "tts.listen_verse")}
                        className={`relative flex h-7 w-7 items-center justify-center rounded-lg transition ${
                          tts.playingVerse === v.verseNumber && tts.mode === "single"
                            ? "bg-[rgba(34,122,89,0.12)] text-[var(--accent-strong)]"
                            : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                        }`}
                      >
                        {tts.playingVerse === v.verseNumber && tts.isLoading ? (
                          <LoadingSpinner className="h-3.5 w-3.5" />
                        ) : (
                          <SpeakerIcon className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </>
                  )}

                  {copied && (
                    <span className="ml-1 text-[10px] font-semibold text-[var(--accent-strong)]">
                      {t(locale, "common.copied")}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 3L4.5 6H2.5A1.5 1.5 0 0 0 1 7.5v1A1.5 1.5 0 0 0 2.5 10H4.5L8 13V3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11 5.5C11.7 6.3 12 7.1 12 8s-.3 1.7-1 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M13 3.5C14.3 4.9 15 6.4 15 8s-.7 3.1-2 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M4 2.5v11l9-5.5L4 2.5Z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <rect x="3" y="2" width="3.5" height="12" rx="1" />
      <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <rect x="3" y="3" width="10" height="10" rx="1.5" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`animate-spin ${className}`}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
