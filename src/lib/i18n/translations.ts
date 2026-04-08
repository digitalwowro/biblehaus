export const locales = ["en", "ro"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, { label: string }> = {
  en: { label: "English" },
  ro: { label: "Romana" },
};

const translations = {
  en: {
    "browse.title": "Browse Bibles",
    "browse.subtitle": "Select a language to see available Bible versions.",
    "browse.empty": "No published Bible versions yet.",
    "browse.version": "version",
    "browse.versions": "versions",
    "lang.back": "All Languages",
    "lang.available": "available",
    "lang.empty": "No published versions for this language.",
    "lang.books": "books",
    "version.back_to": "Back",
    "version.books": "books",
    "version.empty": "No books imported for this version.",
    "version.ot": "Old Testament",
    "version.nt": "New Testament",
    "book.chapters": "chapters",
    "chapter.verses": "verses",
    "chapter.prev": "Chapter",
    "chapter.next": "Chapter",
    "tts.listen": "Listen to chapter",
    "tts.playing": "Playing",
    "tts.verse": "Verse",
  },
  ro: {
    "browse.title": "Rasfoieste Biblii",
    "browse.subtitle": "Selecteaza o limba pentru a vedea versiunile disponibile.",
    "browse.empty": "Nicio versiune publicata inca.",
    "browse.version": "versiune",
    "browse.versions": "versiuni",
    "lang.back": "Toate limbile",
    "lang.available": "disponibile",
    "lang.empty": "Nicio versiune publicata pentru aceasta limba.",
    "lang.books": "carti",
    "version.back_to": "Inapoi",
    "version.books": "carti",
    "version.empty": "Nicio carte importata pentru aceasta versiune.",
    "version.ot": "Vechiul Testament",
    "version.nt": "Noul Testament",
    "book.chapters": "capitole",
    "chapter.verses": "versete",
    "chapter.prev": "Capitolul",
    "chapter.next": "Capitolul",
    "tts.listen": "Asculta capitolul",
    "tts.playing": "Redare",
    "tts.verse": "Versetul",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale]?.[key] ?? translations.en[key];
}
