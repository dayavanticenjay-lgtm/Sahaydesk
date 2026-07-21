"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";

export function UserSearch({ search }: { search?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(search ?? "");

  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <Input
      placeholder="Search name or email…"
      value={searchValue}
      onChange={(e) => {
        setSearchValue(e.target.value);
        debouncedSearch(e.target.value);
      }}
      className="sm:max-w-xs"
    />
  );
}
