import type { Role } from "@prisma/client";

export function isAdmin(role: Role | string) {
  return role === "ADMIN";
}

export function isManager(role: Role | string) {
  return role === "PROJECT_MANAGER";
}

export function canManageUsers(role: Role | string) {
  return role === "ADMIN";
}

export function canCreateProjects(role: Role | string) {
  return role === "ADMIN";
}

export function canEditAnyProject(role: Role | string) {
  return role === "ADMIN";
}

export function canAccessProject(
  role: Role | string,
  userId: string,
  project: { leadId: string | null; members: { userId: string }[] }
) {
  if (role === "ADMIN") return true;
  if (project.leadId === userId) return true;
  return project.members.some((m) => m.userId === userId);
}

export function canManageProject(
  role: Role | string,
  userId: string,
  project: { leadId: string | null }
) {
  if (role === "ADMIN") return true;
  if (role === "PROJECT_MANAGER" && project.leadId === userId) return true;
  return false;
}

export function canCreateTaskInProject(
  role: Role | string,
  userId: string,
  project: { leadId: string | null; members: { userId: string }[] }
) {
  if (role === "ADMIN") return true;
  if (role === "PROJECT_MANAGER" && (project.leadId === userId || project.members.some((m) => m.userId === userId))) return true;
  return false;
}

export function canEditTask(
  role: Role | string,
  userId: string,
  task: { assigneeId: string | null; creatorId: string | null },
  project: { leadId: string | null; members: { userId: string }[] }
) {
  if (role === "ADMIN") return true;
  if (role === "PROJECT_MANAGER" && (project.leadId === userId || project.members.some((m) => m.userId === userId))) return true;
  return false;
}

export function canChangeTaskStatus(
  role: Role | string,
  userId: string,
  task: { assigneeId: string | null },
  project: { leadId: string | null; members: { userId: string }[] }
) {
  if (role === "ADMIN") return true;
  if (role === "PROJECT_MANAGER" && (project.leadId === userId || project.members.some((m) => m.userId === userId))) return true;
  if (role === "EMPLOYEE" && task.assigneeId === userId) return true;
  return false;
}
