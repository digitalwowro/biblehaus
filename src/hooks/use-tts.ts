"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Mode = "idle" | "single" | "chapter";

interface UseTTSParams {
  version: string;
  bookNumber: number;
  chapter: number;
  verses: { verseNumber: number }[];
}

interface UseTTSReturn {
  playingVerse: number | null;
  isPlaying: boolean;
  isLoading: boolean;
  mode: Mode;
  playSingleVerse: (verseNumber: number) => void;
  playChapterFrom: (startVerse?: number) => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  stopPlayback: () => void;
}

function buildUrl(version: string, bookNumber: number, chapter: number, verse: number): string {
  return `/api/tts?version=${encodeURIComponent(version)}&book=${bookNumber}&chapter=${chapter}&verse=${verse}`;
}

export function useTTS({ version, bookNumber, chapter, verses }: UseTTSParams): UseTTSReturn {
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlsRef = useRef<Map<number, string>>(new Map());
  const abortRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    const blobUrls = blobUrlsRef.current;

    return () => {
      abortRef.current = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      for (const url of blobUrls.values()) {
        URL.revokeObjectURL(url);
      }
      blobUrls.clear();
    };
  }, []);

  const getOrFetchBlobUrl = useCallback(
    async (verseNumber: number): Promise<string> => {
      const existing = blobUrlsRef.current.get(verseNumber);
      if (existing) return existing;

      const url = buildUrl(version, bookNumber, chapter, verseNumber);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`TTS fetch failed: ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobUrlsRef.current.set(verseNumber, blobUrl);
      return blobUrl;
    },
    [version, bookNumber, chapter],
  );

  const playAudio = useCallback(
    (blobUrl: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(blobUrl);
        audioRef.current = audio;
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("Audio playback error"));
        audio.play().catch(reject);
      });
    },
    [],
  );

  const stopPlayback = useCallback(() => {
    abortRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingVerse(null);
    setIsPlaying(false);
    setIsLoading(false);
    setMode("idle");
  }, []);

  const playSingleVerse = useCallback(
    async (verseNumber: number) => {
      stopPlayback();

      // Reset abort for new playback
      abortRef.current = false;
      setMode("single");
      setIsLoading(true);
      setPlayingVerse(verseNumber);

      try {
        const blobUrl = await getOrFetchBlobUrl(verseNumber);
        if (abortRef.current) return;

        setIsLoading(false);
        setIsPlaying(true);
        await playAudio(blobUrl);
      } catch (err) {
        if (abortRef.current) return;
        console.error("TTS playback error:", err);
      } finally {
        if (!abortRef.current) {
          setPlayingVerse(null);
          setIsPlaying(false);
          setMode("idle");
        }
      }
    },
    [stopPlayback, getOrFetchBlobUrl, playAudio],
  );

  const playChapterFrom = useCallback(
    async (startVerse?: number) => {
      stopPlayback();
      abortRef.current = false;

      const startIndex = startVerse
        ? verses.findIndex((v) => v.verseNumber === startVerse)
        : 0;
      if (startIndex === -1) return;

      setMode("chapter");

      for (let i = startIndex; i < verses.length; i++) {
        if (abortRef.current) break;

        const v = verses[i];
        setPlayingVerse(v.verseNumber);
        setIsLoading(true);

        try {
          // Prefetch next verse while current loads
          const nextVerse = verses[i + 1];
          const fetchPromise = getOrFetchBlobUrl(v.verseNumber);
          if (nextVerse) {
            getOrFetchBlobUrl(nextVerse.verseNumber).catch(() => {});
          }

          const blobUrl = await fetchPromise;
          if (abortRef.current) break;

          setIsLoading(false);
          setIsPlaying(true);
          await playAudio(blobUrl);
          if (abortRef.current) break;
        } catch (err) {
          if (abortRef.current) break;
          console.error("TTS chapter playback error:", err);
          break;
        }
      }

      if (!abortRef.current) {
        setPlayingVerse(null);
        setIsPlaying(false);
        setMode("idle");
      }
    },
    [stopPlayback, verses, getOrFetchBlobUrl, playAudio],
  );

  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resumePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  return {
    playingVerse,
    isPlaying,
    isLoading,
    mode,
    playSingleVerse,
    playChapterFrom,
    pausePlayback,
    resumePlayback,
    stopPlayback,
  };
}
