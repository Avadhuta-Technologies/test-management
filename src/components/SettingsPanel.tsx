import { useState, useEffect } from "react";
import type { Project, ClickUpConfig } from "../types";
import { updateProjectConfig, updateProjectMeta, fetchClickUpConfig, saveClickUpConfig, deleteClickUpConfig } from "../db";
import { fetchWorkspaces, fetchSpaces, fetchLists } from "../clickup";
import type { ClickUpTeam, ClickUpSpace, ClickUpList } from "../clickup";
import { Field, Inp, Modal, SectionTitle } from "./ui";

type SettingsPanelProps = { project: Project; onUpdate: (project: Project) => void };
type ConfigKey = keyof Project["config"];
type SectionConfig = { key: ConfigKey; label: string; icon: string; hint: string };

// ── ClickUp Section ────────────────────────────────────────────────────────

function ClickUpSection({ projectId }: { projectId: string }) {
  const [config, setConfig] = useState<ClickUpConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [token, setToken] = useState("");
  const [teams, setTeams] = useState<ClickUpTeam[]>([]);
  const [spaces, setSpaces] = useState<ClickUpSpace[]>([]);
  const [lists, setLists] = useState<ClickUpList[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<ClickUpTeam | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<ClickUpSpace | null>(null);
  const [selectedList, setSelectedList] = useState<ClickUpList | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchClickUpConfig(projectId)
      .then(setConfig)
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  const verify = async () => {
    setError("");
    if (!token.trim()) { setError("Paste your ClickUp Personal API Token first."); return; }
    setVerifying(true);
    try {
      const ws = await fetchWorkspaces(token.trim());
      setTeams(ws);
      setSelectedTeam(ws[0] ?? null);
      if (ws[0]) {
        const sp = await fetchSpaces(token.trim(), ws[0].id);
        setSpaces(sp);
        setSelectedSpace(sp[0] ?? null);
        if (sp[0]) {
          const ls = await fetchLists(token.trim(), sp[0].id);
          setLists(ls);
          setSelectedList(ls[0] ?? null);
        }
      }
    } catch (e: any) {
      setError(e.message ?? "Verification failed. Check your token.");
      setTeams([]);
    } finally {
      setVerifying(false);
    }
  };

  const onTeamChange = async (teamId: string) => {
    const team = teams.find((t) => t.id === teamId) ?? null;
    setSelectedTeam(team);
    setSelectedSpace(null);
    setSelectedList(null);
    setSpaces([]);
    setLists([]);
    if (team) {
      const sp = await fetchSpaces(token.trim(), team.id);
      setSpaces(sp);
      setSelectedSpace(sp[0] ?? null);
      if (sp[0]) {
        const ls = await fetchLists(token.trim(), sp[0].id);
        setLists(ls);
        setSelectedList(ls[0] ?? null);
      }
    }
  };

  const onSpaceChange = async (spaceId: string) => {
    const space = spaces.find((s) => s.id === spaceId) ?? null;
    setSelectedSpace(space);
    setSelectedList(null);
    setLists([]);
    if (space) {
      const ls = await fetchLists(token.trim(), space.id);
      setLists(ls);
      setSelectedList(ls[0] ?? null);
    }
  };

  const save = async () => {
    if (!selectedTeam || !selectedList) { setError("Select a workspace and list."); return; }
    setSaving(true);
    try {
      const cfg: ClickUpConfig = {
        projectId,
        apiToken: token.trim(),
        teamId: selectedTeam.id,
        teamName: selectedTeam.name,
        listId: selectedList.id,
        listName: selectedList.name,
      };
      await saveClickUpConfig(cfg);
      setConfig(cfg);
      setEditing(false);
      setToken("");
    } catch (e: any) {
      setError(e.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await deleteClickUpConfig(projectId);
      setConfig(null);
      setTeams([]);
      setSpaces([]);
      setLists([]);
      setToken("");
    } catch (e: any) {
      setError(e.message ?? "Disconnect failed.");
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mt-4">
      <p className="text-sm font-bold text-gray-700 mb-1">🔗 ClickUp Integration</p>
      <p className="text-xs text-gray-400">Loading…</p>
    </div>
  );

  // Connected state
  if (config && !editing) return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-gray-700">🔗 ClickUp Integration</p>
        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">● Connected</span>
      </div>
      <p className="text-xs text-gray-500 mb-1">Workspace: <span className="font-semibold text-gray-700">{config.teamName}</span></p>
      <p className="text-xs text-gray-500 mb-3">Target List: <span className="font-semibold text-gray-700">{config.listName}</span></p>
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="text-xs text-indigo-600 font-semibold hover:underline">Change</button>
        <button onClick={disconnect} disabled={disconnecting} className="text-xs text-red-400 font-semibold hover:underline disabled:opacity-50">
          {disconnecting ? "Disconnecting…" : "Disconnect"}
        </button>
      </div>
    </div>
  );

  // Setup / edit form
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-700">🔗 ClickUp Integration</p>
        {editing && <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-gray-600">✕ Cancel</button>}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Connect this project to a ClickUp list so bugs can be pushed as tasks.{" "}
        Get your token from <span className="font-semibold text-indigo-600">ClickUp → Settings → Apps → API Token</span>.
      </p>

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <Field label="Personal API Token">
        <div className="flex gap-2">
          <input
            type="password"
            value={token}
            onChange={(e) => { setToken(e.target.value); setTeams([]); setSpaces([]); setLists([]); setSelectedTeam(null); setSelectedSpace(null); setSelectedList(null); }}
            placeholder="pk_xxxxxxxxxxxxxxx"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button onClick={verify} disabled={verifying} className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
            {verifying ? "Verifying…" : "Verify"}
          </button>
        </div>
      </Field>

      {teams.length > 0 && (
        <Field label="Workspace">
          <select value={selectedTeam?.id ?? ""} onChange={(e) => onTeamChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300">
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
      )}

      {spaces.length > 0 && (
        <Field label="Space">
          <select value={selectedSpace?.id ?? ""} onChange={(e) => onSpaceChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300">
            {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
      )}

      {lists.length > 0 && (
        <Field label="Target List (bugs will be pushed here)">
          <select value={selectedList?.id ?? ""} onChange={(e) => setSelectedList(lists.find((l) => l.id === e.target.value) ?? null)} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300">
            {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </Field>
      )}

      {lists.length > 0 && selectedList && (
        <button onClick={save} disabled={saving} className="mt-2 w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg disabled:opacity-50">
          {saving ? "Saving…" : "Save Connection"}
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function SettingsPanel({ project, onUpdate }: SettingsPanelProps) {
  const { config, releaseDate } = project;
  const [vals, setVals] = useState<Record<ConfigKey, string>>({ modules: "", sprints: "", stories: "", devs: "", releases: "" });
  const [rd, setRd] = useState(releaseDate || "");
  const [confirmDel, setConfirmDel] = useState<{ key: ConfigKey; val: string } | null>(null);

  const sections: SectionConfig[] = [
    { key: "modules", label: "Modules", icon: "📦", hint: "e.g. Checkout" },
    { key: "sprints", label: "Sprints", icon: "🏃", hint: "e.g. Sprint 5" },
    // { key: "stories", label: "User Stories", icon: "📖", hint: "e.g. US-006" },
    { key: "devs", label: "Dev Engineers", icon: "👨‍💻", hint: "e.g. Dev - Priya" },
    { key: "releases", label: "Releases", icon: "🚀", hint: "e.g. R3 - May 1" },
  ];

  const addValue = async (key: ConfigKey) => {
    const value = vals[key].trim();
    if (!value || config[key].includes(value)) return;
    const newConfig = { ...config, [key]: [...config[key], value] };
    await updateProjectConfig(project.id, newConfig);
    onUpdate({ ...project, config: newConfig });
    setVals((prev) => ({ ...prev, [key]: "" }));
  };

  const removeValue = async (key: ConfigKey, value: string) => {
    const newConfig = { ...config, [key]: config[key].filter((item) => item !== value) };
    await updateProjectConfig(project.id, newConfig);
    onUpdate({ ...project, config: newConfig });
    setConfirmDel(null);
  };

  const saveReleaseDate = async () => {
    await updateProjectMeta(project.id, { releaseDate: rd });
    onUpdate({ ...project, releaseDate: rd });
  };

  return (
    <div>
      <SectionTitle>⚙️ Project Settings</SectionTitle>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
        <p className="text-sm font-bold text-gray-700 mb-2">📅 Target Release Date</p>
        <div className="flex gap-2 items-center">
          <Inp type="date" value={rd} onChange={(e) => setRd(e.target.value)} onKeyDown={(e) => e.preventDefault()} style={{ maxWidth: 200 }} />
          <button onClick={saveReleaseDate} className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-lg">Save</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div key={section.key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-700 mb-3">{section.icon} {section.label}</p>
            <div className="flex flex-wrap gap-2 mb-3 min-h-8">
              {config[section.key].map((value) => (
                <span key={value} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {value}
                  <button onClick={() => setConfirmDel({ key: section.key, val: value })} className="ml-1 text-indigo-300 hover:text-red-500 font-bold">×</button>
                </span>
              ))}
              {config[section.key].length === 0 && <span className="text-xs text-gray-300 italic">No values yet</span>}
            </div>
            <div className="flex gap-2">
              <input
                value={vals[section.key]}
                onChange={(e) => setVals((prev) => ({ ...prev, [section.key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addValue(section.key)}
                placeholder={section.hint}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button onClick={() => addValue(section.key)} className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Add</button>
            </div>
          </div>
        ))}
      </div>

      <ClickUpSection projectId={project.id} />

      {confirmDel && (
        <Modal title="Remove Value?" onClose={() => setConfirmDel(null)}>
          <p className="text-sm text-gray-600 mb-1">Remove <strong>"{confirmDel.val}"</strong>?</p>
          <p className="text-xs text-orange-500 mb-4">Existing records won't be affected.</p>
          <div className="flex gap-2">
            <button onClick={() => removeValue(confirmDel.key, confirmDel.val)} className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-lg">Remove</button>
            <button onClick={() => setConfirmDel(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
