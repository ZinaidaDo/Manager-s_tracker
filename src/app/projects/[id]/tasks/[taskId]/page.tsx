import Link from "next/link";
import { notFound } from "next/navigation";
import { getTaskForUser } from "@/lib/data";
import { requireCurrentUser } from "@/lib/current-user";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";
import { formatDateRu } from "@/lib/format";
import { StatusChanger } from "@/components/StatusChanger";
import { canChangeTaskStatus, canEditTask } from "@/lib/rbac";
import { addAttachment, addComment, deleteComment } from "@/app/actions/mutations";

const FIELD_LABELS: Record<string, string> = {
  created: "Создание",
  title: "Название",
  description: "Описание",
  status: "Статус",
  priority: "Приоритет",
  dueDate: "Срок",
  tags: "Теги",
  assigneeId: "Исполнитель",
};

function displayValue(field: string, value: string | null) {
  if (value == null || value === "") return "—";
  if (field === "status") return TASK_STATUS_LABELS[value as keyof typeof TASK_STATUS_LABELS] ?? value;
  if (field === "priority") return TASK_PRIORITY_LABELS[value as keyof typeof TASK_PRIORITY_LABELS] ?? value;
  return value;
}

export default async function TaskPage({ params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  const [user, task] = await Promise.all([requireCurrentUser(), getTaskForUser(taskId)]);
  if (!task || task.projectId !== id) notFound();
  const canEdit = canEditTask(user.role, user.id, task, task.project);
  const canChangeStatus = canChangeTaskStatus(user.role, user.id, task, task.project);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = task.dueDate && task.status !== "DONE" && task.dueDate < today;
  const tags = (task.tags || "").split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`/projects/${id}?tab=list`} className="text-sm text-slate-600 hover:text-slate-900">← К проекту</Link>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-white">{task.key}</span>
            <Link href={`/projects/${id}`} className="hover:underline">{task.project.name}</Link>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{task.title}</h1>
        </div>
        {canEdit ? (
          <Link href={`/projects/${id}/tasks/${task.id}/edit`} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Редактировать
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">Описание</h2>
            {task.description ? (
              <p className="whitespace-pre-wrap text-sm text-slate-700">{task.description}</p>
            ) : (
              <p className="text-sm text-slate-500">Описание не заполнено.</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Вложения</h2>
            {task.attachments.length === 0 ? (
              <p className="mb-3 text-sm text-slate-500">Вложений нет.</p>
            ) : (
              <ul className="mb-3 space-y-1 text-sm">
                {task.attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 rounded border border-slate-100 px-3 py-2">
                    <a href={a.url} target="_blank" rel="noreferrer" className="truncate text-slate-800 underline hover:text-slate-900">{a.name}</a>
                    <span className="whitespace-nowrap text-xs text-slate-500">{formatDateRu(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            {canEdit ? (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <form action={addAttachment.bind(null, task.id)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="block flex-1 text-sm">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Файл</span>
                    <input type="file" name="file" className="w-full text-sm" />
                  </label>
                  <button type="submit" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Прикрепить файл</button>
                </form>
                <form action={addAttachment.bind(null, task.id)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="block flex-1 text-sm">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Ссылка</span>
                    <input name="url" type="url" placeholder="https://..." className="w-full rounded-md border border-slate-300 px-3 py-2" />
                  </label>
                  <label className="block flex-1 text-sm">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Название (необязательно)</span>
                    <input name="name" className="w-full rounded-md border border-slate-300 px-3 py-2" />
                  </label>
                  <button type="submit" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Добавить ссылку</button>
                </form>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Комментарии</h2>
            {task.comments.length === 0 ? (
              <p className="mb-3 text-sm text-slate-500">Комментариев пока нет.</p>
            ) : (
              <ul className="mb-4 space-y-3">
                {task.comments.map((c) => {
                  const canDelete = user.role === "ADMIN" || c.authorId === user.id;
                  return (
                    <li key={c.id} className="rounded-md border border-slate-100 p-3">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="text-sm">
                          <span className="font-medium text-slate-900">{c.author.firstName} {c.author.lastName}</span>
                          <span className="ml-2 text-xs text-slate-500">{formatDateRu(c.createdAt)}</span>
                        </div>
                        {canDelete ? (
                          <form action={deleteComment.bind(null, c.id)}>
                            <button type="submit" className="text-xs text-red-600 hover:underline">Удалить</button>
                          </form>
                        ) : null}
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-slate-700">{c.body}</p>
                    </li>
                  );
                })}
              </ul>
            )}
            <form action={addComment.bind(null, task.id)} className="space-y-2 border-t border-slate-100 pt-3">
              <textarea name="body" required rows={3} placeholder="Написать комментарий..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Отправить</button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">История изменений</h2>
            {task.history.length === 0 ? (
              <p className="text-sm text-slate-500">История пуста.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {task.history.map((h) => (
                  <li key={h.id} className="rounded-md border border-slate-100 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-medium text-slate-800">{FIELD_LABELS[h.field] ?? h.field}</span>
                        {h.field !== "created" ? (
                          <span className="text-slate-600">: {displayValue(h.field, h.oldValue)} → {displayValue(h.field, h.newValue)}</span>
                        ) : (
                          <span className="text-slate-600">: задача создана ({h.newValue})</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {h.actor ? `${h.actor.firstName} ${h.actor.lastName}` : "Система"} · {formatDateRu(h.createdAt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm h-fit">
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Статус</div>
            {canChangeStatus ? (
              <StatusChanger taskId={task.id} status={task.status} />
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS] ?? task.status}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Приоритет</div>
            <div>{TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] ?? task.priority}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Срок</div>
            <div className={overdue ? "font-medium text-red-700" : ""}>
              {formatDateRu(task.dueDate)}{overdue ? " (просрочено)" : ""}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Исполнитель</div>
            <div>{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : "Не назначен"}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Постановщик</div>
            <div>{task.creator ? `${task.creator.firstName} ${task.creator.lastName}` : "—"}</div>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Теги</div>
            {tags.length === 0 ? <div className="text-slate-500">—</div> : (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{tag}</span>)}
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 pt-2 text-xs text-slate-500">
            Создано: {formatDateRu(task.createdAt)}<br />Обновлено: {formatDateRu(task.updatedAt)}
          </div>
        </aside>
      </div>
    </main>
  );
}
