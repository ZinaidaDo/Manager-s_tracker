import { requireCurrentUser } from "@/lib/current-user";
import { ProfileForm } from "@/components/ProfileForm";
import { PasswordForm } from "@/components/PasswordForm";

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Профиль</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Личные данные, тема интерфейса и безопасность. Email и роль может изменять только администратор.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileForm user={{ firstName: user.firstName, lastName: user.lastName, email: user.email, position: user.position, avatarUrl: user.avatarUrl, theme: user.theme, role: user.role }} />
        <PasswordForm />
      </div>
    </main>
  );
}
