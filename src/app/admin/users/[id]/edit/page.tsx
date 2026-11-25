import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { UserForm } from "@/components/UserForm";
import { updateUser } from "@/app/actions/users";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await requireCurrentUser();
  if (current.role !== "ADMIN") notFound();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();
  return (
    <main className="space-y-4">
      <div>
        <Link href="/admin/users" className="text-sm text-slate-600 hover:text-slate-900">← Пользователи</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Редактирование пользователя</h1>
      </div>
      <UserForm action={updateUser.bind(null, user.id)} submitLabel="Сохранить" user={user} />
    </main>
  );
}
