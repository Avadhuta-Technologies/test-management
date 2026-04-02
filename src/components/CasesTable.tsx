import { useMemo, useState } from "react";
import type { Project, TestCase } from "../types";
import { STATUSES } from "../types";
import { addTestCase, updateTestCase, uploadAttachment } from "../db";
import { Badge, Field, Inp, Modal, Sel, SmallSel } from "./ui";

type CasesTableProps = { project: Project; onUpdate: (project: Project) => void };
type SortDir = "asc" | "desc";

function AttachmentLink({ url }: { url?: string }) {
  if (!url) return <span className="text-gray-500">—</span>;
  const name = url.split("/").pop() ?? "file";
  return <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-indigo-500 hover:underline truncate max-w-[120px] block">📎 {name}</a>;
}

export function CasesTable({ project, onUpdate }: CasesTableProps) {
  const { cases, config } = project;
  const [search, setSearch] = useState("");
  const [fMod, setFMod] = useState("All");
  const [fSt, setFSt] = useState("All");
  const [fSprint, setFSprint] = useState("All");
  const [sortKey, setSortKey] = useState<keyof TestCase>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const blank: Omit<TestCase, "id"> = {
    title: "", module: config.modules[0] ?? "", story: config.stories[0] ?? "",
    sprint: config.sprints[0] ?? "", status: "Not Run", assignee: "Test Engineer",
    date: today, description: "", attachmentUrl: "",
  };
  const [addForm, setAddForm] = useState<Omit<TestCase, "id">>(blank);

  // edit drawer state
  const [editForm, setEditForm] = useState<TestCase | null>(null);

  const toggleSort = (key: keyof TestCase) => {
    setSortDir(sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "asc");
    setSortKey(key);
  };

  const SortTh = ({ k, label }: { k: keyof TestCase; label: string }) => (
    <th onClick={() => toggleSort(k)} className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap">
      {label} <span className="text-gray-500">{sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
    </th>
  );

  const filtered = useMemo(() => {
    let rows = [...cases];
    if (search) { const q = search.toLowerCase(); rows = rows.filter((c) => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)); }
    if (fMod !== "All") rows = rows.filter((c) => c.module === fMod);
    if (fSt !== "All") rows = rows.filter((c) => c.status === fSt);
    if (fSprint !== "All") rows = rows.filter((c) => c.sprint === fSprint);
    rows.sort((a, b) => { const av = String(a[sortKey] ?? ""), bv = String(b[sortKey] ?? ""); return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av); });
    return rows;
  }, [cases, search, fMod, fSt, fSprint, sortKey, sortDir]);

  const handleAddFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadAttachment(file, `test-cases/${Date.now()}-${file.name}`);
      setAddForm((f) => ({ ...f, attachmentUrl: url }));
    } finally { setUploading(false); }
  };

  const handleEditFile = async (file: File) => {
    if (!editForm) return;
    setUploading(true);
    try {
      const url = await uploadAttachment(file, `test-cases/${Date.now()}-${file.name}`);
      setEditForm((f) => f ? { ...f, attachmentUrl: url } : f);
    } finally { setUploading(false); }
  };

  const saveAdd = async () => {
    if (!addForm.title.trim()) return;
    const created = await addTestCase(project.id, addForm);
    onUpdate({ ...project, cases: [...cases, created] });
    setAddForm(blank);
    setShowAdd(false);
  };

  const saveEdit = async () => {
    if (!editForm) return;
    await updateTestCase(editForm.id, editForm);
    onUpdate({ ...project, cases: cases.map((c) => (c.id === editForm.id ? editForm : c)) });
    setEditId(null);
    setEditForm(null);
  };

  const openEdit = (item: TestCase) => { setEditId(item.id); setEditForm({ ...item }); };
  const closeEdit = () => { setEditId(null); setEditForm(null); };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search ID or title…" className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-44 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <SmallSel options={["All", ...config.modules]} value={fMod} onChange={setFMod} />
        <SmallSel options={["All", ...STATUSES]} value={fSt} onChange={setFSt} />
        <SmallSel options={["All", ...config.sprints]} value={fSprint} onChange={setFSprint} />
        {(search || fMod !== "All" || fSt !== "All" || fSprint !== "All") && (
          <button onClick={() => { setSearch(""); setFMod("All"); setFSt("All"); setFSprint("All"); }} className="text-xs text-indigo-500 font-semibold hover:underline">Clear</button>
        )}
        <span className="text-xs text-gray-600">{filtered.length} of {cases.length}</span>
        <button onClick={() => setShowAdd(true)} className="ml-auto bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">+ Add</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <SortTh k="id" label="ID" />
              <SortTh k="title" label="Title" />
              <SortTh k="module" label="Module" />
              <SortTh k="sprint" label="Sprint" />
              <SortTh k="story" label="Story" />
              <SortTh k="status" label="Status" />
              <SortTh k="assignee" label="Assignee" />
              <SortTh k="date" label="Date" />
              <th className="px-3 py-2 text-left">Attachment</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) =>
              editId === item.id ? null : (
                <tr key={item.id} onClick={() => openEdit(item)} className="border-t hover:bg-indigo-50 cursor-pointer transition-colors">
                  <td className="px-3 py-2 font-mono text-gray-600">{item.id}</td>
                  <td className="px-3 py-2 text-gray-800 max-w-xs">
                    <div className="truncate">{item.title}</div>
                    {item.description && <div className="text-gray-600 truncate mt-0.5">{item.description}</div>}
                  </td>
                  <td className="px-3 py-2"><Badge text={item.module} /></td>
                  <td className="px-3 py-2 text-gray-700">{item.sprint}</td>
                  <td className="px-3 py-2 text-gray-600">{item.story}</td>
                  <td className="px-3 py-2"><Badge text={item.status} /></td>
                  <td className="px-3 py-2 text-gray-700">{item.assignee}</td>
                  <td className="px-3 py-2 text-gray-600">{item.date}</td>
                  <td className="px-3 py-2"><AttachmentLink url={item.attachmentUrl} /></td>
                  <td className="px-3 py-2 text-indigo-400 text-xs">✏️ edit</td>
                </tr>
              )
            )}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="text-center py-8 text-gray-600">No test cases match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add drawer */}
      {showAdd && (
        <Modal title="Add Test Case" onClose={() => setShowAdd(false)}>
          <Field label="Title"><Inp value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} placeholder="Test case title" /></Field>
          <Field label="Module"><Sel options={config.modules} value={addForm.module} onChange={(e) => setAddForm({ ...addForm, module: e.target.value })} /></Field>
          <Field label="User Story"><Sel options={config.stories} value={addForm.story} onChange={(e) => setAddForm({ ...addForm, story: e.target.value })} /></Field>
          <Field label="Sprint"><Sel options={config.sprints} value={addForm.sprint} onChange={(e) => setAddForm({ ...addForm, sprint: e.target.value })} /></Field>
          <Field label="Status"><Sel options={STATUSES} value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value as typeof addForm.status })} /></Field>
          <Field label="Assignee"><Inp value={addForm.assignee} onChange={(e) => setAddForm({ ...addForm, assignee: e.target.value })} /></Field>
          <Field label="Date"><Inp type="date" value={addForm.date} onChange={(e) => setAddForm({ ...addForm, date: e.target.value })} /></Field>
          <Field label="Description">
            <textarea
              value={addForm.description ?? ""}
              onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              rows={3}
              placeholder="Steps to reproduce, expected vs actual result…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </Field>
          <Field label="Attachment">
            {addForm.attachmentUrl ? (
              <div className="flex items-center gap-2">
                <a href={addForm.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline truncate">📎 {addForm.attachmentUrl.split("/").pop()}</a>
                <button onClick={() => setAddForm({ ...addForm, attachmentUrl: "" })} className="text-xs text-red-400 hover:text-red-600">✕</button>
              </div>
            ) : (
              <label className={`flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer hover:border-indigo-400 hover:text-indigo-500 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploading ? "Uploading…" : "📎 Click to attach a file"}
                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleAddFile(e.target.files[0])} />
              </label>
            )}
          </Field>
          <div className="flex gap-2 mt-4">
            <button onClick={saveAdd} disabled={uploading} className="flex-1 bg-indigo-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50">Add</button>
            <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">Cancel</button>
          </div>
        </Modal>
      )}

      {/* Edit drawer */}
      {editForm && (
        <Modal title={`Edit ${editForm.id}`} onClose={closeEdit}>
          <Field label="Title"><Inp value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></Field>
          <Field label="Module"><Sel options={config.modules} value={editForm.module} onChange={(e) => setEditForm({ ...editForm, module: e.target.value })} /></Field>
          <Field label="User Story"><Sel options={config.stories} value={editForm.story} onChange={(e) => setEditForm({ ...editForm, story: e.target.value })} /></Field>
          <Field label="Sprint"><Sel options={config.sprints} value={editForm.sprint} onChange={(e) => setEditForm({ ...editForm, sprint: e.target.value })} /></Field>
          <Field label="Status"><Sel options={STATUSES} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as typeof editForm.status })} /></Field>
          <Field label="Assignee"><Inp value={editForm.assignee} onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })} /></Field>
          <Field label="Date"><Inp type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} /></Field>
          <Field label="Description">
            <textarea
              value={editForm.description ?? ""}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              placeholder="Steps to reproduce, expected vs actual result…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </Field>
          <Field label="Attachment">
            {editForm.attachmentUrl ? (
              <div className="flex items-center gap-2">
                <a href={editForm.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline truncate">📎 {editForm.attachmentUrl.split("/").pop()}</a>
                <button onClick={() => setEditForm({ ...editForm, attachmentUrl: "" })} className="text-xs text-red-400 hover:text-red-600">✕</button>
              </div>
            ) : (
              <label className={`flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer hover:border-indigo-400 hover:text-indigo-500 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploading ? "Uploading…" : "📎 Click to attach a file"}
                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleEditFile(e.target.files[0])} />
              </label>
            )}
          </Field>
          <div className="flex gap-2 mt-4">
            <button onClick={saveEdit} disabled={uploading} className="flex-1 bg-indigo-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50">Save</button>
            <button onClick={closeEdit} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
