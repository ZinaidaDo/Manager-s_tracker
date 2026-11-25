"use client";

import { useOptimistic, useTransition } from "react";
import { TASK_STATUS_LABELS, TASK_STATUSES } from "@/lib/constants";
import { updateTaskStatus } from "@/app/actions/mutations";

export function StatusChanger({ taskId, status }: { taskId: string; status: string }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status, (_current, next: string) => next);
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label="Сменить статус"
      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs sm:w-auto"
      value={optimisticStatus}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          setOptimisticStatus(next);
          try {
            await updateTaskStatus(taskId, next);
          } catch {
          }
        });
      }}
    >
      {TASK_STATUSES.map((s) => (
        <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}
