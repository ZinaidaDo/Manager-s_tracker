"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireAdmin } from "@/lib/auth";

function reqString(formData: FormData, name: string) {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

function parseRole(v: string) {
  if (v === "ADMIN" || v === "PROJECT_MANAGER" || v === "EMPLOYEE") return v;
  return "EMPLOYEE";
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const email = reqString(formData, "email").toLowerCase();
  const firstName = reqString(formData, "firstName");
  const lastName = reqString(formData, "lastName");
  const position = reqString(formData, "position") || null;
  const role = parseRole(reqString(formData, "role"));
  const password = reqString(formData, "password");
  if (!email || !firstName || !lastName || !password) throw new Error("Заполните обязательные поля");
  await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      position,
      role,
      passwordHash: hashPassword(password),
    },
  });
  revalidatePath("/admin/users");
  revalidatePath("/team");
  redirect("/admin/users");
}

export async function updateUser(userId: string, formData: FormData) {
  await requireAdmin();
  const email = reqString(formData, "email").toLowerCase();
  const firstName = reqString(formData, "firstName");
  const lastName = reqString(formData, "lastName");
  const position = reqString(formData, "position") || null;
  const role = parseRole(reqString(formData, "role"));
  const password = reqString(formData, "password");
  if (!email || !firstName || !lastName) throw new Error("Заполните обязательные поля");
  await prisma.user.update({
    where: { id: userId },
    data: {
      email,
      firstName,
      lastName,
      position,
      role,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    },
  });
  revalidatePath("/admin/users");
  revalidatePath("/team");
  revalidatePath(`/team/${userId}`);
  redirect("/admin/users");
}
