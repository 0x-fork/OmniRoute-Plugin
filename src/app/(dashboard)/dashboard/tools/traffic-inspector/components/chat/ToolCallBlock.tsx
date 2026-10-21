"use client";

import { useState } from "react";
import Icon from "@/shared/components/Icon";
import { JsonViewer } from "../shared/JsonViewer";
import { shortCallId } from "@/shared/utils/formatting";

interface ToolCallBlockProps {
  id: string;
  name: string;
  input: unknown;
}

export function ToolCallBlock({ id, name, input }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-control border border-warning/40 bg-warning-bg px-3 py-2 text-sm">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        // Full-width disclosure row (name + call id); a kit Button is a fixed-height,
        // centred pill, so this stays a native button styled with tokens.
        className="flex w-full items-center gap-2 rounded-control text-left focus-ring"
      >
        <Icon name={expanded ? "expand_less" : "expand_more"} size={14} className="text-warning" />
        <span className="text-text-main font-mono font-medium">{name}</span>
        <span className="text-text-muted text-xs font-mono ml-auto" title={id}>
          {shortCallId(id)}
        </span>
      </button>
      {expanded && (
        <div className="mt-2 border-t border-warning/20 pt-2">
          <JsonViewer data={input} />
        </div>
      )}
    </div>
  );
}
