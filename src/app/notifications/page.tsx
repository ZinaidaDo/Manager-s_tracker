import Link from "next/link";
import { getNotificationsForUser } from "@/lib/data";
import { formatDateRu } from "@/lib/format";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";

const TYPE_LABELS: Record<string, string> = {
  TASK_ASSIGNED: "Назначение",
  TASK_DEADLINE_CHANGED: "Срок изменён",
  TASK_STATUS_CHANGED: "Статус изменён",
  TASK_COMMENTED: "Комментарий",
  TASK_DEADLINE_SOON: "Скоро срок",
  TASK_OVERDUE: "Просрочено",
};

export default async function NotificationsPage() {
  const notifications = await getNotificationsForUser();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Уведомления</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">События по вашим задачам и проектам. Непрочитанных: {unread}.</p>
        </div>
        {unread > 0 ? (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Отметить все прочитанными</button>
          </form>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {notifications.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Уведомлений пока нет.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((n) => (
              <li key={n.id} className={`flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between ${n.read ? "" : "bg-slate-50/70 dark:bg-slate-800/30"}`}>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded px-2 py-0.5 font-medium ${n.read ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"}`}>
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                    <span className="text-slate-500">{formatDateRu(n.createdAt)}</span>
                    {!n.read ? <span className="text-blue-700 dark:text-blue-300">Новое</span> : null}
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-100">{n.message}</p>
                  {n.task ? (
                    <Link href={`/projects/${n.task.projectId}/tasks/${n.task.id}`} className="mt-1 inline-block text-sm text-slate-700 underline hover:text-slate-900 dark:text-slate-300">
                      Открыть задачу {n.task.key}
                    </Link>
                  ) : null}
                </div>
                {!n.read ? (
                  <form action={markNotificationRead.bind(null, n.id)} className="shrink-0">
                    <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Прочитано</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
