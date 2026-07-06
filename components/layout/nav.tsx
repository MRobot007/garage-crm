import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...stroke}>
      {children}
    </svg>
  );
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <Svg>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </Svg>
    ),
  },
  {
    href: "/leads",
    label: "Leads",
    icon: (
      <Svg>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
      </Svg>
    ),
  },
  {
    href: "/cars",
    label: "Cars",
    icon: (
      <Svg>
        <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" />
        <path d="M3 17h18v-2.5a1.5 1.5 0 0 0-1.5-1.5h-15A1.5 1.5 0 0 0 3 14.5V17z" />
        <circle cx="7" cy="17.5" r="1.5" />
        <circle cx="17" cy="17.5" r="1.5" />
      </Svg>
    ),
  },
  {
    href: "/accessories",
    label: "Accessories",
    icon: (
      <Svg>
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        <circle cx="12" cy="12" r="3.2" />
      </Svg>
    ),
  },
  {
    href: "/invoices",
    label: "Sales & Invoices",
    icon: (
      <Svg>
        <path d="M6 2h9l3 3v17l-2.5-1.5L13 22l-2.5-1.5L8 22l-2-1.5V2z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </Svg>
    ),
  },
  {
    href: "/customers",
    label: "Customers",
    icon: (
      <Svg>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
      </Svg>
    ),
  },
  {
    href: "/reports",
    label: "Reports",
    icon: (
      <Svg>
        <path d="M3 3v18h18" />
        <rect x="7" y="11" width="3" height="6" />
        <rect x="12" y="7" width="3" height="10" />
        <rect x="17" y="13" width="3" height="4" />
      </Svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <Svg>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 12 4.6a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 19.4 9a2 2 0 1 1 0 4z" />
      </Svg>
    ),
  },
];
