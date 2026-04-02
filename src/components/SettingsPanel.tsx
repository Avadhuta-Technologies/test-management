import { useState } from "react";
import type { Project } from "../types";
import { Field, Inp, Modal, SectionTitle } from "./ui";

type SettingsPanelProps = { project: Project; onUpdate: (project: Project) => void };

type ConfigKey = keyof Project["config"];

type SectionConfig = { key: ConfigKey; label: string; icon: string; hint: string };

export function SettingsPanel({ project, onUpdate }: SettingsPanelProps) {
  const { config, releaseDate } = project;
  const [vals, setVals] = useState<Record<ConfigKey, string>>({ modules: "", sprints: "", stories: "", devs: "", releases: "" });
  const [rd, setRd] = useState(releaseDate || "");
  const [confirmDel, setConfirmDel] = useState<{ key: ConfigKey; val: string } | null>(null);

  const sections: SectionConfig[] = [
    { key: "modules", label: "Modules", icon: "📦", hint: "e.g. Checkout" },
    { key: "sprints", label: "Sprints", icon: "🏃", hint: "e.g. Sprint 5" },
    { key: "stories", label: "User Stories", icon: "📖", hint: "e.g. US-006" },
    { key: "devs", label: "Dev Engineers", icon: "👨‍💻", hint: "e.g. Dev - Priya" },
    { key: "releases", label: "Releases", icon: "🚀", hint: "e.g. R3 - May 1" },
  ];

  const addValue = (key: ConfigKey) => {
    const value = vals[key].trim();
    if (!value || config[key].includes(value)) return;
    onUpdate({ ...project, config: { ...config, [key]: [...config[key], value] } });
    setVals((prev) => ({ ...prev, [key]: "" }));
  };

  const removeValue = (key: ConfigKey, value: string) => {
    onUpdate({ ...project, config: { ...config, [key]: config[key].filter((item) => item !== value) } });
    setConfirmDel(null);
  };

  return (
    <div>
      <SectionTitle>⚙️ Project Settings</SectionTitle>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
        <p className="text-sm font-bold text-gray-700 mb-2">📅 Target Release Date</p>
        <div className="flex gap-2 items-center">
          <Inp type="date" value={rd} onChange={(event) => setRd(event.target.value)} style={{ maxWidth: 200 }} />
          <button onClick={() => onUpdate({ ...project, releaseDate: rd })} className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-lg">
            Save
          </button>
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
                  <button onClick={() => setConfirmDel({ key: section.key, val: value })} className="ml-1 text-indigo-300 hover:text-red-500 font-bold">
                    ×
                  </button>
                </span>
              ))}
              {config[section.key].length === 0 && <span className="text-xs text-gray-300 italic">No values yet</span>}
            </div>
            <div className="flex gap-2">
              <input
                value={vals[section.key]}
                onChange={(event) => setVals((prev) => ({ ...prev, [section.key]: event.target.value }))}
                onKeyDown={(event) => event.key === "Enter" && addValue(section.key)}
                placeholder={section.hint}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button onClick={() => addValue(section.key)} className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmDel && (
        <Modal title="Remove Value?" onClose={() => setConfirmDel(null)}>
          <p className="text-sm text-gray-600 mb-1">Remove <strong>"{confirmDel.val}"</strong>?</p>
          <p className="text-xs text-orange-500 mb-4">Existing records won't be affected.</p>
          <div className="flex gap-2">
            <button onClick={() => removeValue(confirmDel.key, confirmDel.val)} className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-lg">
              Remove
            </button>
            <button onClick={() => setConfirmDel(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
