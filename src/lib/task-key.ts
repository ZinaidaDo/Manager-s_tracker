import { prisma } from "@/lib/prisma";

export async function generateTaskKey(_projectId: string) {
  void _projectId;
  const count = await prisma.task.count();
  for (let i = count + 1; i < count + 200; i++) {
    const key = `NDF-${i}`;
    const exists = await prisma.task.findUnique({ where: { key } });
    if (!exists) return key;
  }
  return `NDF-${Date.now()}`;
}
