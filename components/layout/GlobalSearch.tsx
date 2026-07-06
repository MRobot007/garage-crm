"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getJSON } from "@/lib/fetcher";

interface SearchHit {
  type: "lead" | "car" | "customer" | "invoice";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const TYPE_LABEL: Record<SearchHit["type"], string> = {
  lead: "Lead",
  car: "Car",
  customer: "Customer",
  invoice: "Invoice",
};

export function GlobalSearch() {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => getJSON<SearchHit[]>(`/api/search?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 2,
    staleTime: 10_000,
  });

  const hits = data ?? [];
  const showPanel = open && debounced.length >= 2;

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </span>
        <input
          type="search"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search leads, cars, customers…"
          aria-label="Global search"
          className="glass-input w-full rounded-lg py-2 pl-9 pr-3 text-sm text-ink"
        />
      </div>

      {showPanel && (
        <div className="glass-strong absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl shadow-xl">
          {isFetching && hits.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">Searching…</p>
          )}
          {!isFetching && hits.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">
              No matches for “{debounced}”.
            </p>
          )}
          <ul className="max-h-80 overflow-y-auto">
            {hits.map((hit) => (
              <li key={`${hit.type}-${hit.id}`}>
                <Link
                  href={hit.href}
                  onClick={() => {
                    setOpen(false);
                    setTerm("");
                  }}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-white/60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">
                      {hit.title}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {hit.subtitle}
                    </span>
                  </span>
                  <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                    {TYPE_LABEL[hit.type]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
