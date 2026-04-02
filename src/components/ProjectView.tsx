import { useState, useEffect } from "react";
import type { Project, ClickUpConfig } from "../types";
import { fetchClickUpConfig } from "../db";
import { NavTab } from "./ui";
import { BugsTable } from "./BugsTable";
import { CasesTable } from "./CasesTable";
import { KPIPanel } from "./KPIPanel";
import { ReleaseTracker } from "./ReleaseTracker";
import { SettingsPanel } from "./SettingsPanel";

type ProjectViewProps = { project: Project; onUpdate: (project: Project) => void };

export function ProjectView({ project, onUpdate }: ProjectViewProps) {
  const [tab, setTab] = useState<"progress" | "cases" | "bugs" | "kpi" | "settings">("progress");
  const [clickUpConfig, setClickUpConfig] = useState<ClickUpConfig | null>(null);

  useEffect(() => {
    fetchClickUpConfig(project.id)
      .then(setClickUpConfig)
      .catch(() => setClickUpConfig(null));
  }, [project.id]);

  // Refresh ClickUp config when returning to bugs tab or after settings save
  const handleUpdate = (updated: Project) => {
    onUpdate(updated);
  };

  const onSettingsUpdate = (updated: Project) => {
    onUpdate(updated);
    // Re-fetch ClickUp config in case it was changed in Settings
    fetchClickUpConfig(updated.id)
      .then(setClickUpConfig)
      .catch(() => setClickUpConfig(null));
  };

  return (
    <div>
      <div className="bg-white border-b px-4 flex gap-1 overflow-x-auto">
        {([
          ["progress", "📅 Progress", undefined],
          ["cases", "Test Cases", project.cases.length],
          ["bugs", "Bugs", project.bugs.length],
          ["kpi", "KPIs", undefined],
          ["settings", "⚙️ Settings", undefined],
        ] as const).map(([id, label, count]) => (
          <NavTab key={id} label={String(label)} active={tab === id} onClick={() => setTab(id)} count={typeof count === "number" ? count : undefined} />
        ))}
      </div>
      <div className="p-4 max-w-6xl mx-auto">
        {tab === "progress" && <ReleaseTracker project={project} />}
        {tab === "cases" && <CasesTable project={project} onUpdate={handleUpdate} clickUpConfig={clickUpConfig} />}
        {tab === "bugs" && <BugsTable project={project} onUpdate={handleUpdate} clickUpConfig={clickUpConfig} />}
        {tab === "kpi" && <KPIPanel project={project} />}
        {tab === "settings" && <SettingsPanel project={project} onUpdate={onSettingsUpdate} />}
      </div>
    </div>
  );
}
