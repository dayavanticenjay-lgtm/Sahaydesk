"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["ADMIN", "AGENT"]),
});

export type CreateUserState = { error?: string } | undefined;

export async function createUserAction(_prevState: CreateUserState, formData: FormData): Promise<CreateUserState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashed,
        role: parsed.data.role,
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { error: "A user with that email already exists." };
    }
    throw error;
  }

  revalidatePath("/users");
}

const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.email("Enter a valid email address."),
  password: z.union([z.literal(""), z.string().min(8, "Password must be at least 8 characters.")]),
  role: z.enum(["ADMIN", "AGENT"]).optional(),
});

export type UpdateUserState = { error?: string } | undefined;

export async function updateUserAction(
  userId: number,
  _prevState: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> {
  const admin = await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") ?? "",
    role: formData.get("role") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const isSelf = userId === Number(admin.id);
  const data: { name: string; email: string; password?: string; role?: Role } = {
    name: parsed.data.name,
    email: parsed.data.email,
  };

  if (parsed.data.password) {
    data.password = await bcrypt.hash(parsed.data.password, 10);
  }

  if (parsed.data.role && !isSelf) {
    data.role = parsed.data.role;
  }

  try {
    await prisma.user.update({ where: { id: userId }, data });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { error: "A user with that email already exists." };
    }
    throw error;
  }

  revalidatePath("/users");
}

export async function updateUserRoleAction(userId: number, role: Role) {
  const admin = await requireAdmin();

  if (userId === Number(admin.id)) {
    throw new Error("You can't change your own role.");
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/users");
}

export async function setUserActiveAction(userId: number, active: boolean) {
  const admin = await requireAdmin();

  if (userId === Number(admin.id)) {
    throw new Error("You can't deactivate your own account.");
  }

  await prisma.user.update({ where: { id: userId }, data: { deletedAt: active ? null : new Date() } });
  revalidatePath("/users");
  revalidatePath("/tickets");
}
