import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, options, placeholder, className = "", ...props }, ref) => {
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
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={`h-11 w-full appearance-none rounded-[18px] border bg-white px-4 pr-10 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)] ${
              error
                ? "border-[rgba(193,62,62,0.35)]"
                : "border-[var(--line-strong)]"
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--ink-muted)]">
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path
                d="m4.5 6.5 3.5 3.5 3.5-3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        {error && (
          <p className="mt-1 text-xs text-[var(--accent-red)]" aria-live="polite">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
