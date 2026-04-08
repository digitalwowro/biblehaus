import { type Locale } from "@/lib/i18n/translations";

function FlagGB({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className}>
      <clipPath id="gb-clip">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#gb-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0 0L60 30M60 0L0 30" stroke="#FFF" strokeWidth="6" />
        <path d="M0 0L60 30M60 0L0 30" stroke="#C8102E" strokeWidth="2" />
        <path d="M30 0V30M0 15H60" stroke="#FFF" strokeWidth="10" />
        <path d="M30 0V30M0 15H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

function FlagRO({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 6 4" className={className}>
      <rect width="2" height="4" fill="#002B7F" />
      <rect x="2" width="2" height="4" fill="#FCD116" />
      <rect x="4" width="2" height="4" fill="#CE1126" />
    </svg>
  );
}

const flagComponents: Record<Locale, typeof FlagGB> = {
  en: FlagGB,
  ro: FlagRO,
};

export function Flag({ locale, className = "h-3.5 w-5 rounded-[2px]" }: { locale: Locale; className?: string }) {
  const Component = flagComponents[locale];
  return <Component className={className} />;
}
