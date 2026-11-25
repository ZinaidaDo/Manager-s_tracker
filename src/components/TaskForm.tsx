import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, type TaskStatus } from "@/lib/constants";
import { formatDateInput } from "@/lib/format";

type UserOpt = { id: string; firstName: string; lastName: string };
type TaskFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  users: UserOpt[];
  defaultStatus?: TaskStatus | string;
  task?: {
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    tags: string | null;
    assigneeId: string | null;
  };
};

export function TaskForm({ action, submitLabel, users, task, defaultStatus }: TaskFormProps) {
  return (
    <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Название *</span>
        <input name="title" required defaultValue={task?.title ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Описание</span>
        <textarea name="description" rows={5} defaultValue={task?.description ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Статус *</span>
          <select name="status" required defaultValue={task?.status ?? defaultStatus ?? "BACKLOG"} className="w-full rounded-md border border-slate-300 px-3 py-2">
            {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Приоритет *</span>
          <select name="priority" required defaultValue={task?.priority ?? "MEDIUM"} className="w-full rounded-md border border-slate-300 px-3 py-2">
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Срок</span>
          <input type="date" name="dueDate" defaultValue={formatDateInput(task?.dueDate)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Исполнитель</span>
          <select name="assigneeId" defaultValue={task?.assigneeId ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="">Не назначен</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Теги (через запятую)</span>
        <input name="tags" defaultValue={task?.tags ?? ""} placeholder="ui, api" className="w-full rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">{submitLabel}</button>
      </div>
    </form>
  );
}
