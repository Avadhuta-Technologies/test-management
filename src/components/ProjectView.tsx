import { useState } from "react";
import type { Project } from "../types";
import { NavTab } from "./ui";
import { BugsTable } from "./BugsTable";
import { CasesTable } from "./CasesTable";
import { KPIPanel } from "./KPIPanel";
import { ReleaseTracker } from "./ReleaseTracker";
import { SettingsPanel } from "./SettingsPanel";

type ProjectViewProps = { project: Project; onUpdate: (project: Project) => void };

export function ProjectView({ project, onUpdate }: ProjectViewProps) {
  const [tab, setTab] = useState<"progress" | "cases" | "bugs" | "kpi" | "settings">("progress");
  const tabs = [
    ["progress", "📅 Progress", undefined] as const,
    ["cases", "Test Cases", project.cases.length] as const,
    ["bugs", "Bugs", project.bugs.length] as const,
    ["kpi", "KPIs", undefined] as const,
    ["settings", "⚙️ Settings", undefined] as const,
  ] as const;

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
        {tab === "cases" && <CasesTable project={project} onUpdate={onUpdate} />}
        {tab === "bugs" && <BugsTable project={project} onUpdate={onUpdate} />}
        {tab === "kpi" && <KPIPanel project={project} />}
        {tab === "settings" && <SettingsPanel project={project} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}
