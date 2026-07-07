import { cn } from "@/lib/utils";

type Tone = "neutral" | "green" | "amber" | "red" | "blue";

const TONES: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-teal-100 text-teal-800",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---- Domain-specific status → tone maps ----

export function leadStatusTone(status: string): Tone {
  switch (status) {
    case "Won":
      return "green";
    case "Lost":
      return "red";
    case "Negotiation":
    case "TestDrive":
      return "amber";
    case "Contacted":
      return "blue";
    default:
      return "neutral"; // New
  }
}

export function carStatusTone(status: string): Tone {
  switch (status) {
    case "Available":
      return "green";
    case "Reserved":
      return "amber";
    case "Sold":
      return "neutral";
    default:
      return "neutral";
  }
}

export function invoiceStatusTone(status: string): Tone {
  switch (status) {
    case "Paid":
      return "green";
    case "Partial":
      return "amber";
    case "Pending":
      return "red";
    default:
      return "neutral";
  }
}
