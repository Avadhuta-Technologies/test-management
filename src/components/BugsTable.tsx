import { useMemo, useState } from "react";
import type { Bug, Project, ClickUpConfig } from "../types";
import { BUG_STATUSES, PRIORITIES, SEVERITIES } from "../types";
import { addBug, updateBug, uploadAttachment } from "../db";
import { createClickUpTask, updateClickUpTask, fetchListTasks, clickupStatusToBugStatus } from "../clickup";
import { Badge, Field, Inp, Modal, Sel, SmallSel } from "./ui";

type BugsTableProps = { project: Project; onUpdate: (project: Project) => void; clickUpConfig: ClickUpConfig | null };
type SortDir = "asc" | "desc";

function AttachmentLink({ url }: { url?: string }) {
  if (!url) return <span className="text-gray-500">—</span>;
  const name = url.split("/").pop() ?? "file";
  return <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-indigo-500 hover:underline truncate max-w-[120px] block">📎 {name}</a>;
}

function ClickUpChip({ taskId, taskUrl }: { taskId?: string; taskUrl?: string }) {
  if (!taskId) return null;
  return (
    <a
      href={taskUrl ?? `https://app.clickup.com/t/${taskId}`}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full hover:bg-purple-100"
      title="View in ClickUp"
    >
      🔗 CU
    </a>
  );
}

export function BugsTable({ project, onUpdate, clickUpConfig }: BugsTableProps) {
  const { bugs, config } = project;
  const [search, setSearch] = useState("");
  const [fMod, setFMod] = useState("All");
  const [fSt, setFSt] = useState("All");
  const [fSev, setFSev] = useState("All");
  const [fDev, setFDev] = useState("All");
  const [sortKey, setSortKey] = useState<keyof Bug>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showAdd, setShowAdd] = useState(false);
  const [editForm, setEditForm] = useState<Bug | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [cuError, setCuError] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const blank: Omit<Bug, "id"> = {
    title: "", module: config.modules[0] ?? "", linkedTC: "", severity: "Major", priority: "P3 - Medium",
    status: "Open", assignedDev: config.devs[0] ?? "", reportedDate: today, closedDate: "",
    reopened: false, release: config.releases[0] ?? "", description: "", attachmentUrl: "",
  };
  const [addForm, setAddForm] = useState<Omit<Bug, "id">>(blank);

  const toggleSort = (key: keyof Bug) => {
    setSortDir(sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "asc");
    setSortKey(key);
  };

  const SortTh = ({ k, label }: { k: keyof Bug; label: string }) => (
    <th onClick={() => toggleSort(k)} className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap">
      {label} <span className="text-gray-500">{sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
    </th>
  );

  const filtered = useMemo(() => {
    let rows = [...bugs];
    if (search) { const q = search.toLowerCase(); rows = rows.filter((b) => b.title.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)); }
    if (fMod !== "All") rows = rows.filter((b) => b.module === fMod);
    if (fSt !== "All") rows = rows.filter((b) => b.status === fSt);
    if (fSev !== "All") rows = rows.filter((b) => b.severity === fSev);
    if (fDev !== "All") rows = rows.filter((b) => b.assignedDev === fDev);
    rows.sort((a, b) => { const av = String(a[sortKey] ?? ""), bv = String(b[sortKey] ?? ""); return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av); });
    return rows;
  }, [bugs, search, fMod, fSt, fSev, fDev, sortKey, sortDir]);

  const handleFile = async (file: File, target: "add" | "edit") => {
    setUploading(true);
    try {
      const url = await uploadAttachment(file, `bugs/${Date.now()}-${file.name}`);
      if (target === "add") setAddForm((f) => ({ ...f, attachmentUrl: url }));
      else setEditForm((f) => f ? { ...f, attachmentUrl: url } : f);
    } finally { setUploading(false); }
  };

  const saveAdd = async () => {
    if (!addForm.title.trim()) return;
    const created = await addBug(project.id, addForm);
    onUpdate({ ...project, bugs: [...bugs, created] });
    setAddForm(blank);
    setShowAdd(false);
  };

  const saveEdit = async () => {
    if (!editForm) return;
    const patch: Partial<Bug> = { ...editForm, reopened: editForm.reopened };
    await updateBug(editForm.id, patch);
    onUpdate({ ...project, bugs: bugs.map((b) => (b.id === editForm.id ? editForm : b)) });
    setEditForm(null);
  };

  // ── Phase 3a: push bug to ClickUp ────────────────────────────────────────

  const pushToClickUp = async () => {
    if (!editForm || !clickUpConfig) return;
    setCuError("");
    setPushing(true);
    try {
      let task;
      if (editForm.clickupTaskId) {
        task = await updateClickUpTask(clickUpConfig.apiToken, editForm.clickupTaskId, editForm);
      } else {
        task = await createClickUpTask(clickUpConfig.apiToken, clickUpConfig.listId, editForm);
      }
      const updated: Bug = { ...editForm, clickupTaskId: task.id, clickupTaskUrl: task.url };
      await updateBug(updated.id, { clickupTaskId: task.id, clickupTaskUrl: task.url });
      setEditForm(updated);
      onUpdate({ ...project, bugs: bugs.map((b) => (b.id === updated.id ? updated : b)) });
    } catch (e: any) {
      setCuError(e.message ?? "ClickUp push failed.");
    } finally {
      setPushing(false);
    }
  };

  // ── Phase 3b: sync ClickUp statuses back ─────────────────────────────────

  const syncClickUp = async () => {
    if (!clickUpConfig) return;
    setSyncing(true);
    setSyncMsg("");
    setCuError("");
    try {
      const tasks = await fetchListTasks(clickUpConfig.apiToken, clickUpConfig.listId);
      const taskMap = new Map(tasks.map((t) => [t.id, t]));
      let updatedCount = 0;
      const updatedBugs = await Promise.all(
        bugs.map(async (b) => {
          if (!b.clickupTaskId) return b;
          const task = taskMap.get(b.clickupTaskId);
          if (!task) return b;
          const newStatus = clickupStatusToBugStatus(task.status.status);
          if (!newStatus || newStatus === b.status) return b;
          await updateBug(b.id, { status: newStatus });
          updatedCount++;
          return { ...b, status: newStatus };
        })
      );
      onUpdate({ ...project, bugs: updatedBugs });
      setSyncMsg(`Synced ${bugs.filter((b) => b.clickupTaskId).length} bugs — ${updatedCount} updated.`);
    } catch (e: any) {
      setCuError(e.message ?? "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const FormFields = ({ form, set }: { form: Omit<Bug, "id"> | Bug; set: (v: any) => void }) => (
    <>
      <Field label="Title"><Inp value={form.title} onChange={(e) => set({ ...form, title: e.target.value })} placeholder="Describe the bug" /></Field>
      <Field label="Module"><Sel options={config.modules} value={form.module} onChange={(e) => set({ ...form, module: e.target.value })} /></Field>
      <Field label="Linked TC"><Inp value={form.linkedTC} onChange={(e) => set({ ...form, linkedTC: e.target.value })} placeholder="e.g. TC-003" /></Field>
      <Field label="Severity"><Sel options={SEVERITIES} value={form.severity} onChange={(e) => set({ ...form, severity: e.target.value as Bug["severity"] })} /></Field>
      <Field label="Priority"><Sel options={PRIORITIES} value={form.priority} onChange={(e) => set({ ...form, priority: e.target.value as Bug["priority"] })} /></Field>
      <Field label="Status"><Sel options={BUG_STATUSES} value={form.status} onChange={(e) => set({ ...form, status: e.target.value as Bug["status"] })} /></Field>
      <Field label="Assigned Dev"><Sel options={config.devs} value={form.assignedDev} onChange={(e) => set({ ...form, assignedDev: e.target.value })} /></Field>
      <Field label="Release"><Sel options={config.releases} value={form.release} onChange={(e) => set({ ...form, release: e.target.value })} /></Field>
      <Field label="Reported Date"><Inp type="date" value={form.reportedDate} onChange={(e) => set({ ...form, reportedDate: e.target.value })} /></Field>
      <Field label="Closed Date"><Inp type="date" value={form.closedDate ?? ""} onChange={(e) => set({ ...form, closedDate: e.target.value })} /></Field>
      <Field label="Description">
        <textarea
          value={form.description ?? ""}
          onChange={(e) => set({ ...form, description: e.target.value })}
          rows={3}
          placeholder="Steps to reproduce, environment, expected vs actual…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </Field>
    </>
  );

  const FileField = ({ url, onClear, target }: { url?: string; onClear: () => void; target: "add" | "edit" }) => (
    <Field label="Attachment">
      {url ? (
        <div className="flex items-center gap-2">
          <a href={url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline truncate">📎 {url.split("/").pop()}</a>
          <button onClick={onClear} className="text-xs text-red-400 hover:text-red-600">✕</button>
        </div>
      ) : (
        <label className={`flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer hover:border-indigo-400 hover:text-indigo-500 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? "Uploading…" : "📎 Click to attach a file"}
          <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], target)} />
        </label>
      )}
    </Field>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search ID or title…" className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-44 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <SmallSel options={["All", ...config.modules]} value={fMod} onChange={setFMod} />
        <SmallSel options={["All", ...BUG_STATUSES]} value={fSt} onChange={setFSt} />
        <SmallSel options={["All", ...SEVERITIES]} value={fSev} onChange={setFSev} />
        <SmallSel options={["All", ...config.devs]} value={fDev} onChange={setFDev} />
        {(search || fMod !== "All" || fSt !== "All" || fSev !== "All" || fDev !== "All") && (
          <button onClick={() => { setSearch(""); setFMod("All"); setFSt("All"); setFSev("All"); setFDev("All"); }} className="text-xs text-indigo-500 font-semibold hover:underline">Clear</button>
        )}
        <span className="text-xs text-gray-600">{filtered.length} of {bugs.length}</span>
        {clickUpConfig && (
          <button onClick={syncClickUp} disabled={syncing} className="text-xs text-purple-600 font-semibold bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 disabled:opacity-50">
            {syncing ? "Syncing…" : "🔄 Sync ClickUp"}
          </button>
        )}
        {syncMsg && <span className="text-xs text-green-600 font-semibold">{syncMsg}</span>}
        {cuError && !editForm && <span className="text-xs text-red-500">{cuError}</span>}
        <button onClick={() => setShowAdd(true)} className="ml-auto bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">+ Log Bug</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <SortTh k="id" label="ID" />
              <SortTh k="title" label="Title" />
              <SortTh k="module" label="Module" />
              <SortTh k="linkedTC" label="TC" />
              <SortTh k="severity" label="Severity" />
              <SortTh k="priority" label="Priority" />
              <SortTh k="status" label="Status" />
              <SortTh k="assignedDev" label="Dev" />
              <SortTh k="reportedDate" label="Reported" />
              <th className="px-3 py-2 text-left">Attachment</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} onClick={() => { setEditForm({ ...item }); setCuError(""); setSyncMsg(""); }} className="border-t hover:bg-red-50 cursor-pointer transition-colors">
                <td className="px-3 py-2 font-mono text-gray-600">{item.id}</td>
                <td className="px-3 py-2 text-gray-800 max-w-xs">
                  <div className="truncate">{item.title}</div>
                  {item.description && <div className="text-gray-600 truncate mt-0.5">{item.description}</div>}
                </td>
                <td className="px-3 py-2"><Badge text={item.module} /></td>
                <td className="px-3 py-2 font-mono text-gray-600">{item.linkedTC}</td>
                <td className="px-3 py-2"><Badge text={item.severity} /></td>
                <td className="px-3 py-2"><Badge text={item.priority} /></td>
                <td className="px-3 py-2"><Badge text={item.status} /></td>
                <td className="px-3 py-2 text-gray-700">{item.assignedDev.replace("Dev - ", "")}</td>
                <td className="px-3 py-2 text-gray-600">{item.reportedDate}</td>
                <td className="px-3 py-2"><AttachmentLink url={item.attachmentUrl} /></td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span className="text-indigo-400 text-xs">✏️ edit</span>
                    <ClickUpChip taskId={item.clickupTaskId} taskUrl={item.clickupTaskUrl} />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={11} className="text-center py-8 text-gray-600">No bugs match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add drawer */}
      {showAdd && (
        <Modal title="Log New Bug" onClose={() => setShowAdd(false)}>
          <FormFields form={addForm} set={setAddForm} />
          <FileField url={addForm.attachmentUrl} onClear={() => setAddForm({ ...addForm, attachmentUrl: "" })} target="add" />
          <div className="flex gap-2 mt-4">
            <button onClick={saveAdd} disabled={uploading} className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-lg disabled:opacity-50">Log Bug</button>
            <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">Cancel</button>
          </div>
        </Modal>
      )}

      {/* Edit drawer */}
      {editForm && (
        <Modal title={`Edit ${editForm.id}`} onClose={() => setEditForm(null)}>
          <FormFields form={editForm} set={setEditForm} />
          <FileField url={editForm.attachmentUrl} onClear={() => setEditForm({ ...editForm, attachmentUrl: "" })} target="edit" />

          {/* ClickUp info */}
          {clickUpConfig && editForm.clickupTaskId && (
            <div className="mt-3 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100 flex items-center justify-between">
              <span className="text-xs text-purple-700 font-semibold">🔗 Linked to ClickUp</span>
              <a href={editForm.clickupTaskUrl ?? `https://app.clickup.com/t/${editForm.clickupTaskId}`} target="_blank" rel="noreferrer" className="text-xs text-purple-600 hover:underline">Open task ↗</a>
            </div>
          )}
          {cuError && <p className="text-xs text-red-500 mt-2">{cuError}</p>}

          <div className="flex gap-2 mt-4">
            <button onClick={saveEdit} disabled={uploading} className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-lg disabled:opacity-50">Save</button>
            {clickUpConfig && (
              <button onClick={pushToClickUp} disabled={pushing || uploading} className="flex-1 bg-purple-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50">
                {pushing ? "Pushing…" : editForm.clickupTaskId ? "Update in ClickUp" : "Push to ClickUp"}
              </button>
            )}
            <button onClick={() => setEditForm(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
