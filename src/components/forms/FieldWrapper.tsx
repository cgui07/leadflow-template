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
          className="block text-sm font-medium text-neutral-dark"
        >
          {label}
          {required && <div className="inline text-danger ml-0.5">*</div>}
        </label>
      )}
      {description && (
        <div className="text-xs text-neutral">{description}</div>
      )}
      {children}
      {error && <div className="text-xs text-danger">{error}</div>}
      {!error && hint && <div className="text-xs text-neutral-muted">{hint}</div>}
    </div>
  );
}
