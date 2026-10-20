"use client";

import { forwardRef } from "react";
import {
  Button as KitButton,
  type ButtonSize as KitSize,
  type ButtonVariant as KitVariant,
} from "@omniroute/ui-kit/button";
import { cn } from "@/shared/utils/cn";
import Icon from "./Icon";

/** Legacy variant vocabulary — kept because 150+ call sites and Modal.tsx type against it. */
export type ButtonVariant =
  "primary" | "accent" | "secondary" | "outline" | "ghost" | "warning" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const VARIANT_TO_KIT: Record<ButtonVariant, { variant: KitVariant; className?: string }> = {
  primary: { variant: "default" },
  accent: { variant: "default" },
  secondary: { variant: "secondary" },
  outline: { variant: "outline" },
  ghost: { variant: "ghost" },
  danger: { variant: "destructive" },
  // kit has no warning button: outline + the `.ci-button--warning` extension in globals.css
  warning: { variant: "outline", className: "ci-button--warning" },
};

const SIZE_TO_KIT: Record<ButtonSize, KitSize> = {
  sm: "sm",
  md: "default",
  lg: "lg",
  icon: "icon",
  "icon-sm": "icon-sm",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Material Symbols name (resolved through <Icon>). */
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18, icon: 20, "icon-sm": 16 };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    icon,
    iconRight,
    disabled = false,
    loading = false,
    fullWidth = false,
    className,
    type = "button",
    ...props
  },
  ref
) {
  const kit = VARIANT_TO_KIT[variant];
  return (
    <KitButton
      ref={ref}
      type={type}
      variant={kit.variant}
      size={SIZE_TO_KIT[size]}
      loading={loading}
      disabled={disabled || loading}
      className={cn(kit.className, fullWidth && "w-full", className)}
      {...props}
    >
      {!loading && icon ? <Icon name={icon} size={ICON_SIZE[size]} /> : null}
      {children}
      {!loading && iconRight ? <Icon name={iconRight} size={ICON_SIZE[size]} /> : null}
    </KitButton>
  );
});

export default Button;
