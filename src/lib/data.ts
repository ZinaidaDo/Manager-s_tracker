import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { canAccessProject, canManageProject } from "@/lib/rbac";

type Viewer = { id: string; role: string };

export async function getProjectsForUser() {
  const user = await requireCurrentUser();
  const where = user.role === "ADMIN"
    ? {}
    : { OR: [{ leadId: user.id }, { members: { some: { userId: user.id } } }] };
  return prisma.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { tasks: true } }, lead: true, members: { select: { userId: true } } },
  });
}

export async function getProjectWithTasksForUser(projectId: string) {
  const user = await requireCurrentUser();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: { orderBy: { updatedAt: "desc" }, include: { assignee: true } },
      _count: { select: { tasks: true } },
      lead: true,
      members: { include: { user: true } },
    },
  });
  if (!project) return null;
  if (user.role !== "ADMIN" && project.leadId !== user.id && !project.members.some((m) => m.userId === user.id)) {
    return null;
  }
  return project;
}

export async function getProjectHeaderForUser(projectId: string, viewer: Viewer) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      status: true,
      code: true,
      leadId: true,
      members: { select: { userId: true } },
    },
  });
  if (!project || !canAccessProject(viewer.role, viewer.id, project)) return null;
  return project;
}

export async function getProjectTasksForUser(projectId: string) {
  return prisma.task.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      projectId: true,
      key: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      tags: true,
      assigneeId: true,
      description: true,
    },
  });
}

export async function getProjectMembersForUser(projectId: string, viewer: Viewer) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      leadId: true,
      lead: { select: { firstName: true, lastName: true, email: true, position: true } },
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          userId: true,
          user: { select: { firstName: true, lastName: true, email: true, position: true } },
        },
      },
    },
  });
  if (!project) return null;
  const availableUsers = canManageProject(viewer.role, viewer.id, project)
    ? await prisma.user.findMany({
        where: { id: { notIn: project.members.map((m) => m.userId) } },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: { id: true, firstName: true, lastName: true, email: true },
      })
    : [];
  return { ...project, availableUsers };
}

export async function getProjectInfoForUser(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      description: true,
      status: true,
      code: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
      lead: { select: { firstName: true, lastName: true } },
      _count: { select: { tasks: true } },
    },
  });
}

export async function getTaskForUser(taskId: string) {
  const user = await requireCurrentUser();
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { include: { members: { include: { user: true } }, lead: true } },
      assignee: true,
      creator: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      history: { include: { actor: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!task) return null;
  const p = task.project;
  if (user.role !== "ADMIN" && p.leadId !== user.id && !p.members.some((m) => m.userId === user.id)) {
    return null;
  }
  return task;
}

export async function getUsers() {
  return prisma.user.findMany({ orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
}

export async function getProjectMembers(projectId: string) {
  return prisma.projectMember.findMany({
    where: { projectId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getMyTasksForUser() {
  const user = await requireCurrentUser();
  return prisma.task.findMany({
    where: { assigneeId: user.id },
    include: { project: { select: { id: true, name: true, code: true, leadId: true, members: { select: { userId: true } } } }, assignee: true },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getDashboardDataForUser() {
  const user = await requireCurrentUser();
  const accessibleProjectWhere = user.role === "ADMIN"
    ? {}
    : { OR: [{ leadId: user.id }, { members: { some: { userId: user.id } } }] };

  const [myProjects, myActiveTasks, myDoneTasks, myWeekTasks, myOverdueTasks, recentTasks] = await Promise.all([
    prisma.project.findMany({
      where: accessibleProjectWhere,
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { _count: { select: { tasks: true } }, lead: true },
    }),
    prisma.task.count({ where: { assigneeId: user.id, status: { not: "DONE" } } }),
    prisma.task.count({ where: { assigneeId: user.id, status: "DONE" } }),
    (async () => {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return prisma.task.findMany({
        where: { assigneeId: user.id, status: { not: "DONE" }, dueDate: { gte: start, lte: end } },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { dueDate: "asc" },
        take: 8,
      });
    })(),
    prisma.task.count({
      where: { assigneeId: user.id, status: { not: "DONE" }, dueDate: { lt: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.task.findMany({
      where: user.role === "ADMIN"
        ? {}
        : { project: { OR: [{ leadId: user.id }, { members: { some: { userId: user.id } } }] } },
      include: { project: { select: { id: true, name: true } }, assignee: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  return { myProjects, myActiveTasks, myDoneTasks, myWeekTasks, myOverdueTasks, recentTasks };
}

export async function getTeamUsers() {
  await requireCurrentUser();
  const users = await prisma.user.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      _count: { select: { assignedTasks: true } },
      assignedTasks: { select: { status: true } },
    },
  });
  return users.map((u) => {
    const active = u.assignedTasks.filter((t) => t.status !== "DONE").length;
    const done = u.assignedTasks.filter((t) => t.status === "DONE").length;
    return { ...u, activeTasks: active, doneTasks: done };
  });
}

export async function getTeamUserProfile(userId: string) {
  await requireCurrentUser();
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      assignedTasks: {
        where: { status: { not: "DONE" } },
        include: { project: { select: { id: true, name: true } } },
        orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      },
      ledProjects: { select: { id: true, name: true, status: true } },
      memberships: { include: { project: { select: { id: true, name: true, status: true } } } },
      _count: { select: { assignedTasks: true } },
    },
  });
}

export async function getNotificationsForUser() {
  const user = await requireCurrentUser();
  return prisma.notification.findMany({
    where: { userId: user.id },
    include: { task: { select: { id: true, key: true, title: true, projectId: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function globalSearch(q: string) {
  const user = await requireCurrentUser();
  const query = q.trim();
  if (!query) return { projects: [], tasks: [], users: [] };
  const accessibleProjectWhere = user.role === "ADMIN"
    ? {}
    : { OR: [{ leadId: user.id }, { members: { some: { userId: user.id } } }] };

  const [projects, tasks, users] = await Promise.all([
    prisma.project.findMany({
      where: {
        AND: [
          accessibleProjectWhere,
          { OR: [
            { name: { contains: query } },
            { code: { contains: query } },
            { description: { contains: query } },
          ] },
        ],
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, code: true, status: true },
    }),
    prisma.task.findMany({
      where: {
        AND: [
          user.role === "ADMIN" ? {} : { project: { OR: [{ leadId: user.id }, { members: { some: { userId: user.id } } }] } },
          { OR: [
            { title: { contains: query } },
            { key: { contains: query } },
            { description: { contains: query } },
            { tags: { contains: query } },
          ] },
        ],
      },
      take: 15,
      orderBy: { updatedAt: "desc" },
      select: { id: true, key: true, title: true, status: true, projectId: true, project: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { email: { contains: query } },
          { position: { contains: query } },
        ],
      },
      take: 10,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, email: true, position: true, role: true },
    }),
  ]);

  return { projects, tasks, users };
}
