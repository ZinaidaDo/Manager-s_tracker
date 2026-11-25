import Link from "next/link";
import { getTeamUsers } from "@/lib/data";
import { requireCurrentUser } from "@/lib/current-user";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  PROJECT_MANAGER: "Руководитель проекта",
  EMPLOYEE: "Сотрудник",
};

export default async function TeamPage() {
  await requireCurrentUser();
  const users = await getTeamUsers();
  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Команда</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Сотрудники, роли и текущая загрузка.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
            <tr>
              <th className="px-3 py-2 font-medium">Сотрудник</th>
              <th className="px-3 py-2 font-medium">Должность</th>
              <th className="px-3 py-2 font-medium">Роль</th>
              <th className="px-3 py-2 font-medium">Активные задачи</th>
              <th className="px-3 py-2 font-medium">Выполнено</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2">
                  <Link href={`/team/${u.id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-100">{u.lastName} {u.firstName}</Link>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{u.position || "—"}</td>
                <td className="px-3 py-2">{ROLE_LABELS[u.role] ?? u.role}</td>
                <td className="px-3 py-2">{u.activeTasks}</td>
                <td className="px-3 py-2">{u.doneTasks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
