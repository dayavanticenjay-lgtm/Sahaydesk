"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setUserActiveAction, updateUserRoleAction } from "@/lib/actions/users";
import { EditUserDialog } from "./edit-user-dialog";
import type { Role } from "@/generated/prisma/enums";

export function UserRowActions({
  userId,
  name,
  email,
  role,
  isActive,
  isSelf,
}: {
  userId: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  function handleRoleChange(nextRole: Role) {
    startTransition(async () => {
      try {
        await updateUserRoleAction(userId, nextRole);
        toast.success(`Role updated to ${nextRole === "ADMIN" ? "Admin" : "Agent"}.`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't update role.");
      }
    });
  }

  function handleActiveToggle(nextActive: boolean) {
    startTransition(async () => {
      try {
        await setUserActiveAction(userId, nextActive);
        toast.success(nextActive ? "User reactivated." : "User deactivated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't update user.");
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={isPending}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setEditOpen(true);
            }}
          >
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          {isSelf ? null : role === "AGENT" ? (
            <DropdownMenuItem onClick={() => handleRoleChange("ADMIN")}>
              <ShieldCheck className="size-4" />
              Make admin
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleRoleChange("AGENT")}>
              <ShieldOff className="size-4" />
              Make agent
            </DropdownMenuItem>
          )}
          {isSelf ? null : isActive ? (
            <DropdownMenuItem variant="destructive" onClick={() => handleActiveToggle(false)}>
              <UserX className="size-4" />
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleActiveToggle(true)}>
              <UserCheck className="size-4" />
              Reactivate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={{ id: userId, name, email, role }}
        isSelf={isSelf}
      />
    </>
  );
}
