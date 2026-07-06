"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { controlClass, FieldError, Label } from "./Field";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, required, className, id, rows = 3, ...rest }, ref) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <div>
        {label && (
          <Label htmlFor={fieldId} required={required}>
            {label}
          </Label>
        )}
        <textarea
          id={fieldId}
          ref={ref}
          rows={rows}
          aria-invalid={error ? true : undefined}
          className={cn(
            controlClass,
            "py-2",
            error && "border-bad focus:border-bad",
            className,
          )}
          {...rest}
        />
        <FieldError message={error} />
      </div>
    );
  },
);
