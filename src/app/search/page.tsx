import Link from "next/link";
import { globalSearch } from "@/lib/data";
import { PROJECT_STATUS_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  PROJECT_MANAGER: "Руководитель проекта",
  EMPLOYEE: "Сотрудник",
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const results = await globalSearch(q);
  const hasAny = results.projects.length + results.tasks.length + results.users.length > 0;

  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Поиск</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Результаты по проектам, задачам и сотрудникам.</p>
      </div>

      <form action="/search" method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Введите запрос..."
          className="w-full max-w-xl rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Найти</button>
      </form>

      {!q.trim() ? (
        <p className="text-sm text-slate-500">Введите запрос для поиска.</p>
      ) : !hasAny ? (
        <p className="text-sm text-slate-500">Ничего не найдено по запросу «{q}».</p>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Проекты ({results.projects.length})</h2>
            {results.projects.length === 0 ? <p className="text-sm text-slate-500">Нет совпадений.</p> : (
              <ul className="space-y-2">
                {results.projects.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2 dark:border-slate-800">
                    <div>
                      <Link href={`/projects/${p.id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-100">{p.name}</Link>
                      <div className="text-xs text-slate-500">{p.code || "Без кода"}</div>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">{PROJECT_STATUS_LABELS[p.status as keyof typeof PROJECT_STATUS_LABELS] ?? p.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Задачи ({results.tasks.length})</h2>
            {results.tasks.length === 0 ? <p className="text-sm text-slate-500">Нет совпадений.</p> : (
              <ul className="space-y-2">
                {results.tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2 dark:border-slate-800">
                    <div>
                      <Link href={`/projects/${t.projectId}/tasks/${t.id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-100">{t.key} · {t.title}</Link>
                      <div className="text-xs text-slate-500">{t.project.name}</div>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">{TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Сотрудники ({results.users.length})</h2>
            {results.users.length === 0 ? <p className="text-sm text-slate-500">Нет совпадений.</p> : (
              <ul className="space-y-2">
                {results.users.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2 dark:border-slate-800">
                    <div>
                      <Link href={`/team/${u.id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-100">{u.lastName} {u.firstName}</Link>
                      <div className="text-xs text-slate-500">{u.email}{u.position ? ` · ${u.position}` : ""}</div>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">{ROLE_LABELS[u.role] ?? u.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
