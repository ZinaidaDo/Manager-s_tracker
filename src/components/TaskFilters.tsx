"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";

export function TaskFilters({ showProject = false, projects = [] as { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [query, setQuery] = useState(sp.get("q") ?? "");
  const committedQuery = useRef(sp.get("q") ?? "");

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, sp]);

  useEffect(() => {
    const urlQuery = sp.get("q") ?? "";
    if (urlQuery !== committedQuery.current) {
      committedQuery.current = urlQuery;
      setQuery(urlQuery);
    }
  }, [sp]);

  useEffect(() => {
    if (query === committedQuery.current) return;
    const timer = setTimeout(() => {
      committedQuery.current = query;
      setParam("q", query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, setParam]);

  return (
    <div className={`grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 ${showProject ? "lg:grid-cols-6" : "lg:grid-cols-5"}`}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по названию, ключу, описанию"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2 lg:col-span-2"
      />
      {showProject ? (
        <select value={sp.get("project") ?? ""} onChange={(e) => setParam("project", e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Все проекты</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      ) : null}
      <select value={sp.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">Все статусы</option>
        {Object.entries(TASK_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={sp.get("priority") ?? ""} onChange={(e) => setParam("priority", e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">Все приоритеты</option>
        {Object.entries(TASK_PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={sp.get("view") ?? "board"} onChange={(e) => setParam("view", e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="board">Доска</option>
        <option value="list">Список</option>
      </select>
      <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300 sm:col-span-2 lg:col-span-1">
        <input
          type="checkbox"
          checked={sp.get("overdue") === "1"}
          onChange={(e) => setParam("overdue", e.target.checked ? "1" : "")}
        />
        Просроченные
      </label>
    </div>
  );
}
