import { UserX } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { NewUserDialog } from "./new-user-dialog";
import { UserRowActions } from "./user-row-actions";
import { UserSearch } from "./user-search";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const currentUser = await requireAdmin();
  const { q } = await searchParams;
  const search = typeof q === "string" && q.trim() ? q.trim() : undefined;

  const users = await prisma.user.findMany({
    where: {
      isAiAgent: false,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ deletedAt: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} account{users.length === 1 ? "" : "s"}
          </p>
        </div>
        <NewUserDialog />
      </div>

      <UserSearch search={search} />

      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 bg-muted/40 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                User
              </TableHead>
              <TableHead className="h-10 bg-muted/40 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Role
              </TableHead>
              <TableHead className="h-10 bg-muted/40 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Status
              </TableHead>
              <TableHead className="h-10 bg-muted/40 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Joined
              </TableHead>
              <TableHead className="h-10 w-10 bg-muted/40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-40">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <UserX className="size-8" />
                    <p className="text-sm">No users found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
              const isActive = !user.deletedAt;
              const isSelf = user.id === Number(currentUser.id);

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                          {initials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold">
                          {user.name}
                          {isSelf ? <span className="ml-1.5 text-xs text-muted-foreground">(you)</span> : null}
                        </span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "outline"} className="font-normal">
                      {user.role === "ADMIN" ? "Admin" : "Agent"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        isActive
                          ? "inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300"
                          : "inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                      }
                    >
                      <span className={`size-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
                      {isActive ? "Active" : "Deactivated"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <UserRowActions
                      userId={user.id}
                      name={user.name}
                      email={user.email}
                      role={user.role}
                      isActive={isActive}
                      isSelf={isSelf}
                    />
                  </TableCell>
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
