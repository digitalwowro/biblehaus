import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`h-11 w-full rounded-[18px] border bg-white px-4 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)] ${
            error
              ? "border-[rgba(193,62,62,0.35)]"
              : "border-[var(--line-strong)]"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--accent-red)]" aria-live="polite">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
