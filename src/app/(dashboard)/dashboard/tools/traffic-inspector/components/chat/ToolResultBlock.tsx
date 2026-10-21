"use client";

import { useState } from "react";
import Icon from "@/shared/components/Icon";
import { JsonViewer } from "../shared/JsonViewer";
import { shortCallId } from "@/shared/utils/formatting";

interface ToolResultBlockProps {
  toolUseId: string;
  content: unknown;
}

export function ToolResultBlock({ toolUseId, content }: ToolResultBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-control border border-success/40 bg-success-bg px-3 py-2 text-sm">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        // Full-width disclosure row (name + call id); a kit Button is a fixed-height,
        // centred pill, so this stays a native button styled with tokens.
        className="flex w-full items-center gap-2 rounded-control text-left focus-ring"
      >
        <Icon name={expanded ? "expand_less" : "expand_more"} size={14} className="text-success" />
        <span className="text-text-main font-mono font-medium text-xs">tool_result</span>
        <span className="text-text-muted text-xs font-mono ml-auto" title={toolUseId}>
          {shortCallId(toolUseId)}
        </span>
      </button>
      {expanded && (
        <div className="mt-2 border-t border-success/20 pt-2">
          <JsonViewer data={content} />
        </div>
      )}
    </div>
  );
}
