import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

interface FieldProps {
  label: string;
  error?: string;
}

export function InputField({
  label,
  error,
  className,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        className={cn(
          "min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-base text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
          error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
          className
        )}
        {...props}
      />
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  error,
  className,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <select
        className={cn(
          "min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-base text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
          error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variants = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300",
    secondary:
      "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 disabled:bg-zinc-100",
    ghost: "text-zinc-600 hover:bg-zinc-100",
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl px-4 text-base font-medium transition disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Alert({
  children,
  variant = "error",
}: {
  children: React.ReactNode;
  variant?: "error" | "success" | "info";
}) {
  const variants = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", variants[variant])}>
      {children}
    </div>
  );
}
