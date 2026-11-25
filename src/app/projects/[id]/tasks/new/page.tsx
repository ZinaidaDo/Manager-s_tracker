import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/TaskForm";
import { createTask } from "@/app/actions/mutations";
import { getProjectWithTasksForUser } from "@/lib/data";
import { requireCurrentUser } from "@/lib/current-user";
import { canCreateTaskInProject } from "@/lib/rbac";

export default async function NewTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [user, project] = await Promise.all([requireCurrentUser(), getProjectWithTasksForUser(id)]);
  if (!project) notFound();
  if (!canCreateTaskInProject(user.role, user.id, project)) notFound();
  const members = project.members.map((m) => m.user);
  const defaultStatus = typeof sp.status === "string" ? sp.status : "BACKLOG";
  return (
    <main className="space-y-4">
      <div>
        <Link href={`/projects/${project.id}`} className="text-sm text-slate-600 hover:text-slate-900">← К проекту</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Новая задача</h1>
        <p className="text-sm text-slate-600">{project.name}</p>
      </div>
      <TaskForm
        action={createTask.bind(null, project.id)}
        submitLabel="Создать задачу"
        users={members}
        defaultStatus={defaultStatus}
      />
    </main>
  );
}
