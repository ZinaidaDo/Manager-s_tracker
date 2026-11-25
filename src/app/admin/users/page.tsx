import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  PROJECT_MANAGER: "Руководитель проекта",
  EMPLOYEE: "Сотрудник",
};

export default async function AdminUsersPage() {
  const user = await requireCurrentUser();
  if (user.role !== "ADMIN") notFound();
  const users = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { lastName: "asc" }, { firstName: "asc" }] });
  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Пользователи</h1>
          <p className="text-sm text-slate-600">Управление учётными записями и ролями (только администратор).</p>
        </div>
        <Link href="/admin/users/new" className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Добавить пользователя</Link>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Имя</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Роль</th>
              <th className="px-3 py-2 font-medium">Должность</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{u.lastName} {u.firstName}</td>
                <td className="px-3 py-2 text-slate-700">{u.email}</td>
                <td className="px-3 py-2">{ROLE_LABELS[u.role] ?? u.role}</td>
                <td className="px-3 py-2 text-slate-600">{u.position || "—"}</td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/users/${u.id}/edit`} className="text-slate-700 underline hover:text-slate-900">Редактировать</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
