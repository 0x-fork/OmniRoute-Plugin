"use client";

import { Tabs, TabsList, TabsTrigger } from "@omniroute/ui-kit/tabs";
import { cn } from "@/shared/utils/cn";
import Icon from "./Icon";

interface SegmentedOption {
  value: string;
  label: string;
  icon?: string;
}

interface SegmentedControlProps {
  options?: SegmentedOption[];
  value?: string;
  onChange?: (value: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  "aria-label"?: string;
}

const SIZES = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

/**
 * Segmented control over the kit capsule `Tabs` (KEA-7886): `role="tablist"` with
 * `role="tab"` + `aria-selected` triggers and arrow-key navigation from the kit.
 */
export default function SegmentedControl({
  options = [],
  value,
  onChange,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: SegmentedControlProps) {
  return (
    <Tabs
      variant="capsule"
      value={value}
      onValueChange={(next) => onChange?.(next)}
      className={cn("max-w-full", SIZES[size], className)}
    >
      <TabsList aria-label={ariaLabel} className="flex-wrap">
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className="gap-1.5 whitespace-nowrap"
          >
            {option.icon && <Icon name={option.icon} size={16} />}
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
