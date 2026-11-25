"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileState } from "@/app/actions/profile";

const initial: ProfileState = {};

export function ProfileForm({ user }: { user: { firstName: string; lastName: string; email: string; position: string | null; avatarUrl: string | null; theme: string; role: string } }) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const isAdmin = user.role === "ADMIN";
  return (
    <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Личные данные</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Фамилия *</span>
          <input name="lastName" required defaultValue={user.lastName} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Имя *</span>
          <input name="firstName" required defaultValue={user.firstName} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Должность</span>
          <input name="position" defaultValue={user.position ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Фото (URL)</span>
          <input name="avatarUrl" defaultValue={user.avatarUrl ?? ""} placeholder="https://..." className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email {isAdmin ? "*" : "(только администратор)"}</span>
          <input name="email" type="email" defaultValue={user.email} readOnly={!isAdmin} className={`w-full rounded-md border border-slate-300 px-3 py-2 ${!isAdmin ? "bg-slate-50 text-slate-500" : ""}`} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Роль {isAdmin ? "" : "(только администратор)"}</span>
          {isAdmin ? (
            <select name="role" defaultValue={user.role} className="w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="ADMIN">Администратор</option>
              <option value="PROJECT_MANAGER">Руководитель проекта</option>
              <option value="EMPLOYEE">Сотрудник</option>
            </select>
          ) : (
            <input value={user.role === "ADMIN" ? "Администратор" : user.role === "PROJECT_MANAGER" ? "Руководитель проекта" : "Сотрудник"} readOnly className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-slate-500" />
          )}
        </label>
      </div>
      <label className="block text-sm sm:max-w-xs">
        <span className="mb-1 block font-medium">Тема интерфейса</span>
        <select name="theme" defaultValue={user.theme === "dark" ? "dark" : "light"} className="w-full rounded-md border border-slate-300 px-3 py-2">
          <option value="light">Светлая</option>
          <option value="dark">Тёмная</option>
        </select>
      </label>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-700">Профиль сохранён.</p> : null}
      <button type="submit" disabled={pending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
        {pending ? "Сохранение..." : "Сохранить профиль"}
      </button>
    </form>
  );
}
