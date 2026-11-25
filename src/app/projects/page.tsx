import Link from "next/link";
import { getProjectsForUser } from "@/lib/data";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import { requireCurrentUser } from "@/lib/current-user";

export default async function ProjectsPage() {
  const [user, projects] = await Promise.all([requireCurrentUser(), getProjectsForUser()]);
  const canCreate = user.role === "ADMIN";
  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Проекты</h1>
          <p className="text-sm text-slate-600">Доступные вам проекты и задачи.</p>
        </div>
        {canCreate ? (
          <Link href="/projects/new" className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Новый проект</Link>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          {canCreate ? (
            <>Проектов пока нет. <Link href="/projects/new" className="font-medium text-slate-900 underline">Создать первый</Link></>
          ) : (
            <>Нет доступных проектов. Обратитесь к администратору или руководителю проекта.</>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-500">{p.code || "Без кода"}</div>
                  <h2 className="font-semibold text-slate-900">{p.name}</h2>
                </div>
                <span className="nf-status-pill rounded-full px-2 py-0.5 text-xs">{PROJECT_STATUS_LABELS[p.status as keyof typeof PROJECT_STATUS_LABELS] ?? p.status}</span>
              </div>
              {p.description ? <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.description}</p> : null}
              <div className="mt-3 text-xs text-slate-500">Задач: {p._count.tasks}</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
