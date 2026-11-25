import Link from "next/link";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/constants";
import { formatDateInput } from "@/lib/format";

type UserOpt = { id: string; firstName: string; lastName: string; email?: string };
type ProjectFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  users?: UserOpt[];
  canEditLead?: boolean;
  project?: {
    name: string;
    code: string | null;
    description: string | null;
    status: ProjectStatus | string;
    startDate: Date | null;
    endDate: Date | null;
    leadId?: string | null;
  };
};

export function ProjectForm({ action, submitLabel, project, users = [], canEditLead = false }: ProjectFormProps) {
  return (
    <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Название *</span>
          <input name="name" required defaultValue={project?.name ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Код</span>
          <input name="code" defaultValue={project?.code ?? ""} placeholder="NDF" className="w-full rounded-md border border-slate-300 px-3 py-2 uppercase" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Описание</span>
        <textarea name="description" rows={4} defaultValue={project?.description ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Статус</span>
          <select name="status" defaultValue={(project?.status as string) ?? "PLANNED"} className="w-full rounded-md border border-slate-300 px-3 py-2">
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        {canEditLead ? (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Руководитель</span>
            <select name="leadId" defaultValue={project?.leadId ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="">Не назначен</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Дата начала</span>
          <input type="date" name="startDate" defaultValue={formatDateInput(project?.startDate)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Дата окончания</span>
          <input type="date" name="endDate" defaultValue={formatDateInput(project?.endDate)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">{submitLabel}</button>
        <Link href="/projects" className="text-sm text-slate-600 hover:text-slate-900">Отмена</Link>
      </div>
    </form>
  );
}
