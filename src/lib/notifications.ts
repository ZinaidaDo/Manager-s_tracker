import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  message: string;
  taskId?: string | null;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      message: data.message,
      taskId: data.taskId ?? null,
    },
  });
}

export async function createNotificationsForUsers(
  userIds: string[],
  payload: { type: NotificationType; message: string; taskId?: string | null },
  excludeUserId?: string | null,
) {
  const unique = Array.from(new Set(userIds.filter((id) => id && id !== excludeUserId)));
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      type: payload.type,
      message: payload.message,
      taskId: payload.taskId ?? null,
    })),
  });
}

export async function ensureDeadlineNotificationsForUser(userId: string) {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const inTwoDays = new Date(startToday);
  inTwoDays.setDate(inTwoDays.getDate() + 2);
  inTwoDays.setHours(23, 59, 59, 999);

  const tasks = await prisma.task.findMany({
    where: { assigneeId: userId, status: { not: "DONE" }, dueDate: { not: null, lte: inTwoDays } },
    select: { id: true, key: true, title: true, dueDate: true },
  });
  if (tasks.length === 0) return;

  const existing = await prisma.notification.findMany({
    where: {
      userId,
      taskId: { in: tasks.map((t) => t.id) },
      type: { in: ["TASK_OVERDUE", "TASK_DEADLINE_SOON"] },
      createdAt: { gte: startToday },
    },
    select: { taskId: true, type: true },
  });
  const alreadyCreated = new Set(existing.map((n) => `${n.taskId}:${n.type}`));

  const data = tasks.flatMap((t) => {
    if (!t.dueDate) return [];
    const type: NotificationType = t.dueDate < startToday ? "TASK_OVERDUE" : "TASK_DEADLINE_SOON";
    if (alreadyCreated.has(`${t.id}:${type}`)) return [];
    const prefix = type === "TASK_OVERDUE" ? "Задача просрочена" : "Скоро срок задачи";
    return [{ userId, taskId: t.id, type, message: `${prefix} — ${t.key}: ${t.title}` }];
  });
  if (data.length === 0) return;

  await prisma.notification.createMany({ data });
}

export async function ensureDeadlineNotificationsForAllUsers() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    await ensureDeadlineNotificationsForUser(user.id);
  }
  return users.length;
}
