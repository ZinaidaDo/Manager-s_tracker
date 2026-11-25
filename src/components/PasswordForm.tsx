"use client";

import { useActionState, useState } from "react";
import { changePasswordAction, type PasswordState } from "@/app/actions/profile";

const initial: PasswordState = {};

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Смена пароля</h2>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Текущий пароль</span>
        <input name="currentPassword" type={show ? "text" : "password"} required autoComplete="current-password" className="w-full rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Новый пароль</span>
          <input name="newPassword" type={show ? "text" : "password"} required minLength={6} autoComplete="new-password" className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Подтверждение</span>
          <input name="confirmPassword" type={show ? "text" : "password"} required minLength={6} autoComplete="new-password" className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Показать пароли
      </label>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-700">Пароль изменён.</p> : null}
      <button type="submit" disabled={pending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
        {pending ? "Сохранение..." : "Изменить пароль"}
      </button>
    </form>
  );
}
