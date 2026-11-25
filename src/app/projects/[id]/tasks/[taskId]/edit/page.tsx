import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/TaskForm";
import { getProjectMembers, getTaskForUser } from "@/lib/data";
import { updateTask } from "@/app/actions/mutations";
import { requireCurrentUser } from "@/lib/current-user";
import { canEditTask } from "@/lib/rbac";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  const [user, task] = await Promise.all([requireCurrentUser(), getTaskForUser(taskId)]);
  if (!task || task.projectId !== id) notFound();
  if (!canEditTask(user.role, user.id, task, task.project)) notFound();
  const members = await getProjectMembers(task.projectId);
  const users = members.map((m) => m.user);
  return (
    <main className="space-y-4">
      <div>
        <Link href={`/projects/${id}/tasks/${task.id}`} className="text-sm text-slate-600 hover:text-slate-900">← К задаче</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Редактирование задачи</h1>
        <p className="text-sm text-slate-600">{task.key} · {task.project.name}</p>
      </div>
      <TaskForm action={updateTask.bind(null, task.id)} submitLabel="Сохранить" users={users} task={task} />
    </main>
  );
}
