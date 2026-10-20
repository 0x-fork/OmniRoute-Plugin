"use client";

import { forwardRef } from "react";
import { Textarea as KitTextarea } from "@omniroute/ui-kit/textarea";
import { cn } from "@/shared/utils/cn";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

/**
 * Textarea — adapter over the kit Textarea (same border, focus ring and radius as Input).
 * `error` maps to the kit's error border and marks the control `aria-invalid`.
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error = false, className, ...props },
  ref
) {
  return (
    <KitTextarea
      ref={ref}
      error={error}
      aria-invalid={error || undefined}
      className={cn(className)}
      {...props}
    />
  );
});

export default Textarea;
