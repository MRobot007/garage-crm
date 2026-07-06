import { cn } from "@/lib/utils";

export function Label({
  className,
  required,
  children,
  ...rest
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("mb-1 block text-sm font-medium text-gray-700", className)}
      {...rest}
    >
      {children}
      {required && <span className="ml-0.5 text-bad">*</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-bad">{message}</p>;
}

const baseControl =
  "glass-input w-full rounded-lg px-3 text-sm text-ink focus:border-brand disabled:opacity-60";

export const controlClass = baseControl;
export const inputHeight = "h-10";
