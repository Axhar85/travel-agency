import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300",
  secondary:
    "border border-primary-200 bg-transparent text-primary-700 hover:bg-primary-50 disabled:opacity-40",
  ghost:
    "text-primary-700 underline underline-offset-2 hover:text-primary-800 disabled:opacity-40",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    variant === "ghost"
      ? "inline-flex items-center justify-center text-sm font-medium transition-colors disabled:cursor-not-allowed"
      : "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed";

  return <button className={`${base} ${VARIANT_CLASSES[variant]} ${className}`} {...props} />;
}
