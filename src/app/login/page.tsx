import Image from "next/image";
import { redirect } from "next/navigation";
import { ensureBootstrapAdmin, getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  await ensureBootstrapAdmin();
  const user = await getSessionUser();
  if (user) redirect("/");
  return (
    <main className="flex min-h-[70vh] items-center justify-center">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">
        <div className="nf-hero hidden flex-col justify-between p-10 text-white lg:flex">
          <Image src="/brand/logomain-light.png" alt="Nord Flow" width={1024} height={1024} className="h-10 w-auto object-contain" priority />
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Nord Flow</h2>
            <p className="mt-3 max-w-sm text-sm text-slate-200">
              Проекты, задачи и команда — в едином рабочем пространстве с северным ритмом.
            </p>
          </div>
          <p className="text-xs text-slate-300">Управление задачами и проектами</p>
        </div>
        <div className="p-6 sm:p-10">
          <div className="mb-6">
            <Image src="/brand/logomain.png" alt="Nord Flow" width={1024} height={1024} className="mb-5 h-9 w-auto object-contain lg:hidden" priority />
            <h1 className="text-2xl font-semibold tracking-tight">Вход в Nord Flow</h1>
            <p className="mt-2 text-sm text-slate-600">Используйте учётную запись, созданную администратором.</p>
          </div>
          <LoginForm />
          <p className="mt-4 text-center text-xs text-slate-500">
            Демо-вход: <span className="font-mono">admin@nordflow.local</span> / <span className="font-mono">Admin123!</span>
          </p>
          <p className="mt-1 text-center text-xs text-slate-500">
            После seed: например <span className="font-mono">anna.petrova@nordflow.local</span> / <span className="font-mono">User123!</span>
          </p>
        </div>
      </div>
    </main>
  );
}
