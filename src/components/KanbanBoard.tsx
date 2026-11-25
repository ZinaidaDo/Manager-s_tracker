"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_STATUSES } from "@/lib/constants";
import { formatDateRu } from "@/lib/format";
import { updateTaskStatus } from "@/app/actions/mutations";
import { StatusChanger } from "@/components/StatusChanger";

type TaskItem = {
  id: string;
  projectId: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  canChangeStatus?: boolean;
  projectName?: string;
};

export function KanbanBoard({ tasks }: { tasks: TaskItem[] }) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [optimisticTasks, setOptimisticStatus] = useOptimistic(
    tasks,
    (current, update: { id: string; status: string }) =>
      current.map((t) => (t.id === update.id ? { ...t, status: update.status } : t)),
  );
  const [pending, startTransition] = useTransition();

  const grouped = new Map<string, TaskItem[]>();
  for (const s of TASK_STATUSES) grouped.set(s, []);
  for (const t of optimisticTasks) (grouped.get(t.status) ?? grouped.set(t.status, []).get(t.status)!).push(t);

  function onDrop(status: string) {
    if (!draggingId) return;
    const task = optimisticTasks.find((t) => t.id === draggingId);
    setDraggingId(null);
    if (!task || task.status === status) return;
    if (task.canChangeStatus === false) return;
    startTransition(async () => {
      setOptimisticStatus({ id: task.id, status });
      try {
        await updateTaskStatus(task.id, status);
      } catch {
      }
    });
  }


  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      {TASK_STATUSES.map((s) => {
        const items = grouped.get(s) ?? [];
        return (
          <section
            key={s}
            className="rounded-xl border border-slate-200 bg-slate-100/70 p-2 dark:border-slate-700 dark:bg-slate-800/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(s)}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{TASK_STATUS_LABELS[s]}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">{items.length}</span>
            </div>
            <div className="min-h-[60px] space-y-2">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-3 text-center text-xs text-slate-500 dark:border-slate-600 dark:bg-slate-900/40">Перетащите задачу сюда</div>
              ) : items.map((t) => {
                const overdue = t.dueDate && t.dueDate < today && t.status !== "DONE";
                return (
                  <article
                    key={t.id}
                    draggable={t.canChangeStatus !== false}
                    onDragStart={() => { if (t.canChangeStatus !== false) setDraggingId(t.id); }}
                    onDragEnd={() => setDraggingId(null)}
                    className={`rounded-lg border bg-white p-3 shadow-sm dark:bg-slate-900 ${overdue ? "border-red-300 dark:border-red-800" : "border-slate-200 dark:border-slate-700"} ${pending && draggingId === t.id ? "opacity-60" : ""} ${t.canChangeStatus === false ? "" : "cursor-grab active:cursor-grabbing"}`}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <Link href={`/projects/${t.projectId}/tasks/${t.id}`} className="text-sm font-medium text-slate-900 hover:underline dark:text-slate-100">{t.title}</Link>
                    </div>
                    <div className="mb-1 text-xs text-slate-500">{t.key}{t.projectName ? ` · ${t.projectName}` : ""}</div>
                    <div className="mb-2 flex flex-wrap gap-1 text-[11px]">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{TASK_PRIORITY_LABELS[t.priority as keyof typeof TASK_PRIORITY_LABELS] ?? t.priority}</span>
                      {t.dueDate ? <span className={`rounded px-1.5 py-0.5 ${overdue ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" : "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}`}>до {formatDateRu(t.dueDate)}</span> : null}
                    </div>
                    {t.canChangeStatus === false ? (
                      <div className="text-xs text-slate-600 dark:text-slate-300">{TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}</div>
                    ) : (
                      <StatusChanger taskId={t.id} status={t.status} />
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
