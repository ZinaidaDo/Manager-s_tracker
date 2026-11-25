"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, ensureBootstrapAdmin, hashPassword, setSessionCookie, verifyPassword } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  await ensureBootstrapAdmin();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Введите email и пароль" };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    if (user && user.role === "ADMIN" && !user.passwordHash) {
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(password) } });
      await setSessionCookie(user.id);
      redirect("/projects");
    }
    return { error: "Неверный email или пароль" };
  }
  await setSessionCookie(user.id);
  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
