import { useMemo, useState } from "react";
import type { Bug, EditField, Project } from "../types";
import { BUG_STATUSES, PRIORITIES, SEVERITIES } from "../types";
import { Badge, Field, Inp, Modal, Sel, SmallSel } from "./ui";
import { EditableRow } from "./EditableRow";

type BugsTableProps = { project: Project; onUpdate: (project: Project) => void };

type SortDir = "asc" | "desc";

export function BugsTable({ project, onUpdate }: BugsTableProps) {
  const { bugs, config } = project;
  const [search, setSearch] = useState("");
  const [fMod, setFMod] = useState("All");
  const [fSt, setFSt] = useState("All");
  const [fSev, setFSev] = useState("All");
  const [fDev, setFDev] = useState("All");
  const [sortKey, setSortKey] = useState<keyof Bug>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const blank: Omit<Bug, "id"> = {
    title: "",
    module: config.modules[0] ?? "",
    linkedTC: "",
    severity: "Major",
    priority: "P3 - Medium",
    status: "Open",
    assignedDev: config.devs[0] ?? "",
    reportedDate: today,
    closedDate: "",
    reopened: false,
    release: config.releases[0] ?? "",
  };

  const [addForm, setAddForm] = useState<Omit<Bug, "id">>(blank);

  const bugFields: EditField[] = [
    { key: "title", label: "Title" },
    { key: "module", label: "Module", options: config.modules },
    { key: "linkedTC", label: "Linked TC" },
    { key: "severity", label: "Severity", options: SEVERITIES },
    { key: "priority", label: "Priority", options: PRIORITIES },
    { key: "status", label: "Status", options: BUG_STATUSES },
    { key: "assignedDev", label: "Dev", options: config.devs },
    { key: "release", label: "Release", options: config.releases },
    { key: "reportedDate", label: "Reported", type: "date" },
    { key: "closedDate", label: "Closed", type: "date" },
  ];

  const toggleSort = (key: keyof Bug) => {
    setSortDir(sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "asc");
    setSortKey(key);
  };

  const SortTh = ({ k, label }: { k: keyof Bug; label: string }) => (
    <th onClick={() => toggleSort(k)} className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap">
      {label} <span className="text-gray-400">{sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
    </th>
  );

  const filtered = useMemo(() => {
    let rows = [...bugs];
    if (search) {
      const query = search.toLowerCase();
      rows = rows.filter((bug) => bug.title.toLowerCase().includes(query) || bug.id.toLowerCase().includes(query));
    }
    if (fMod !== "All") rows = rows.filter((bug) => bug.module === fMod);
    if (fSt !== "All") rows = rows.filter((bug) => bug.status === fSt);
    if (fSev !== "All") rows = rows.filter((bug) => bug.severity === fSev);
    if (fDev !== "All") rows = rows.filter((bug) => bug.assignedDev === fDev);
    rows.sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [bugs, search, fMod, fSt, fSev, fDev, sortKey, sortDir]);

  const saveEdit = (form: Record<string, any>) => {
    if (!editId) return;
    onUpdate({
      ...project,
      bugs: bugs.map((item) =>
        item.id === editId
          ? { ...item, ...form, id: editId, reopened: form.reopened === "true" || form.reopened === true }
          : item,
      ),
    });
    setEditId(null);
  };

  const saveAdd = () => {
    if (!addForm.title.trim()) return;
    onUpdate({
      ...project,
      bugs: [
        ...bugs,
        { ...addForm, id: `BUG-${String(bugs.length + 1).padStart(3, "0")}` },
      ],
    });
    setAddForm(blank);
    setShowAdd(false);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="🔍 Search ID or title…"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-44 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <SmallSel options={["All", ...config.modules]} value={fMod} onChange={setFMod} />
        <SmallSel options={["All", ...BUG_STATUSES]} value={fSt} onChange={setFSt} />
        <SmallSel options={["All", ...SEVERITIES]} value={fSev} onChange={setFSev} />
        <SmallSel options={["All", ...config.devs]} value={fDev} onChange={setFDev} />
        {(search || fMod !== "All" || fSt !== "All" || fSev !== "All" || fDev !== "All") && (
          <button
            onClick={() => {
              setSearch("");
              setFMod("All");
              setFSt("All");
              setFSev("All");
              setFDev("All");
            }}
            className="text-xs text-indigo-500 font-semibold hover:underline"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-gray-400">{filtered.length} of {bugs.length}</span>
        <button onClick={() => setShowAdd(true)} className="ml-auto bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
          + Log Bug
        </button>
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
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) =>
              editId === item.id ? (
                <EditableRow key={item.id} row={item} fields={bugFields} onSave={saveEdit} onCancel={() => setEditId(null)} />
              ) : (
                <tr key={item.id} onClick={() => setEditId(item.id)} className="border-t hover:bg-red-50 cursor-pointer transition-colors" title="Click to edit">
                  <td className="px-3 py-2 font-mono text-gray-400">{item.id}</td>
                  <td className="px-3 py-2 text-gray-800 max-w-xs truncate">{item.title}</td>
                  <td className="px-3 py-2"><Badge text={item.module} /></td>
                  <td className="px-3 py-2 font-mono text-gray-400">{item.linkedTC}</td>
                  <td className="px-3 py-2"><Badge text={item.severity} /></td>
                  <td className="px-3 py-2"><Badge text={item.priority} /></td>
                  <td className="px-3 py-2"><Badge text={item.status} /></td>
                  <td className="px-3 py-2 text-gray-500">{item.assignedDev.replace("Dev - ", "")}</td>
                  <td className="px-3 py-2 text-gray-400">{item.reportedDate}</td>
                  <td className="px-3 py-2 text-indigo-400 text-xs">✏️ edit</td>
                </tr>
              ),
            )}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400">
                  No bugs match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Log New Bug" onClose={() => setShowAdd(false)}>
          <Field label="Title">
            <Inp value={addForm.title} onChange={(event) => setAddForm({ ...addForm, title: event.target.value })} placeholder="Describe the bug" />
          </Field>
          <Field label="Module">
            <Sel options={config.modules} value={addForm.module} onChange={(event) => setAddForm({ ...addForm, module: event.target.value })} />
          </Field>
          <Field label="Linked TC">
            <Inp value={addForm.linkedTC} onChange={(event) => setAddForm({ ...addForm, linkedTC: event.target.value })} placeholder="e.g. TC-003" />
          </Field>
          <Field label="Severity">
            <Sel options={SEVERITIES} value={addForm.severity} onChange={(event) => setAddForm({ ...addForm, severity: event.target.value as typeof addForm.severity })} />
          </Field>
          <Field label="Priority">
            <Sel options={PRIORITIES} value={addForm.priority} onChange={(event) => setAddForm({ ...addForm, priority: event.target.value as typeof addForm.priority })} />
          </Field>
          <Field label="Status">
            <Sel options={BUG_STATUSES} value={addForm.status} onChange={(event) => setAddForm({ ...addForm, status: event.target.value as typeof addForm.status })} />
          </Field>
          <Field label="Assigned Dev">
            <Sel options={config.devs} value={addForm.assignedDev} onChange={(event) => setAddForm({ ...addForm, assignedDev: event.target.value })} />
          </Field>
          <Field label="Release">
            <Sel options={config.releases} value={addForm.release} onChange={(event) => setAddForm({ ...addForm, release: event.target.value })} />
          </Field>
          <Field label="Reported Date">
            <Inp type="date" value={addForm.reportedDate} onChange={(event) => setAddForm({ ...addForm, reportedDate: event.target.value })} />
          </Field>
          <div className="flex gap-2 mt-4">
            <button onClick={saveAdd} className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-lg">
              Log Bug
            </button>
            <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
