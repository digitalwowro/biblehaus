import Image from "next/image";
import Link from "next/link";
import logoImage from "@/assets/biblehaus.png";

type LogoSize = "header" | "sidebar" | "login";

const sizeMap: Record<
  LogoSize,
  { width: number; className: string; wrapperClassName?: string }
> = {
  header: {
    width: 120,
    className: "w-[120px]",
  },
  sidebar: { width: 156, className: "w-[156px]" },
  login: { width: 220, className: "w-[220px]" },
};

interface BrandLogoProps {
  size?: LogoSize;
  href?: string;
  priority?: boolean;
}

export function BrandLogo({
  size = "header",
  href,
  priority = false,
}: BrandLogoProps) {
  const config = sizeMap[size];

  const image = (
    <span className={config.wrapperClassName}>
      <Image
        src={logoImage}
        alt="BibleHaus"
        width={config.width}
        priority={priority}
        className={`h-auto ${config.className}`}
      />
    </span>
  );

  if (!href) return image;

  return (
    <Link href={href} className="inline-flex items-center">
      {image}
    </Link>
  );
}
