"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";

function reqString(formData: FormData, name: string) {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

export type ProfileState = { ok?: boolean; error?: string };

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const firstName = reqString(formData, "firstName");
  const lastName = reqString(formData, "lastName");
  const position = reqString(formData, "position") || null;
  const avatarUrl = reqString(formData, "avatarUrl") || null;
  const theme = reqString(formData, "theme") === "dark" ? "dark" : "light";

  if (!firstName || !lastName) return { error: "Имя и фамилия обязательны" };

  let email = user.email;
  let role = user.role;
  if (user.role === "ADMIN") {
    const emailInput = reqString(formData, "email").toLowerCase();
    const roleInput = reqString(formData, "role");
    if (emailInput) email = emailInput;
    if (roleInput === "ADMIN" || roleInput === "PROJECT_MANAGER" || roleInput === "EMPLOYEE") {
      role = roleInput;
    }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { firstName, lastName, position, avatarUrl, theme, email, role },
    });
  } catch {
    return { error: "Не удалось сохранить профиль (возможно, email уже занят)" };
  }
  revalidatePath("/profile");
  revalidatePath("/team");
  revalidatePath("/");
  return { ok: true };
}

export type PasswordState = { ok?: boolean; error?: string };

export async function changePasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireUser();
  const current = reqString(formData, "currentPassword");
  const next = reqString(formData, "newPassword");
  const confirm = reqString(formData, "confirmPassword");
  if (!current || !next) return { error: "Заполните все поля" };
  if (next.length < 6) return { error: "Новый пароль должен быть не короче 6 символов" };
  if (next !== confirm) return { error: "Пароли не совпадают" };
  if (!verifyPassword(current, user.passwordHash)) return { error: "Текущий пароль неверен" };
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(next) } });
  return { ok: true };
}
