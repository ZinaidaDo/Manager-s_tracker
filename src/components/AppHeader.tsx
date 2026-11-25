"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  PROJECT_MANAGER: "Руководитель",
  EMPLOYEE: "Сотрудник",
};

type User = { firstName: string; lastName: string; role: string };

export function AppHeader({ user, unread }: { user: User; unread: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const nav = [
    { href: "/", label: "Главная" },
    { href: "/my-tasks", label: "Мои задачи" },
    { href: "/projects", label: "Проекты" },
    { href: "/team", label: "Команда" },
    ...(user.role === "ADMIN" ? [{ href: "/admin/users", label: "Пользователи" }] : []),
  ];

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2" aria-label="Nord Flow — на главную">
              <Image src="/brand/logoicon.png" alt="" width={64} height={64} className="h-8 w-8 object-contain dark:hidden" priority />
              <Image src="/brand/logoicon-light.png" alt="" width={64} height={64} className="hidden h-8 w-8 object-contain dark:block" priority />
              <Image src="/brand/logomain.png" alt="Nord Flow" width={1024} height={1024} className="h-8 w-auto object-contain dark:hidden" priority />
              <Image src="/brand/logomain-light.png" alt="Nord Flow" width={1024} height={1024} className="hidden h-8 w-auto object-contain dark:block" priority />
            </Link>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <Link href="/notifications" className="relative rounded-md border border-slate-300 px-2.5 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Уведомления">
              🔔{unread > 0 ? <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{unread}</span> : null}
            </Link>
            <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" aria-expanded={open} aria-controls="mobile-menu">
              {open ? "Закрыть" : "Меню"}
            </button>
          </div>
          <div className="hidden flex-1 items-center justify-between gap-4 lg:flex">
            <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className={`hover:text-slate-900 dark:hover:text-white ${pathname === item.href ? "font-medium text-slate-900 dark:text-white" : ""}`}>{item.label}</Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <form action="/search" method="GET">
                <input name="q" placeholder="Поиск..." className="w-48 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
              </form>
              <Link href="/notifications" className="relative rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                Уведомления
                {unread > 0 ? <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{unread}</span> : null}
              </Link>
              <Link href="/profile" className="text-sm hover:text-slate-900 dark:hover:text-white">
                <span className="font-medium text-slate-900 dark:text-slate-100">{user.firstName} {user.lastName}</span>
                <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">{ROLE_LABELS[user.role] ?? user.role}</span>
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Выйти</button>
              </form>
            </div>
          </div>
        </div>

        {open ? (
          <div id="mobile-menu" className="mt-3 space-y-3 border-t border-slate-200 pt-3 lg:hidden dark:border-slate-800">
            <form action="/search" method="GET">
              <input name="q" placeholder="Поиск по проектам, задачам, людям..." className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
            </form>
            <nav className="grid gap-1 text-sm">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`rounded-md px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 ${pathname === item.href ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-white" : "text-slate-700 dark:text-slate-200"}`}>{item.label}</Link>
              ))}
              <Link href="/notifications" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">Уведомления {unread > 0 ? `(${unread})` : ""}</Link>
              <Link href="/profile" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">Профиль — {user.firstName} {user.lastName}</Link>
            </nav>
            <form action={logoutAction}>
              <button type="submit" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Выйти</button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
