import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[var(--accent-strong)] text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] hover:bg-[var(--accent-strong-hover)]",
  secondary:
    "border border-[var(--line-strong)] bg-[var(--surface-card)] text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]",
  danger:
    "border border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] text-[var(--accent-red)] hover:bg-[rgba(193,62,62,0.08)]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
