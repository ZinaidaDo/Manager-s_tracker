import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/ProjectForm";
import { createProject } from "@/app/actions/mutations";
import { requireCurrentUser } from "@/lib/current-user";
import { getUsers } from "@/lib/data";

export default async function NewProjectPage() {
  const user = await requireCurrentUser();
  if (user.role !== "ADMIN") notFound();
  const users = await getUsers();
  return (
    <main className="space-y-4">
      <div>
        <Link href="/projects" className="text-sm text-slate-600 hover:text-slate-900">← Проекты</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Новый проект</h1>
      </div>
      <ProjectForm action={createProject} submitLabel="Создать проект" users={users} canEditLead />
    </main>
  );
}
