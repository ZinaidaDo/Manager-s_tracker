import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamUserProfile } from "@/lib/data";
import { requireCurrentUser } from "@/lib/current-user";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";
import { formatDateRu } from "@/lib/format";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  PROJECT_MANAGER: "Руководитель проекта",
  EMPLOYEE: "Сотрудник",
};

export default async function TeamUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCurrentUser();
  const { id } = await params;
  const user = await getTeamUserProfile(id);
  if (!user) notFound();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <main className="space-y-4">
      <div>
        <Link href="/team" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400">← Команда</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{user.lastName} {user.firstName}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{ROLE_LABELS[user.role] ?? user.role}{user.position ? ` · ${user.position}` : ""}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm dark:border-slate-800 dark:bg-slate-900 h-fit">
          <div><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</div><div>{user.email}</div></div>
          <div><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Всего задач (назначено)</div><div>{user._count.assignedTasks}</div></div>
          <div><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Активных сейчас</div><div>{user.assignedTasks.length}</div></div>
          {user.ledProjects.length > 0 ? (
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Руководит проектами</div>
              <ul className="space-y-1">{user.ledProjects.map((p) => <li key={p.id}><Link href={`/projects/${p.id}`} className="hover:underline">{p.name}</Link></li>)}</ul>
            </div>
          ) : null}
          {user.memberships.length > 0 ? (
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Участник проектов</div>
              <ul className="space-y-1">{user.memberships.map((m) => <li key={m.id}><Link href={`/projects/${m.project.id}`} className="hover:underline">{m.project.name}</Link></li>)}</ul>
            </div>
          ) : null}
        </aside>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Активные задачи</h2>
          {user.assignedTasks.length === 0 ? (
            <p className="text-sm text-slate-500">Нет активных задач.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-2 py-1 font-medium">Задача</th>
                    <th className="px-2 py-1 font-medium">Проект</th>
                    <th className="px-2 py-1 font-medium">Статус</th>
                    <th className="px-2 py-1 font-medium">Приоритет</th>
                    <th className="px-2 py-1 font-medium">Срок</th>
                  </tr>
                </thead>
                <tbody>
                  {user.assignedTasks.map((t) => {
                    const overdue = t.dueDate && t.status !== "DONE" && t.dueDate < today;
                    return (
                      <tr key={t.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-2 py-2"><Link href={`/projects/${t.projectId}/tasks/${t.id}`} className="font-medium hover:underline">{t.key}</Link> {t.title}</td>
                        <td className="px-2 py-2"><Link href={`/projects/${t.projectId}`} className="text-slate-600 hover:underline dark:text-slate-400">{t.project.name}</Link></td>
                        <td className="px-2 py-2">{TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}</td>
                        <td className="px-2 py-2">{TASK_PRIORITY_LABELS[t.priority as keyof typeof TASK_PRIORITY_LABELS] ?? t.priority}</td>
                        <td className={`px-2 py-2 whitespace-nowrap ${overdue ? "font-medium text-red-700" : ""}`}>{formatDateRu(t.dueDate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
