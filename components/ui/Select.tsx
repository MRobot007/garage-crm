"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { controlClass, FieldError, inputHeight, Label } from "./Field";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, required, options, className, id, children, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <select
        id={fieldId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          controlClass,
          inputHeight,
          "appearance-none pr-9",
          error && "border-bad focus:border-bad",
          className,
        )}
        style={{
          // Single chevron, pinned right — all background props set inline so
          // no class/shorthand can cause it to tile or shift.
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.6rem center",
          backgroundSize: "16px 16px",
        }}
        {...rest}
      >
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      <FieldError message={error} />
    </div>
  );
});
