import { cn } from "@/lib/utils";

interface FieldWrapperProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldWrapper({
  label,
  htmlFor,
  required,
  error,
  hint,
  description,
  children,
  className,
}: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
