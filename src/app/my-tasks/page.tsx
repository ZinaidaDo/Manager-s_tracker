import { requireCurrentUser } from "@/lib/current-user";
import { getMyTasksForUser } from "@/lib/data";
import { TaskFilters } from "@/components/TaskFilters";
import { TasksView } from "@/components/TasksView";

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const [user, tasks] = await Promise.all([requireCurrentUser(), getMyTasksForUser()]);

  const projectMap = new Map<string, { id: string; name: string; leadId: string | null; members: { userId: string }[] }>();
  for (const t of tasks) projectMap.set(t.project.id, { id: t.project.id, name: t.project.name, leadId: t.project.leadId, members: t.project.members });
  const projects = Array.from(projectMap.values());
  const projectCtxById: Record<string, { leadId: string | null; members: { userId: string }[] }> = {};
  for (const p of projects) projectCtxById[p.id] = { leadId: p.leadId, members: p.members };

  const mapped = tasks.map((t) => ({ ...t, projectId: t.projectId, projectName: t.project.name }));

  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Мои задачи</h1>
        <p className="text-sm text-slate-600">Задачи, назначенные вам. Просроченные выделены.</p>
      </div>
      <TaskFilters showProject projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
      <TasksView
        tasks={mapped}
        searchParams={sp}
        viewerId={user.id}
        viewerRole={user.role}
        projectCtxById={projectCtxById}
        showProjectColumn
      />
    </main>
  );
}
