import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/ProjectForm";
import { getProjectWithTasksForUser, getUsers } from "@/lib/data";
import { updateProject } from "@/app/actions/mutations";
import { requireCurrentUser } from "@/lib/current-user";
import { canManageProject } from "@/lib/rbac";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, project] = await Promise.all([requireCurrentUser(), getProjectWithTasksForUser(id)]);
  if (!project) notFound();
  if (!canManageProject(user.role, user.id, project)) notFound();
  const users = user.role === "ADMIN" ? await getUsers() : [];
  return (
    <main className="space-y-4">
      <div>
        <Link href={`/projects/${project.id}`} className="text-sm text-slate-600 hover:text-slate-900">← К проекту</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Редактирование проекта</h1>
      </div>
      <ProjectForm
        action={updateProject.bind(null, project.id)}
        submitLabel="Сохранить"
        project={project}
        users={users}
        canEditLead={user.role === "ADMIN"}
      />
    </main>
  );
}
