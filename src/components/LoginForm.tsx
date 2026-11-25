"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="admin@nordflow.local"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Пароль</span>
        <div className="flex gap-2">
          <input
            name="password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            aria-label={show ? "Скрыть пароль" : "Показать пароль"}
          >
            {show ? "Скрыть" : "Показать"}
          </button>
        </div>
      </label>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Вход..." : "Войти"}
      </button>
    </form>
  );
}
