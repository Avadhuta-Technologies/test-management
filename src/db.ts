import { supabase } from "./supabase";
import type { Project, TestCase, Bug, ClickUpConfig } from "./types";

// ── helpers ────────────────────────────────────────────────────────────────

function rowToProject(p: any, cfg: any, cases: any[], bugs: any[]): Project {
  return {
    id: p.id,
    name: p.name,
    color: p.color ?? "#6366f1",
    description: p.description ?? "",
    createdAt: p.created_at?.split("T")[0] ?? "",
    releaseDate: p.release_date ?? "",
    config: cfg
      ? { modules: cfg.modules ?? [], sprints: cfg.sprints ?? [], stories: cfg.stories ?? [], devs: cfg.devs ?? [], releases: cfg.releases ?? [] }
      : { modules: [], sprints: [], stories: [], devs: [], releases: [] },
    cases: cases.map(rowToCase),
    bugs: bugs.map(rowToBug),
  };
}

function rowToCase(r: any): TestCase {
  return { id: r.id, title: r.title, module: r.module, story: r.story, sprint: r.sprint, status: r.status, assignee: r.assignee, date: r.date, preconditions: r.preconditions ?? "", description: r.description ?? "", expectedResult: r.expected_result ?? "", actualResult: r.actual_result ?? "", attachmentUrl: r.attachment_url ?? "", clickupTaskId: r.clickup_task_id ?? undefined, clickupTaskUrl: r.clickup_task_url ?? undefined };
}

function rowToBug(r: any): Bug {
  return { id: r.id, title: r.title, module: r.module, linkedTC: r.linked_tc, severity: r.severity, priority: r.priority, status: r.status, assignedDev: r.assigned_dev, reportedDate: r.reported_date, closedDate: r.closed_date ?? "", reopened: r.reopened ?? false, release: r.release, reportedBy: r.reported_by, preconditions: r.preconditions ?? "", description: r.description ?? "", expectedResult: r.expected_result ?? "", actualResult: r.actual_result ?? "", attachmentUrl: r.attachment_url ?? "", clickupTaskId: r.clickup_task_id ?? undefined, clickupTaskUrl: r.clickup_task_url ?? undefined };
}

// ── projects ───────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const [{ data: projects }, { data: configs }, { data: cases }, { data: bugs }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at"),
    supabase.from("project_config").select("*"),
    supabase.from("test_cases").select("*").order("id"),
    supabase.from("bugs").select("*").order("id"),
  ]);
  return (projects ?? []).map((p) =>
    rowToProject(
      p,
      (configs ?? []).find((c) => c.project_id === p.id),
      (cases ?? []).filter((c) => c.project_id === p.id),
      (bugs ?? []).filter((b) => b.project_id === p.id),
    ),
  );
}

export async function createProject(data: { name: string; description: string; color: string; releaseDate: string }): Promise<Project> {
  const { data: p, error } = await supabase
    .from("projects")
    .insert({ name: data.name, description: data.description, color: data.color, release_date: data.releaseDate || null })
    .select()
    .single();
  if (error) throw error;
  await supabase.from("project_config").insert({ project_id: p.id, modules: [], sprints: [], stories: [], devs: [], releases: [] });
  return rowToProject(p, { modules: [], sprints: [], stories: [], devs: [], releases: [] }, [], []);
}

export async function deleteProject(id: string): Promise<void> {
  await supabase.from("bugs").delete().eq("project_id", id);
  await supabase.from("test_cases").delete().eq("project_id", id);
  await supabase.from("project_config").delete().eq("project_id", id);
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function updateProjectMeta(id: string, data: { name?: string; description?: string; color?: string; releaseDate?: string }): Promise<void> {
  const patch: any = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined) patch.description = data.description;
  if (data.color !== undefined) patch.color = data.color;
  if (data.releaseDate !== undefined) patch.release_date = data.releaseDate || null;
  const { error } = await supabase.from("projects").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateProjectConfig(projectId: string, config: Project["config"]): Promise<void> {
  const { error } = await supabase.from("project_config").upsert({ project_id: projectId, ...config }, { onConflict: "project_id" });
  if (error) throw error;
}

// ── test cases ─────────────────────────────────────────────────────────────

export async function uploadAttachment(file: File, path: string): Promise<string> {
  const { error } = await supabase.storage.from("attachments").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("attachments").getPublicUrl(path);
  return data.publicUrl;
}

export async function addTestCase(projectId: string, data: Omit<TestCase, "id">): Promise<TestCase> {
  const { count } = await supabase.from("test_cases").select("*", { count: "exact", head: true }).eq("project_id", projectId);
  const id = `TC-${String((count ?? 0) + 1).padStart(3, "0")}`;
  const { data: r, error } = await supabase
    .from("test_cases")
    .insert({ id, project_id: projectId, title: data.title, module: data.module, story: data.story, sprint: data.sprint, status: data.status, assignee: data.assignee, date: data.date, preconditions: data.preconditions || null, description: data.description || null, expected_result: data.expectedResult || null, actual_result: data.actualResult || null, attachment_url: data.attachmentUrl || null })
    .select()
    .single();
  if (error) throw error;
  return rowToCase(r);
}

export async function updateTestCase(id: string, data: Partial<TestCase>): Promise<void> {
  const patch: any = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.module !== undefined) patch.module = data.module;
  if (data.story !== undefined) patch.story = data.story;
  if (data.sprint !== undefined) patch.sprint = data.sprint;
  if (data.status !== undefined) patch.status = data.status;
  if (data.assignee !== undefined) patch.assignee = data.assignee;
  if (data.date !== undefined) patch.date = data.date;
  if (data.preconditions !== undefined) patch.preconditions = data.preconditions || null;
  if (data.description !== undefined) patch.description = data.description || null;
  if (data.expectedResult !== undefined) patch.expected_result = data.expectedResult || null;
  if (data.actualResult !== undefined) patch.actual_result = data.actualResult || null;
  if (data.attachmentUrl !== undefined) patch.attachment_url = data.attachmentUrl || null;
  if (data.clickupTaskId !== undefined) patch.clickup_task_id = data.clickupTaskId || null;
  if (data.clickupTaskUrl !== undefined) patch.clickup_task_url = data.clickupTaskUrl || null;
  const { error } = await supabase.from("test_cases").update(patch).eq("id", id);
  if (error) throw error;
}

// ── bugs ───────────────────────────────────────────────────────────────────

export async function addBug(projectId: string, data: Omit<Bug, "id">): Promise<Bug> {
  const { count } = await supabase.from("bugs").select("*", { count: "exact", head: true }).eq("project_id", projectId);
  const id = `BUG-${String((count ?? 0) + 1).padStart(3, "0")}`;
  const { data: r, error } = await supabase
    .from("bugs")
    .insert({ id, project_id: projectId, title: data.title, module: data.module, linked_tc: data.linkedTC, severity: data.severity, priority: data.priority, status: data.status, assigned_dev: data.assignedDev, reported_date: data.reportedDate, closed_date: data.closedDate || null, reopened: data.reopened, release: data.release, reported_by: data.reportedBy ?? null, preconditions: data.preconditions || null, description: data.description || null, expected_result: data.expectedResult || null, actual_result: data.actualResult || null, attachment_url: data.attachmentUrl || null })
    .select()
    .single();
  if (error) throw error;
  return rowToBug(r);
}

export async function updateBug(id: string, data: Partial<Bug>): Promise<void> {
  const patch: any = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.module !== undefined) patch.module = data.module;
  if (data.linkedTC !== undefined) patch.linked_tc = data.linkedTC;
  if (data.severity !== undefined) patch.severity = data.severity;
  if (data.priority !== undefined) patch.priority = data.priority;
  if (data.status !== undefined) patch.status = data.status;
  if (data.assignedDev !== undefined) patch.assigned_dev = data.assignedDev;
  if (data.reportedDate !== undefined) patch.reported_date = data.reportedDate;
  if (data.closedDate !== undefined) patch.closed_date = data.closedDate || null;
  if (data.reopened !== undefined) patch.reopened = data.reopened;
  if (data.release !== undefined) patch.release = data.release;
  if (data.preconditions !== undefined) patch.preconditions = data.preconditions || null;
  if (data.description !== undefined) patch.description = data.description || null;
  if (data.expectedResult !== undefined) patch.expected_result = data.expectedResult || null;
  if (data.actualResult !== undefined) patch.actual_result = data.actualResult || null;
  if (data.attachmentUrl !== undefined) patch.attachment_url = data.attachmentUrl || null;
  if (data.clickupTaskId !== undefined) patch.clickup_task_id = data.clickupTaskId || null;
  if (data.clickupTaskUrl !== undefined) patch.clickup_task_url = data.clickupTaskUrl || null;
  const { error } = await supabase.from("bugs").update(patch).eq("id", id);
  if (error) throw error;
}

// ── clickup config ─────────────────────────────────────────────────────────

export async function fetchClickUpConfig(projectId: string): Promise<ClickUpConfig | null> {
  const { data, error } = await supabase.from("clickup_config").select("*").eq("project_id", projectId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { projectId: data.project_id, apiToken: data.api_token, teamId: data.team_id, teamName: data.team_name ?? "", listId: data.list_id, listName: data.list_name ?? "" };
}

export async function saveClickUpConfig(config: ClickUpConfig): Promise<void> {
  const { error } = await supabase.from("clickup_config").upsert({
    project_id: config.projectId,
    api_token: config.apiToken,
    team_id: config.teamId,
    team_name: config.teamName,
    list_id: config.listId,
    list_name: config.listName,
    updated_at: new Date().toISOString(),
  }, { onConflict: "project_id" });
  if (error) throw error;
}

export async function deleteClickUpConfig(projectId: string): Promise<void> {
  const { error } = await supabase.from("clickup_config").delete().eq("project_id", projectId);
  if (error) throw error;
}
