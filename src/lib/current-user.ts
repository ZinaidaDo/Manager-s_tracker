import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  return getSessionUser();
}

export async function requireCurrentUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdminUser() {
  const user = await requireCurrentUser();
  if (user.role !== "ADMIN") redirect("/projects");
  return user;
}

export async function getCurrentUserWithMemberships() {
  const user = await requireCurrentUser();
  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: { memberships: { select: { projectId: true } }, ledProjects: { select: { id: true } } },
  });
}
