"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  requirePassword?: boolean;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
    position: string | null;
    role: string;
  };
};

const ROLES = [
  { value: "ADMIN", label: "Администратор" },
  { value: "PROJECT_MANAGER", label: "Руководитель проекта" },
  { value: "EMPLOYEE", label: "Сотрудник" },
];

export function UserForm({ action, submitLabel, user, requirePassword }: Props) {
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Фамилия *</span>
          <input name="lastName" required defaultValue={user?.lastName ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Имя *</span>
          <input name="firstName" required defaultValue={user?.firstName ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email *</span>
          <input name="email" type="email" required defaultValue={user?.email ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Должность</span>
          <input name="position" defaultValue={user?.position ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Роль *</span>
          <select name="role" defaultValue={user?.role ?? "EMPLOYEE"} className="w-full rounded-md border border-slate-300 px-3 py-2">
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Пароль {requirePassword ? "*" : "(оставьте пустым, чтобы не менять)"}</span>
          <div className="flex gap-2">
            <input
              name="password"
              type={show ? "text" : "password"}
              required={!!requirePassword}
              minLength={6}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShow((v) => !v)} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              {show ? "Скрыть" : "Показать"}
            </button>
          </div>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">{submitLabel}</button>
        <Link href="/admin/users" className="text-sm text-slate-600 hover:text-slate-900">Отмена</Link>
      </div>
    </form>
  );
}
