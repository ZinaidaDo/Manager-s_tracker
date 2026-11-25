import Link from "next/link";
import { notFound } from "next/navigation";
import { UserForm } from "@/components/UserForm";
import { createUser } from "@/app/actions/users";
import { requireCurrentUser } from "@/lib/current-user";

export default async function NewUserPage() {
  const user = await requireCurrentUser();
  if (user.role !== "ADMIN") notFound();
  return (
    <main className="space-y-4">
      <div>
        <Link href="/admin/users" className="text-sm text-slate-600 hover:text-slate-900">← Пользователи</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Новый пользователь</h1>
      </div>
      <UserForm action={createUser} submitLabel="Создать пользователя" requirePassword />
    </main>
  );
}
