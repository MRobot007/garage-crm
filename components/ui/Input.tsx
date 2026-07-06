"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { controlClass, FieldError, inputHeight, Label } from "./Field";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, required, hint, className, id, ...rest },
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
      <input
        id={fieldId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          controlClass,
          inputHeight,
          error && "border-bad focus:border-bad",
          className,
        )}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
});
