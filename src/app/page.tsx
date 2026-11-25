import Link from "next/link";
import { requireCurrentUser } from "@/lib/current-user";
import { getDashboardDataForUser } from "@/lib/data";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";
import { formatDateRu } from "@/lib/format";

export default async function HomePage() {
  const user = await requireCurrentUser();
  const data = await getDashboardDataForUser();
  const today = new Date(); today.setHours(0,0,0,0);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Главная</h1>
        <p className="text-sm text-slate-600">Обзор вашей работы и проектов, {user.firstName}.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Активные задачи</div>
          <div className="mt-1 text-2xl font-semibold">{data.myActiveTasks}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Выполнено</div>
          <div className="mt-1 text-2xl font-semibold">{data.myDoneTasks}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">На этой неделе</div>
          <div className="mt-1 text-2xl font-semibold">{data.myWeekTasks.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Просрочено</div>
          <div className="mt-1 text-2xl font-semibold text-red-700">{data.myOverdueTasks}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Ближайшие дедлайны</h2>
            <Link href="/my-tasks" className="text-xs text-slate-600 hover:text-slate-900">Все мои задачи →</Link>
          </div>
          {data.myWeekTasks.length === 0 ? (
            <p className="text-sm text-slate-500">Нет задач с дедлайном на ближайшие 7 дней.</p>
          ) : (
            <ul className="space-y-2">
              {data.myWeekTasks.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-100 p-2 text-sm">
                  <div>
                    <Link href={`/projects/${t.projectId}/tasks/${t.id}`} className="font-medium text-slate-900 hover:underline">{t.title}</Link>
                    <div className="text-xs text-slate-500">{t.key} · {t.project.name}</div>
                  </div>
                  <div className="whitespace-nowrap text-xs text-slate-700">{formatDateRu(t.dueDate)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Мои проекты</h2>
            <Link href="/projects" className="text-xs text-slate-600 hover:text-slate-900">Все проекты →</Link>
          </div>
          {data.myProjects.length === 0 ? (
            <p className="text-sm text-slate-500">Нет доступных проектов.</p>
          ) : (
            <ul className="space-y-2">
              {data.myProjects.map((p) => (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className="flex items-center justify-between rounded-md border border-slate-100 p-2 text-sm hover:bg-slate-50">
                    <div>
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.code || "Без кода"}{p.lead ? ` · ${p.lead.firstName} ${p.lead.lastName}` : ""}</div>
                    </div>
                    <div className="text-xs text-slate-600">Задач: {p._count.tasks}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Последние обновления задач</h2>
        {data.recentTasks.length === 0 ? (
          <p className="text-sm text-slate-500">Пока нет задач.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-600">
                <tr>
                  <th className="px-2 py-1 font-medium">Задача</th>
                  <th className="px-2 py-1 font-medium">Проект</th>
                  <th className="px-2 py-1 font-medium">Статус</th>
                  <th className="px-2 py-1 font-medium">Приоритет</th>
                  <th className="px-2 py-1 font-medium">Срок</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTasks.map((t) => {
                  const overdue = t.dueDate && t.status !== "DONE" && t.dueDate < today;
                  return (
                    <tr key={t.id} className="border-t border-slate-100">
                      <td className="px-2 py-2"><Link href={`/projects/${t.projectId}/tasks/${t.id}`} className="font-medium text-slate-900 hover:underline">{t.key}</Link> <span className="text-slate-700">{t.title}</span></td>
                      <td className="px-2 py-2 text-slate-600">{t.project.name}</td>
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
    </main>
  );
}
