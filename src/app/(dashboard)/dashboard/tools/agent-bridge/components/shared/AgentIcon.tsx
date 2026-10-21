"use client";

import Icon from "@/shared/components/Icon";

interface AgentIconProps {
  icon: string;
  color: string;
  size?: number;
}

/** Agent glyph on a tint of the agent's brand colour (data colour from the target registry). */
export function AgentIcon({ icon, color, size = 20 }: AgentIconProps) {
  return (
    <div
      className="flex items-center justify-center rounded-control shrink-0"
      style={{
        backgroundColor: `${color}20`,
        color,
        width: size + 12,
        height: size + 12,
      }}
    >
      <Icon name={icon} size={size} />
    </div>
  );
}
