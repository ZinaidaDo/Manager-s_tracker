import { TasksView } from "@/components/TasksView";

type TaskItem = {
  id: string;
  projectId: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  tags: string | null;
  assigneeId: string | null;
  description: string | null;
};

export function ProjectTasksView({
  projectId,
  tasks,
  searchParams,
  viewerId,
  viewerRole,
  projectLeadId,
  projectMemberIds,
}: {
  projectId: string;
  tasks: TaskItem[];
  searchParams: Record<string, string | string[] | undefined>;
  viewerId: string;
  viewerRole: string;
  projectLeadId: string | null;
  projectMemberIds: string[];
}) {
  const projectCtxById = {
    [projectId]: { leadId: projectLeadId, members: projectMemberIds.map((id) => ({ userId: id })) },
  };
  return (
    <TasksView
      tasks={tasks.map((t) => ({ ...t, projectId }))}
      searchParams={searchParams}
      viewerId={viewerId}
      viewerRole={viewerRole}
      projectCtxById={projectCtxById}
    />
  );
}
