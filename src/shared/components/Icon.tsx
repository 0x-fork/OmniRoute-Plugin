"use client";

import { createElement } from "react";
import type { LucideProps } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { resolveIcon } from "@/shared/constants/iconMap";

export interface IconProps {
  /** Material Symbols name (the legacy vocabulary). Mapped names render Lucide; others fall back. */
  name?: string | null;
  /** Pixel size (width = height). 18 matches the legacy `text-[18px]` icon spans. */
  size?: number;
  className?: string;
  /** When set, the icon is meaningful: role="img" + aria-label. Otherwise aria-hidden. */
  ariaLabel?: string;
  strokeWidth?: number;
  /** Legacy `FILL 1` look (active nav item). Lucide is stroke-only; we thicken the stroke. */
  fill?: boolean;
}

const warned = new Set<string>();

export default function Icon({
  name,
  size = 18,
  className,
  ariaLabel,
  strokeWidth,
  fill = false,
}: IconProps) {
  if (!name) return null;
  const Lucide = resolveIcon(name);
  const a11y = ariaLabel
    ? { role: "img" as const, "aria-label": ariaLabel }
    : { "aria-hidden": true as const };
  if (Lucide) {
    // ICON_MAP values are module-level Lucide components (stable identity), but the
    // react-hooks/static-components rule cannot see through resolveIcon(); createElement
    // renders the same element without the JSX-tag heuristic.
    const props: LucideProps & { "data-icon": string } = {
      ...a11y,
      width: size,
      height: size,
      strokeWidth: strokeWidth ?? (fill ? 2.5 : 2),
      className: cn("oi-icon shrink-0 pointer-events-none", className),
      "data-icon": name,
    };
    return createElement(Lucide, props);
  }
  if (process.env.NODE_ENV !== "production" && !warned.has(name)) {
    warned.add(name);
    console.warn(
      `[Icon] "${name}" has no Lucide mapping yet — rendering the Material ligature (add it to src/shared/constants/iconMap.ts)`
    );
  }
  return (
    <span
      {...a11y}
      className={cn("material-symbols-outlined shrink-0 pointer-events-none", className)}
      style={{ fontSize: size, ...(fill ? { fontVariationSettings: "'FILL' 1" } : null) }}
      data-icon={name}
    >
      {name}
    </span>
  );
}
