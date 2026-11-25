import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectHeaderForUser, getProjectInfoForUser, getProjectMembersForUser, getProjectTasksForUser } from "@/lib/data";
import { requireCurrentUser } from "@/lib/current-user";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import { formatDateRu } from "@/lib/format";
import { TaskFilters } from "@/components/TaskFilters";
import { TasksView } from "@/components/TasksView";
import { canCreateTaskInProject, canManageProject } from "@/lib/rbac";
import { addProjectMember } from "@/app/actions/mutations";

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`border-b-2 px-3 py-2 text-sm font-medium ${active ? "border-slate-900 text-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"}`}
    >
      {children}
    </Link>
  );
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "board";
  const user = await requireCurrentUser();
  const project = await getProjectHeaderForUser(id, user);
  if (!project) notFound();

  const canEditProject = canManageProject(user.role, user.id, project);
  const canCreateTask = canCreateTaskInProject(user.role, user.id, project);
  const projectCtxById = { [project.id]: { leadId: project.leadId, members: project.members } };
  const tasks = tab === "board" || tab === "list" ? await getProjectTasksForUser(project.id) : [];
  const membersData = tab === "members" ? await getProjectMembersForUser(project.id, user) : null;
  const info = tab === "info" ? await getProjectInfoForUser(project.id) : null;
  if (tab === "members" && !membersData) notFound();
  if (tab === "info" && !info) notFound();

  const base = `/projects/${project.id}`;

  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/projects" className="text-sm text-slate-600 hover:text-slate-900">← Проекты</Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <span className="nf-status-pill rounded-full px-2 py-0.5 text-xs">
              {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] ?? project.status}
            </span>
            {project.code ? <span className="text-xs text-slate-500">{project.code}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateTask ? (
            <Link href={`/projects/${project.id}/tasks/new`} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Новая задача</Link>
          ) : null}
          {canEditProject ? (
            <Link href={`/projects/${project.id}/edit`} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Редактировать</Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        <TabLink href={`${base}?tab=board`} active={tab === "board"}>Доска</TabLink>
        <TabLink href={`${base}?tab=list`} active={tab === "list"}>Список задач</TabLink>
        <TabLink href={`${base}?tab=members`} active={tab === "members"}>Участники</TabLink>
        <TabLink href={`${base}?tab=info`} active={tab === "info"}>Информация</TabLink>
      </div>

      {tab === "board" || tab === "list" ? (
        <div className="space-y-4">
          <TaskFilters />
          <TasksView
            tasks={tasks}
            searchParams={{ ...sp, view: tab === "list" ? "list" : "board" }}
            viewerId={user.id}
            viewerRole={user.role}
            projectCtxById={projectCtxById}
          />
        </div>
      ) : null}

      {tab === "members" && membersData ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Участники проекта</h2>
          {canEditProject ? (
            <form action={addProjectMember.bind(null, project.id)} className="mb-4 flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-end">
              <label className="block flex-1 text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">Добавить участника</span>
                <select name="userId" required defaultValue="" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2" disabled={membersData.availableUsers.length === 0}>
                  <option value="" disabled>{membersData.availableUsers.length === 0 ? "Нет доступных пользователей" : "Выберите пользователя"}</option>
                  {membersData.availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.lastName} {u.firstName} ({u.email})</option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={membersData.availableUsers.length === 0} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">Добавить</button>
            </form>
          ) : null}
          <div className="space-y-2 text-sm">
            {membersData.lead ? (
              <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                <div>
                  <div className="font-medium text-slate-900">{membersData.lead.firstName} {membersData.lead.lastName}</div>
                  <div className="text-xs text-slate-500">{membersData.lead.email}{membersData.lead.position ? ` · ${membersData.lead.position}` : ""}</div>
                </div>
                <span className="rounded bg-slate-900 px-2 py-0.5 text-xs text-white">Руководитель</span>
              </div>
            ) : <p className="text-slate-500">Руководитель не назначен.</p>}
            {membersData.members.filter((m) => m.userId !== membersData.leadId).length === 0 ? (
              <p className="text-slate-500">Других участников пока нет.</p>
            ) : (
              membersData.members.filter((m) => m.userId !== membersData.leadId).map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                  <div>
                    <div className="font-medium text-slate-900">{m.user.firstName} {m.user.lastName}</div>
                    <div className="text-xs text-slate-500">{m.user.email}{m.user.position ? ` · ${m.user.position}` : ""}</div>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">Участник</span>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      {tab === "info" && info ? (
        <section className="grid gap-4 lg:grid-cols-[1fr,320px]">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">Описание</h2>
            {info.description ? <p className="whitespace-pre-wrap text-sm text-slate-700">{info.description}</p> : <p className="text-sm text-slate-500">Описание не заполнено.</p>}
          </div>
          <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm">
            <div><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Статус</div><div>{PROJECT_STATUS_LABELS[info.status as keyof typeof PROJECT_STATUS_LABELS] ?? info.status}</div></div>
            <div><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Код</div><div>{info.code || "—"}</div></div>
            <div><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Период</div><div>{formatDateRu(info.startDate)} — {formatDateRu(info.endDate)}</div></div>
            <div><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Руководитель</div><div>{info.lead ? `${info.lead.firstName} ${info.lead.lastName}` : "—"}</div></div>
            <div><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Задач</div><div>{info._count.tasks}</div></div>
            <div className="border-t border-slate-100 pt-2 text-xs text-slate-500">Создан: {formatDateRu(info.createdAt)}<br />Обновлён: {formatDateRu(info.updatedAt)}</div>
          </aside>
        </section>
      ) : null}
    </main>
  );
}
