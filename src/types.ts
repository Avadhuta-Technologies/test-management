export const STATUSES = ["Not Run","In Progress","Pass","Fail","Blocked","Skipped","Retest"] as const;
export const SEVERITIES = ["Critical","Major","Minor","Trivial"] as const;
export const PRIORITIES = ["P1 - Urgent","P2 - High","P3 - Medium","P4 - Low"] as const;
export const BUG_STATUSES = ["Open","In Progress","Retest","Closed","Reopened"] as const;

export type Status = (typeof STATUSES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type BugStatus = (typeof BUG_STATUSES)[number];

export const STATUS_COLORS: Record<Status, string> = {
  "Not Run": "#e5e7eb",
  "In Progress": "#93c5fd",
  Pass: "#86efac",
  Fail: "#fca5a5",
  Blocked: "#fdba74",
  Skipped: "#fde68a",
  Retest: "#c4b5fd",
};

export const CHART_COLORS = ["#6366f1","#22c55e","#ef4444","#f97316","#a855f7","#06b6d4","#eab308"] as const;
export const PROJECT_COLORS = ["#6366f1","#06b6d4","#f97316","#a855f7","#22c55e"] as const;

export interface ProjectConfig {
  modules: string[];
  sprints: string[];
  stories: string[];
  devs: string[];
  releases: string[];
}

export interface TestCase {
  id: string;
  title: string;
  module: string;
  story: string;
  sprint: string;
  status: Status;
  assignee: string;
  date: string;
  preconditions?: string;
  description?: string;
  expectedResult?: string;
  actualResult?: string;
  attachmentUrl?: string;
  clickupTaskId?: string;
  clickupTaskUrl?: string;
}

export interface Bug {
  id: string;
  title: string;
  module: string;
  linkedTC: string;
  severity: Severity;
  priority: Priority;
  status: BugStatus;
  assignedDev: string;
  reportedDate: string;
  closedDate: string;
  reopened: boolean;
  release: string;
  reportedBy?: string;
  preconditions?: string;
  description?: string;
  expectedResult?: string;
  actualResult?: string;
  attachmentUrl?: string;
  clickupTaskId?: string;
  clickupTaskUrl?: string;
}

export interface ClickUpConfig {
  projectId: string;
  apiToken: string;
  teamId: string;
  teamName: string;
  listId: string;
  listName: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  createdAt: string;
  releaseDate: string;
  config: ProjectConfig;
  cases: TestCase[];
  bugs: Bug[];
}

export type EditField = {
  key: string;
  label: string;
  options?: string[];
  type?: "date";
};
