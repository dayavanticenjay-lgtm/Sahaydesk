import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatCategory } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { TicketFilters } from "./ticket-filters";
import { NewTicketDialog } from "./new-ticket-dialog";
import type { TicketCategory, TicketStatus } from "@/generated/prisma/enums";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const PAGE_SIZE = 20;
const VALID_STATUSES = new Set<TicketStatus>(["NEW", "PROCESSING", "OPEN", "RESOLVED", "CLOSED"]);
const VALID_CATEGORIES = new Set<TicketCategory>(["GENERAL_QUESTION", "TECHNICAL_QUESTION", "REFUND_REQUEST"]);
const SORTABLE_FIELDS = ["createdAt", "subject", "status", "category", "senderName"] as const;
type SortField = (typeof SORTABLE_FIELDS)[number];

const COLUMNS: { field: SortField; label: string }[] = [
  { field: "subject", label: "Subject" },
  { field: "senderName", label: "From" },
  { field: "status", label: "Status" },
  { field: "category", label: "Category" },
  { field: "createdAt", label: "Created" },
];

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const statusParam = typeof params.status === "string" ? params.status : undefined;
  const categoryParam = typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.q === "string" ? params.q : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const sortField: SortField = SORTABLE_FIELDS.includes(params.sort as SortField)
    ? (params.sort as SortField)
    : "createdAt";
  const sortOrder: "asc" | "desc" = params.order === "asc" ? "asc" : "desc";

  const status = statusParam && VALID_STATUSES.has(statusParam as TicketStatus) ? (statusParam as TicketStatus) : undefined;
  const category =
    categoryParam && VALID_CATEGORIES.has(categoryParam as TicketCategory) ? (categoryParam as TicketCategory) : undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { subject: { contains: search, mode: "insensitive" as const } },
            { senderName: { contains: search, mode: "insensitive" as const } },
            { senderEmail: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ticket.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function sortHref(field: SortField) {
    const next = new URLSearchParams();
    if (status) next.set("status", status);
    if (category) next.set("category", category);
    if (search) next.set("q", search);
    next.set("sort", field);
    next.set("order", sortField === field && sortOrder === "desc" ? "asc" : "desc");
    return `/tickets?${next.toString()}`;
  }

  function pageHref(nextPage: number) {
    const next = new URLSearchParams();
    if (status) next.set("status", status);
    if (category) next.set("category", category);
    if (search) next.set("q", search);
    next.set("sort", sortField);
    next.set("order", sortOrder);
    next.set("page", String(nextPage));
    return `/tickets?${next.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            {total} ticket{total === 1 ? "" : "s"}
          </p>
        </div>
        <NewTicketDialog />
      </div>

      <TicketFilters status={status} category={category} search={search} />

      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {COLUMNS.map((col) => (
                <TableHead key={col.field} className="h-10 bg-muted/40">
                  <Link
                    href={sortHref(col.field)}
                    className="flex items-center gap-1 text-xs font-bold tracking-wide text-muted-foreground uppercase hover:text-foreground"
                  >
                    {col.label}
                    {sortField === col.field ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="size-3.5" />
                      ) : (
                        <ArrowDown className="size-3.5" />
                      )
                    ) : null}
                  </Link>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={COLUMNS.length} className="h-40">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Inbox className="size-8" />
                    <p className="text-sm">No tickets found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} className="group">
                  <TableCell className="font-semibold">
                    <Link href={`/tickets/${ticket.id}`} className="block group-hover:text-primary">
                      {ticket.subject}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/tickets/${ticket.id}`} className="flex items-center gap-2.5">
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
                          {initials(ticket.senderName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm">{ticket.senderName}</span>
                        <span className="text-xs text-muted-foreground">{ticket.senderEmail}</span>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-muted-foreground">
                      {formatCategory(ticket.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ticket.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
              {page > 1 ? (
                <Link href={pageHref(page - 1)}>
                  <ChevronLeft className="size-4" />
                  Previous
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="size-4" />
                  Previous
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
              {page < totalPages ? (
                <Link href={pageHref(page + 1)}>
                  Next
                  <ChevronRight className="size-4" />
                </Link>
              ) : (
                <span>
                  Next
                  <ChevronRight className="size-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
