"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@omniroute/ui-kit/table";
import Card from "@/shared/components/Card";
import Icon from "@/shared/components/Icon";

export interface SkillsConceptCardProps {
  variant: "agent" | "omni";
  className?: string;
}

const COMPARISON_ROWS = ["whatIs", "direction", "executor", "storage", "tagline"] as const;
type ComparisonRow = (typeof COMPARISON_ROWS)[number];

export function SkillsConceptCard({
  variant,
  className = "",
}: SkillsConceptCardProps): JSX.Element {
  const t = useTranslations("agentSkills");

  const crossLinkHref = variant === "agent" ? "/dashboard/omni-skills" : "/dashboard/agent-skills";

  const title = t(`conceptCard.${variant}.title`);
  const crossLinkLabel = t(`conceptCard.${variant}.crossLinkLabel`);

  const agentIcon = "share";
  const omniIcon = "auto_fix_high";
  const icon = variant === "agent" ? agentIcon : omniIcon;

  return (
    <Card padding="sm" data-testid={`skills-concept-card-${variant}`} className={className}>
      {/* Header row */}
      <div className="mb-4 flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon name={icon} size={20} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text-main">{title}</h3>
        </div>
        <Link
          href={crossLinkHref}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-primary transition-colors hover:text-primary/80"
        >
          {crossLinkLabel}
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>

      {/* Comparison table (small, fixed 3 columns: native scrollbar is enough) */}
      <Table
        persistentScrollbars={false}
        className="min-w-0 text-xs"
        containerClassName="bg-surface"
      >
        <TableHeader>
          <TableRow>
            <TableHead className="h-auto px-3 py-2">
              <span className="ci-sr-only">{title}</span>
            </TableHead>
            <TableHead className="h-auto px-3 py-2 font-semibold">
              {t("conceptCard.comparison.colAgent")}
            </TableHead>
            <TableHead className="h-auto px-3 py-2 font-semibold">
              {t("conceptCard.comparison.colOmni")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {COMPARISON_ROWS.map((row: ComparisonRow) => (
            <TableRow key={row} data-testid={`comparison-row-${row}`}>
              <TableHead scope="row" className="h-auto whitespace-normal px-3 py-2 font-medium">
                {t(`conceptCard.comparison.${row}.label`)}
              </TableHead>
              <TableCell className="h-auto whitespace-normal px-3 py-2 text-text-main">
                {t(`conceptCard.comparison.${row}.agent`)}
              </TableCell>
              <TableCell className="h-auto whitespace-normal px-3 py-2 text-text-main">
                {t(`conceptCard.comparison.${row}.omni`)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export default SkillsConceptCard;
