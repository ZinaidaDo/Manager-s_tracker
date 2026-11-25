import Link from "next/link";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";
import { formatDateRu } from "@/lib/format";
import { StatusChanger } from "@/components/StatusChanger";
import { KanbanBoard } from "@/components/KanbanBoard";
import { canChangeTaskStatus } from "@/lib/rbac";

type TaskItem = {
  id: string;
  projectId: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  tags: string | null;
  assigneeId: string | null;
  description: string | null;
  projectName?: string;
};

type ProjectCtx = { leadId: string | null; members: { userId: string }[] };

function matches(task: TaskItem, q: string, status: string, priority: string, project: string, overdue: boolean) {
  if (project && task.projectId !== project) return false;
  if (status && task.status !== status) return false;
  if (priority && task.priority !== priority) return false;
  if (q) {
    const hay = `${task.key} ${task.title} ${task.description ?? ""} ${task.tags ?? ""}`.toLowerCase();
    if (!hay.includes(q.toLowerCase())) return false;
  }
  if (overdue) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!task.dueDate || task.status === "DONE" || task.dueDate >= today) return false;
  }
  return true;
}

export function TasksView({
  tasks,
  searchParams,
  viewerId,
  viewerRole,
  projectCtxById,
  showProjectColumn = false,
}: {
  tasks: TaskItem[];
  searchParams: Record<string, string | string[] | undefined>;
  viewerId: string;
  viewerRole: string;
  projectCtxById: Record<string, ProjectCtx>;
  showProjectColumn?: boolean;
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const status = typeof searchParams.status === "string" ? searchParams.status : "";
  const priority = typeof searchParams.priority === "string" ? searchParams.priority : "";
  const project = typeof searchParams.project === "string" ? searchParams.project : "";
  const overdue = searchParams.overdue === "1";
  const view = searchParams.view === "list" ? "list" : "board";
  const filtered = tasks.filter((t) => matches(t, q, status, priority, project, overdue));

  if (view === "list") {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return (
      <div className="space-y-3">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="hidden min-w-full text-sm md:table">
            <thead className="bg-slate-50 text-left text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2 font-medium">Ключ</th>
                <th className="px-3 py-2 font-medium">Название</th>
                {showProjectColumn ? <th className="px-3 py-2 font-medium">Проект</th> : null}
                <th className="px-3 py-2 font-medium">Статус</th>
                <th className="px-3 py-2 font-medium">Приоритет</th>
                <th className="px-3 py-2 font-medium">Срок</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={showProjectColumn ? 6 : 5} className="px-3 py-6 text-center text-slate-500">Задачи не найдены</td></tr>
              ) : (
                filtered.map((t) => {
                  const ctx = projectCtxById[t.projectId];
                  const canStatus = ctx ? canChangeTaskStatus(viewerRole, viewerId, t, ctx) : false;
                  const isOverdue = t.dueDate && t.status !== "DONE" && t.dueDate < today;
                  return (
                    <tr key={t.id} className={`border-t border-slate-100 align-top dark:border-slate-800 ${isOverdue ? "bg-red-50/40 dark:bg-red-950/20" : ""}`}>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{t.key}</td>
                      <td className="px-3 py-2"><Link href={`/projects/${t.projectId}/tasks/${t.id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-100">{t.title}</Link></td>
                      {showProjectColumn ? <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{t.projectName ?? "—"}</td> : null}
                      <td className="px-3 py-2">{canStatus ? <StatusChanger taskId={t.id} status={t.status} /> : <span className="text-xs text-slate-700 dark:text-slate-300">{TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}</span>}</td>
                      <td className="px-3 py-2">{TASK_PRIORITY_LABELS[t.priority as keyof typeof TASK_PRIORITY_LABELS] ?? t.priority}</td>
                      <td className={`whitespace-nowrap px-3 py-2 ${isOverdue ? "font-medium text-red-700 dark:text-red-400" : ""}`}>{formatDateRu(t.dueDate)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">Задачи не найдены</p>
            ) : filtered.map((t) => {
              const ctx = projectCtxById[t.projectId];
              const canStatus = ctx ? canChangeTaskStatus(viewerRole, viewerId, t, ctx) : false;
              const isOverdue = t.dueDate && t.status !== "DONE" && t.dueDate < today;
              return (
                <div key={t.id} className={`space-y-2 p-3 ${isOverdue ? "bg-red-50/40 dark:bg-red-950/20" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/projects/${t.projectId}/tasks/${t.id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-100">{t.title}</Link>
                    <span className="shrink-0 text-xs text-slate-500">{t.key}</span>
                  </div>
                  {showProjectColumn && t.projectName ? <div className="text-xs text-slate-500">{t.projectName}</div> : null}
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">{TASK_PRIORITY_LABELS[t.priority as keyof typeof TASK_PRIORITY_LABELS] ?? t.priority}</span>
                    {t.dueDate ? <span className={`rounded px-1.5 py-0.5 ${isOverdue ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" : "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}`}>до {formatDateRu(t.dueDate)}</span> : null}
                  </div>
                  <div>
                    {canStatus ? <StatusChanger taskId={t.id} status={t.status} /> : <span className="text-xs text-slate-700 dark:text-slate-300">{TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const boardTasks = filtered.map((t) => {
    const ctx = projectCtxById[t.projectId];
    return {
      id: t.id,
      projectId: t.projectId,
      key: t.key,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
      canChangeStatus: ctx ? canChangeTaskStatus(viewerRole, viewerId, t, ctx) : false,
      projectName: t.projectName,
    };
  });
  return <KanbanBoard tasks={boardTasks} />;
}
