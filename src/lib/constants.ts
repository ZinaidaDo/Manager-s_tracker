export const PROJECT_STATUSES = ["PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: "Планируется",
  ACTIVE: "Активный",
  PAUSED: "На паузе",
  COMPLETED: "Завершён",
  ARCHIVED: "В архиве",
};

export const TASK_STATUSES = ["BACKLOG", "PLANNED", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: "Бэклог",
  PLANNED: "Запланировано",
  IN_PROGRESS: "В работе",
  IN_REVIEW: "На проверке",
  DONE: "Готово",
};

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
  CRITICAL: "Критический",
};
