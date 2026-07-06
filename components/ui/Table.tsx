import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Wrap a table so it scrolls horizontally on small screens. */
export function TableWrap({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("glass scroll-x rounded-2xl", className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-white/50 bg-white/40 text-left text-xs uppercase tracking-wide text-gray-500">
      {children}
    </thead>
  );
}

export function TH({
  className,
  children,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("whitespace-nowrap px-4 py-3 font-medium", className)}
      {...rest}
    >
      {children}
    </th>
  );
}

export const TBody = forwardRef<
  HTMLTableSectionElement,
  { children: React.ReactNode }
>(function TBody({ children }, ref) {
  return (
    <tbody ref={ref} className="divide-y divide-white/40">
      {children}
    </tbody>
  );
});

export function TR({
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-white/50", className)} {...rest} />;
}

export function TD({
  className,
  children,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3 align-middle text-ink", className)} {...rest}>
      {children}
    </td>
  );
}
