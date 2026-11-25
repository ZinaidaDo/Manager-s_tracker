"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { toDateOrNull } from "@/lib/format";
import { generateTaskKey } from "@/lib/task-key";
import { PROJECT_STATUSES, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { canChangeTaskStatus, canCreateProjects, canCreateTaskInProject, canEditAnyProject, canEditTask, canManageProject } from "@/lib/rbac";
import { createNotificationsForUsers } from "@/lib/notifications";

function reqString(formData: FormData, name: string) {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

function parseProjectStatus(v: string) {
  return (PROJECT_STATUSES as readonly string[]).includes(v)
    ? (v as (typeof PROJECT_STATUSES)[number])
    : "PLANNED";
}

function parseTaskStatus(v: string) {
  return (TASK_STATUSES as readonly string[]).includes(v)
    ? (v as (typeof TASK_STATUSES)[number])
    : "BACKLOG";
}

function parseTaskPriority(v: string) {
  return (TASK_PRIORITIES as readonly string[]).includes(v)
    ? (v as (typeof TASK_PRIORITIES)[number])
    : "MEDIUM";
}

async function assertTaskAccessForAction(taskId: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: { select: { userId: true } } } } },
  });
  if (!task) throw new Error("Задача не найдена");
  const p = task.project;
  if (user.role !== "ADMIN" && p.leadId !== user.id && !p.members.some((m) => m.userId === user.id)) {
    throw new Error("Недостаточно прав");
  }
  return { user, task };
}

export async function createProject(formData: FormData) {
  const user = await requireUser();
  if (!canCreateProjects(user.role)) throw new Error("Недостаточно прав");
  const name = reqString(formData, "name");
  if (!name) throw new Error("Название проекта обязательно");
  const description = reqString(formData, "description") || null;
  const status = parseProjectStatus(reqString(formData, "status") || "PLANNED");
  const codeRaw = reqString(formData, "code");
  const code = codeRaw ? codeRaw.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 16) : null;
  const leadIdRaw = reqString(formData, "leadId");
  const leadId = leadIdRaw || null;

  const project = await prisma.project.create({
    data: {
      name,
      description,
      status,
      code: code || null,
      startDate: toDateOrNull(formData.get("startDate")),
      endDate: toDateOrNull(formData.get("endDate")),
      leadId,
      members: {
        create: [
          ...(leadId ? [{ userId: leadId }] : []),
        ],
      },
    },
  });
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const user = await requireUser();
  const existing = await prisma.project.findUnique({ where: { id: projectId }, include: { members: { select: { userId: true } } } });
  if (!existing) throw new Error("Проект не найден");
  if (!canManageProject(user.role, user.id, existing) && !canEditAnyProject(user.role)) throw new Error("Недостаточно прав");
  const name = reqString(formData, "name");
  if (!name) throw new Error("Название проекта обязательно");
  const description = reqString(formData, "description") || null;
  const status = parseProjectStatus(reqString(formData, "status") || "PLANNED");
  const codeRaw = reqString(formData, "code");
  const code = codeRaw ? codeRaw.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 16) : null;
  const leadIdRaw = reqString(formData, "leadId");
  const leadId = canEditAnyProject(user.role) ? (leadIdRaw || null) : existing.leadId;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name,
      description,
      status,
      code: code || null,
      startDate: toDateOrNull(formData.get("startDate")),
      endDate: toDateOrNull(formData.get("endDate")),
      leadId,
    },
  });
  if (leadId) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: leadId } },
      update: {},
      create: { projectId, userId: leadId },
    });
  }
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

function fmtVal(v: unknown) {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

function taskLabel(task: { key: string; title: string }) {
  return `${task.key}: ${task.title}`;
}

export async function createTask(projectId: string, formData: FormData) {
  const user = await requireUser();
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { members: { select: { userId: true } } } });
  if (!project) throw new Error("Проект не найден");
  if (!canCreateTaskInProject(user.role, user.id, project)) throw new Error("Недостаточно прав");
  const title = reqString(formData, "title");
  if (!title) throw new Error("Название задачи обязательно");
  const status = parseTaskStatus(reqString(formData, "status") || "BACKLOG");
  const priority = parseTaskPriority(reqString(formData, "priority") || "MEDIUM");
  const description = reqString(formData, "description") || null;
  const tags = reqString(formData, "tags") || null;
  const assigneeIdRaw = reqString(formData, "assigneeId");
  const assigneeId = assigneeIdRaw || null;
  const key = await generateTaskKey(projectId);
  const dueDate = toDateOrNull(formData.get("dueDate"));

  const task = await prisma.task.create({
    data: {
      key,
      title,
      description,
      status,
      priority,
      tags,
      dueDate,
      projectId,
      creatorId: user.id,
      assigneeId,
      history: {
        create: [
          { field: "created", oldValue: null, newValue: key, actorId: user.id },
        ],
      },
    },
  });
  if (assigneeId && assigneeId !== user.id) {
    await createNotificationsForUsers([assigneeId], { type: "TASK_ASSIGNED", message: `Вам назначена задача ${taskLabel(task)}`, taskId: task.id }, user.id);
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/my-tasks");
  revalidatePath("/");
  redirect(`/projects/${projectId}/tasks/${task.id}`);
}

export async function updateTask(taskId: string, formData: FormData) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: { select: { userId: true } } } } },
  });
  if (!task) throw new Error("Задача не найдена");
  if (!canEditTask(user.role, user.id, task, task.project)) throw new Error("Недостаточно прав");
  const title = reqString(formData, "title");
  if (!title) throw new Error("Название задачи обязательно");
  const status = parseTaskStatus(reqString(formData, "status") || "BACKLOG");
  const priority = parseTaskPriority(reqString(formData, "priority") || "MEDIUM");
  const description = reqString(formData, "description") || null;
  const tags = reqString(formData, "tags") || null;
  const assigneeId = reqString(formData, "assigneeId") || null;
  const dueDate = toDateOrNull(formData.get("dueDate"));

  const changes: { field: string; oldValue: string | null; newValue: string | null; actorId: string }[] = [];
  const cmp = (field: string, oldV: unknown, newV: unknown) => {
    const o = fmtVal(oldV);
    const n = fmtVal(newV);
    if (o !== n) changes.push({ field, oldValue: o, newValue: n, actorId: user.id });
  };
  cmp("title", task.title, title);
  cmp("description", task.description, description);
  cmp("status", task.status, status);
  cmp("priority", task.priority, priority);
  cmp("tags", task.tags, tags);
  cmp("assigneeId", task.assigneeId, assigneeId);
  cmp("dueDate", task.dueDate, dueDate);

  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: { title, description, status, priority, tags, dueDate, assigneeId },
    }),
    ...(changes.length ? [prisma.taskHistory.createMany({ data: changes.map((c) => ({ ...c, taskId })) })] : []),
  ]);

  const label = taskLabel({ key: task.key, title });
  if (task.assigneeId !== assigneeId && assigneeId) {
    await createNotificationsForUsers([assigneeId], { type: "TASK_ASSIGNED", message: `Вам назначена задача ${label}`, taskId }, user.id);
  }
  if (fmtVal(task.dueDate) !== fmtVal(dueDate) && assigneeId) {
    await createNotificationsForUsers([assigneeId], { type: "TASK_DEADLINE_CHANGED", message: `Изменён срок задачи ${label}`, taskId }, user.id);
  }
  if (task.status !== status) {
    const recipients = [task.assigneeId, task.creatorId, task.project.leadId].filter(Boolean) as string[];
    await createNotificationsForUsers(recipients, { type: "TASK_STATUS_CHANGED", message: `Изменён статус задачи ${label}`, taskId }, user.id);
  }

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
  revalidatePath("/my-tasks");
  revalidatePath("/");
  revalidatePath("/notifications");
  redirect(`/projects/${task.projectId}/tasks/${taskId}`);
}

export async function updateTaskStatus(taskId: string, status: string) {
  const user = await requireUser();
  if (!(TASK_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Некорректный статус задачи");
  }
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: { select: { userId: true } } } } },
  });
  if (!task) throw new Error("Задача не найдена");
  if (!canChangeTaskStatus(user.role, user.id, task, task.project)) throw new Error("Недостаточно прав");
  if (task.status !== status) {
    await prisma.$transaction([
      prisma.task.update({ where: { id: taskId }, data: { status: status as (typeof TASK_STATUSES)[number] } }),
      prisma.taskHistory.create({
        data: { taskId, field: "status", oldValue: task.status, newValue: status, actorId: user.id },
      }),
    ]);
    const recipients = [task.assigneeId, task.creatorId, task.project.leadId].filter(Boolean) as string[];
    await createNotificationsForUsers(recipients, { type: "TASK_STATUS_CHANGED", message: `Изменён статус задачи ${taskLabel(task)}`, taskId }, user.id);
  }
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
  revalidatePath("/my-tasks");
  revalidatePath("/");
  revalidatePath("/notifications");
}

export async function addComment(taskId: string, formData: FormData) {
  const { user, task } = await assertTaskAccessForAction(taskId);
  const body = reqString(formData, "body");
  if (!body) return;
  await prisma.comment.create({ data: { taskId, authorId: user.id, body } });
  const recipients = [task.assigneeId, task.creatorId, task.project.leadId].filter(Boolean) as string[];
  await createNotificationsForUsers(recipients, { type: "TASK_COMMENTED", message: `Новый комментарий в задаче ${taskLabel(task)}`, taskId }, user.id);
  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
  revalidatePath("/");
  revalidatePath("/notifications");
}

export async function deleteComment(commentId: string) {
  const user = await requireUser();
  const comment = await prisma.comment.findUnique({ where: { id: commentId }, include: { task: { include: { project: { include: { members: { select: { userId: true } } } } } } } });
  if (!comment) throw new Error("Комментарий не найден");
  const p = comment.task.project;
  if (user.role !== "ADMIN" && p.leadId !== user.id && !p.members.some((m) => m.userId === user.id)) {
    throw new Error("Недостаточно прав");
  }
  if (user.role !== "ADMIN" && comment.authorId !== user.id) throw new Error("Недостаточно прав");
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/projects/${comment.task.projectId}/tasks/${comment.taskId}`);
}

export async function addAttachment(taskId: string, formData: FormData) {
  const { user, task } = await assertTaskAccessForAction(taskId);
  if (!canEditTask(user.role, user.id, task, task.project)) throw new Error("Недостаточно прав");
  const urlField = reqString(formData, "url");
  const nameField = reqString(formData, "name");
  const file = formData.get("file");

  if (file && file instanceof File && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const dir = path.join(process.cwd(), "public", "uploads", taskId);
    await mkdir(dir, { recursive: true });
    const filename = `${Date.now()}-${safeName}`;
    await writeFile(path.join(dir, filename), bytes);
    const url = `/uploads/${taskId}/${filename}`;
    await prisma.attachment.create({ data: { taskId, name: file.name, url, type: file.type || "file" } });
  } else if (urlField) {
    await prisma.attachment.create({ data: { taskId, name: nameField || urlField, url: urlField, type: "link" } });
  }
  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
}

export async function addProjectMember(projectId: string, formData: FormData) {
  const user = await requireUser();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { select: { userId: true } } },
  });
  if (!project) throw new Error("Проект не найден");
  if (!canManageProject(user.role, user.id, project)) throw new Error("Недостаточно прав");
  const memberId = reqString(formData, "userId");
  if (!memberId) return;
  if (project.members.some((m) => m.userId === memberId)) {
    revalidatePath(`/projects/${projectId}`);
    return;
  }
  const target = await prisma.user.findUnique({ where: { id: memberId }, select: { id: true } });
  if (!target) throw new Error("Пользователь не найден");
  await prisma.projectMember.create({ data: { projectId, userId: memberId } });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/team");
}
