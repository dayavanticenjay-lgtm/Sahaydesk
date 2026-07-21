"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCategory, formatStatus } from "@/lib/format";

const STATUSES = ["OPEN", "RESOLVED", "CLOSED", "NEW", "PROCESSING"];
const CATEGORIES = ["GENERAL_QUESTION", "TECHNICAL_QUESTION", "REFUND_REQUEST"];

export function TicketFilters({
  status,
  category,
  search,
}: {
  status?: string;
  category?: string;
  search?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(search ?? "");

  function updateParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateParam("q", value || undefined);
  }, 300);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Search subject, name, or email…"
        value={searchValue}
        onChange={(e) => {
          setSearchValue(e.target.value);
          debouncedSearch(e.target.value);
        }}
        className="sm:max-w-xs"
      />
      <Select value={status ?? "all"} onValueChange={(v) => updateParam("status", v === "all" ? undefined : v)}>
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {formatStatus(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={category ?? "all"} onValueChange={(v) => updateParam("category", v === "all" ? undefined : v)}>
        <SelectTrigger className="sm:w-48">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {formatCategory(c)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
