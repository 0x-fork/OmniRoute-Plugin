"use client";

import { useTranslations } from "next-intl";
import Button from "@/shared/components/Button";

export type EventCategory =
  "all" | "providers" | "combos" | "apikeys" | "settings" | "quota" | "auth" | "system";

interface EventTypeFilterProps {
  value: EventCategory;
  onChange: (category: EventCategory) => void;
}

const CATEGORIES: EventCategory[] = [
  "all",
  "providers",
  "combos",
  "apikeys",
  "settings",
  "quota",
  "auth",
  "system",
];

const CATEGORY_PREFIXES: Record<EventCategory, string[]> = {
  all: [],
  providers: ["provider."],
  combos: ["combo."],
  apikeys: ["apikey."],
  settings: ["setting."],
  quota: ["quota.", "budget."],
  auth: ["auth."],
  system: ["update.", "deploy.", "skill.", "cloud_agent.", "mcp.", "webhook."],
};

export function matchesCategory(action: string, category: EventCategory): boolean {
  if (category === "all") return true;
  const prefixes = CATEGORY_PREFIXES[category];
  return prefixes.some((prefix) => action.startsWith(prefix));
}

export default function EventTypeFilter({ value, onChange }: EventTypeFilterProps) {
  const t = useTranslations("activity");

  const labelKey: Record<EventCategory, string> = {
    all: "filterAll",
    providers: "filterProviders",
    combos: "filterCombos",
    apikeys: "filterApiKeys",
    settings: "filterSettings",
    quota: "filterQuota",
    auth: "filterAuth",
    system: "filterSystem",
  };

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("filterAria")}>
      {CATEGORIES.map((cat) => (
        <Button
          key={cat}
          variant={value === cat ? "primary" : "outline"}
          size="sm"
          onClick={() => onChange(cat)}
          aria-pressed={value === cat}
          className="h-7 min-h-7 rounded-full px-3 text-xs"
        >
          {t(labelKey[cat])}
        </Button>
      ))}
    </div>
  );
}
