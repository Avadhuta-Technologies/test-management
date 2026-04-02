import { useMemo, useState } from "react";
import type { EditField, Project, TestCase } from "../types";
import { STATUSES } from "../types";
import { Badge, Field, Inp, Modal, Sel, SmallSel } from "./ui";
import { EditableRow } from "./EditableRow";

type CasesTableProps = { project: Project; onUpdate: (project: Project) => void };

type SortDir = "asc" | "desc";

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
  const today = new Date().toISOString().split("T")[0];

  const blank: Omit<TestCase, "id"> = {
    title: "",
    module: config.modules[0] ?? "",
    story: config.stories[0] ?? "",
    sprint: config.sprints[0] ?? "",
    status: "Not Run",
    assignee: "Test Engineer",
    date: today,
  };

  const [addForm, setAddForm] = useState<Omit<TestCase, "id">>(blank);

  const caseFields: EditField[] = [
    { key: "title", label: "Title" },
    { key: "module", label: "Module", options: config.modules },
    { key: "sprint", label: "Sprint", options: config.sprints },
    { key: "story", label: "Story", options: config.stories },
    { key: "status", label: "Status", options: STATUSES },
    { key: "assignee", label: "Assignee" },
    { key: "date", label: "Date", type: "date" },
  ];

  const toggleSort = (key: keyof TestCase) => {
    setSortDir(sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "asc");
    setSortKey(key);
  };

  const SortTh = ({ k, label }: { k: keyof TestCase; label: string }) => (
    <th onClick={() => toggleSort(k)} className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap">
      {label} <span className="text-gray-400">{sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
    </th>
  );

  const filtered = useMemo(() => {
    let rows = [...cases];
    if (search) {
      const query = search.toLowerCase();
      rows = rows.filter((c) => c.title.toLowerCase().includes(query) || c.id.toLowerCase().includes(query));
    }
    if (fMod !== "All") rows = rows.filter((c) => c.module === fMod);
    if (fSt !== "All") rows = rows.filter((c) => c.status === fSt);
    if (fSprint !== "All") rows = rows.filter((c) => c.sprint === fSprint);
    rows.sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [cases, search, fMod, fSt, fSprint, sortKey, sortDir]);

  const saveEdit = (form: Record<string, any>) => {
    if (!editId) return;
    onUpdate({
      ...project,
      cases: cases.map((item) => (item.id === editId ? { ...form, id: editId } : item)),
    });
    setEditId(null);
  };

  const saveAdd = () => {
    if (!addForm.title.trim()) return;
    onUpdate({
      ...project,
      cases: [
        ...cases,
        { ...addForm, id: `TC-${String(cases.length + 1).padStart(3, "0")}` },
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
        <SmallSel options={["All", ...STATUSES]} value={fSt} onChange={setFSt} />
        <SmallSel options={["All", ...config.sprints]} value={fSprint} onChange={setFSprint} />
        {(search || fMod !== "All" || fSt !== "All" || fSprint !== "All") && (
          <button
            onClick={() => {
              setSearch("");
              setFMod("All");
              setFSt("All");
              setFSprint("All");
            }}
            className="text-xs text-indigo-500 font-semibold hover:underline"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-gray-400">{filtered.length} of {cases.length}</span>
        <button onClick={() => setShowAdd(true)} className="ml-auto bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
          + Add
        </button>
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
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) =>
              editId === item.id ? (
                <EditableRow key={item.id} row={item} fields={caseFields} onSave={saveEdit} onCancel={() => setEditId(null)} />
              ) : (
                <tr key={item.id} onClick={() => setEditId(item.id)} className="border-t hover:bg-indigo-50 cursor-pointer transition-colors" title="Click to edit">
                  <td className="px-3 py-2 font-mono text-gray-400">{item.id}</td>
                  <td className="px-3 py-2 text-gray-800 max-w-xs truncate">{item.title}</td>
                  <td className="px-3 py-2"><Badge text={item.module} /></td>
                  <td className="px-3 py-2 text-gray-500">{item.sprint}</td>
                  <td className="px-3 py-2 text-gray-400">{item.story}</td>
                  <td className="px-3 py-2"><Badge text={item.status} /></td>
                  <td className="px-3 py-2 text-gray-500">{item.assignee}</td>
                  <td className="px-3 py-2 text-gray-400">{item.date}</td>
                  <td className="px-3 py-2 text-indigo-400 text-xs">✏️ edit</td>
                </tr>
              ),
            )}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-400">
                  No test cases match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Add Test Case" onClose={() => setShowAdd(false)}>
          <Field label="Title">
            <Inp
              value={addForm.title}
              onChange={(event) => setAddForm({ ...addForm, title: event.target.value })}
              placeholder="Test case title"
            />
          </Field>
          <Field label="Module">
            <Sel options={config.modules} value={addForm.module} onChange={(event) => setAddForm({ ...addForm, module: event.target.value })} />
          </Field>
          <Field label="User Story">
            <Sel options={config.stories} value={addForm.story} onChange={(event) => setAddForm({ ...addForm, story: event.target.value })} />
          </Field>
          <Field label="Sprint">
            <Sel options={config.sprints} value={addForm.sprint} onChange={(event) => setAddForm({ ...addForm, sprint: event.target.value })} />
          </Field>
          <Field label="Status">
            <Sel options={STATUSES} value={addForm.status} onChange={(event) => setAddForm({ ...addForm, status: event.target.value as typeof addForm.status })} />
          </Field>
          <Field label="Assignee">
            <Inp value={addForm.assignee} onChange={(event) => setAddForm({ ...addForm, assignee: event.target.value })} />
          </Field>
          <Field label="Date">
            <Inp type="date" value={addForm.date} onChange={(event) => setAddForm({ ...addForm, date: event.target.value })} />
          </Field>
          <div className="flex gap-2 mt-4">
            <button onClick={saveAdd} className="flex-1 bg-indigo-600 text-white font-semibold py-2 rounded-lg">
              Add
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
