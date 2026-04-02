import type { Bug, BugStatus } from "./types";

const BASE = "https://api.clickup.com/api/v2";

function headers(token: string) {
  return { Authorization: token, "Content-Type": "application/json" };
}

async function req<T>(token: string, path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: headers(token) });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`ClickUp API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ── types ──────────────────────────────────────────────────────────────────

export interface ClickUpTeam {
  id: string;
  name: string;
}

export interface ClickUpSpace {
  id: string;
  name: string;
}

export interface ClickUpList {
  id: string;
  name: string;
}

export interface ClickUpTask {
  id: string;
  name: string;
  status: { status: string; color: string };
  assignees: { username: string; email: string }[];
  url: string;
  description?: string;
}

// ── workspace hierarchy ───────────────────────────────────────────────────

export async function fetchWorkspaces(token: string): Promise<ClickUpTeam[]> {
  const data = await req<{ teams: ClickUpTeam[] }>(token, "/team");
  return data.teams;
}

export async function fetchSpaces(token: string, teamId: string): Promise<ClickUpSpace[]> {
  const data = await req<{ spaces: ClickUpSpace[] }>(token, `/team/${teamId}/space?archived=false`);
  return data.spaces;
}

export async function fetchLists(token: string, spaceId: string): Promise<ClickUpList[]> {
  // Fetch folderless lists and folders in parallel; tolerate individual failures
  const [folderlessResult, foldersResult] = await Promise.allSettled([
    req<{ lists: ClickUpList[] }>(token, `/space/${spaceId}/list?archived=false`),
    req<{ folders: { id: string; name: string }[] }>(token, `/space/${spaceId}/folder?archived=false`),
  ]);

  const folderless = folderlessResult.status === "fulfilled" ? folderlessResult.value.lists : [];
  const folders = foldersResult.status === "fulfilled" ? foldersResult.value.folders : [];

  // Fetch lists inside each folder individually
  const folderListResults = await Promise.allSettled(
    folders.map((f) => req<{ lists: ClickUpList[] }>(token, `/folder/${f.id}/list?archived=false`))
  );
  const folderLists = folderListResults
    .filter((r): r is PromiseFulfilledResult<{ lists: ClickUpList[] }> => r.status === "fulfilled")
    .flatMap((r) => r.value.lists);

  return [...folderless, ...folderLists];
}

// ── tasks ─────────────────────────────────────────────────────────────────

export async function fetchTask(token: string, taskId: string): Promise<ClickUpTask> {
  return req<ClickUpTask>(token, `/task/${taskId}`);
}

export async function fetchListTasks(token: string, listId: string): Promise<ClickUpTask[]> {
  const data = await req<{ tasks: ClickUpTask[] }>(token, `/list/${listId}/task?archived=false&page=0`);
  return data.tasks;
}

const PRIORITY_MAP: Record<string, number> = {
  "P1 - Urgent": 1,
  "P2 - High": 2,
  "P3 - Medium": 3,
  "P4 - Low": 4,
};

function bugToTaskBody(bug: Bug | Omit<Bug, "id">) {
  const lines = [
    bug.description || "",
    "",
    `---`,
    `**Module:** ${bug.module}`,
    `**Severity:** ${"severity" in bug ? bug.severity : ""}`,
    `**Linked TC:** ${"linkedTC" in bug ? bug.linkedTC : ""}`,
    `**Reported:** ${"reportedDate" in bug ? bug.reportedDate : ""}`,
  ];
  return lines.join("\n");
}

export async function createClickUpTask(token: string, listId: string, bug: Bug | Omit<Bug, "id">): Promise<ClickUpTask> {
  const body = {
    name: ("id" in bug ? `[${bug.id}] ` : "") + bug.title,
    description: bugToTaskBody(bug),
    priority: PRIORITY_MAP[bug.priority] ?? 3,
  };
  return req<ClickUpTask>(token, `/list/${listId}/task`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateClickUpTask(token: string, taskId: string, bug: Bug): Promise<ClickUpTask> {
  const body = {
    name: `[${bug.id}] ${bug.title}`,
    description: bugToTaskBody(bug),
    priority: PRIORITY_MAP[bug.priority] ?? 3,
  };
  return req<ClickUpTask>(token, `/task/${taskId}`, { method: "PUT", body: JSON.stringify(body) });
}

// ── status mapping (ClickUp → app) ────────────────────────────────────────

export function clickupStatusToBugStatus(cuStatus: string): BugStatus | null {
  const s = cuStatus.toLowerCase();
  if (s === "complete" || s === "closed" || s === "done") return "Closed";
  if (s === "in progress" || s === "in review") return "In Progress";
  if (s === "open" || s === "to do" || s === "backlog") return "Open";
  if (s === "retest" || s === "ready for qa") return "Retest";
  return null;
}

// ── parse task ID from URL or raw ID ──────────────────────────────────────

export function parseTaskId(input: string): string {
  // handles: https://app.clickup.com/t/abc123 or just abc123
  const match = input.match(/\/t\/([a-z0-9]+)/i);
  return match ? match[1] : input.trim();
}
