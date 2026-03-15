"use client";

import { forwardRef, useState, useRef, useEffect, useId } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, X, Check, Loader2 } from "lucide-react";
import { FieldWrapper } from "./FieldWrapper";
import type { SelectOption } from "@/types";

type SelectFieldSize = "sm" | "md" | "lg";

interface SelectFieldBaseProps {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  fieldSize?: SelectFieldSize;
  fullWidth?: boolean;
  loading?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

interface SingleSelectProps extends SelectFieldBaseProps {
  multiple?: false;
  value?: string;
  onChange?: (value: string) => void;
}

interface MultiSelectProps extends SelectFieldBaseProps {
  multiple: true;
  value?: string[];
  onChange?: (value: string[]) => void;
}

type SelectFieldProps = SingleSelectProps | MultiSelectProps;

const sizeStyles: Record<SelectFieldSize, string> = {
  sm: "min-h-[32px] text-sm px-3 py-1",
  md: "min-h-[36px] text-sm px-3 py-1.5",
  lg: "min-h-[44px] text-base px-4 py-2",
};

export const SelectField = forwardRef<HTMLDivElement, SelectFieldProps>(
  (props, ref) => {
    const {
      label,
      description,
      error,
      hint,
      options,
      placeholder = "Selecionar...",
      fieldSize = "md",
      fullWidth = true,
      loading,
      clearable,
      searchable,
      disabled,
      required,
      className,
      id,
      multiple,
      value,
      onChange,
    } = props;

    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
          setSearch("");
        }
      }
      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [open]);

    const filtered = search
      ? options.filter((o) =>
          o.label.toLowerCase().includes(search.toLowerCase())
        )
      : options;

    const selectedLabels = multiple
      ? options.filter((o) => (value as string[])?.includes(o.value)).map((o) => o.label)
      : [];

    const selectedLabel = !multiple
      ? options.find((o) => o.value === value)?.label
      : null;

    function handleSelect(optValue: string) {
      if (multiple) {
        const current = (value as string[]) ?? [];
        const next = current.includes(optValue)
          ? current.filter((v) => v !== optValue)
          : [...current, optValue];
        (onChange as MultiSelectProps["onChange"])?.(next);
      } else {
        (onChange as SingleSelectProps["onChange"])?.(optValue);
        setOpen(false);
        setSearch("");
      }
    }

    function handleClear(e: React.MouseEvent) {
      e.stopPropagation();
      if (multiple) {
        (onChange as MultiSelectProps["onChange"])?.([]);
      } else {
        (onChange as SingleSelectProps["onChange"])?.("");
      }
    }

    const hasValue = multiple
      ? (value as string[])?.length > 0
      : !!value;

    return (
      <FieldWrapper
        label={label}
        htmlFor={fieldId}
        required={required}
        error={error}
        hint={hint}
        description={description}
        className={fullWidth ? "w-full" : undefined}
      >
        <div className="relative" ref={containerRef}>
          <div ref={ref}>
            <button
              type="button"
              id={fieldId}
              disabled={disabled || loading}
              onClick={() => !disabled && !loading && setOpen(!open)}
              className={cn(
                "flex items-center justify-between w-full rounded-lg border bg-white transition-colors text-left gap-2",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
                error ? "border-red-300" : "border-slate-300",
                sizeStyles[fieldSize],
                className
              )}
            >
              <span className={cn("flex-1 truncate", !hasValue && "text-slate-400")}>
                {multiple
                  ? selectedLabels.length > 0
                    ? selectedLabels.join(", ")
                    : placeholder
                  : selectedLabel ?? placeholder}
              </span>

              <div className="flex items-center gap-1 flex-shrink-0">
                {loading && <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />}
                {clearable && hasValue && !loading && (
                  <X
                    className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600"
                    onClick={handleClear}
                  />
                )}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate-400 transition-transform",
                    open && "rotate-180"
                  )}
                />
              </div>
            </button>
          </div>

          {open && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {searchable && (
                <div className="p-2 border-b border-slate-100">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                </div>
              )}
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-sm text-slate-400 text-center">
                  Nenhuma opção encontrada
                </div>
              ) : (
                filtered.map((opt) => {
                  const isSelected = multiple
                    ? (value as string[])?.includes(opt.value)
                    : value === opt.value;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-sm transition-colors",
                        isSelected
                          ? "bg-blue-pale text-primary"
                          : "text-slate-700 hover:bg-slate-50",
                        opt.disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {opt.label}
                      {isSelected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </FieldWrapper>
    );
  }
);

SelectField.displayName = "SelectField";
