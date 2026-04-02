import { useState, useEffect } from "react";
import { INIT_PROJECTS } from "./data";
import { PROJECT_COLORS, Project } from "./types";
import { supabase } from "./supabase";
import { Field, Inp, Modal, NavTab } from "./components/ui";
import { PortfolioView } from "./components/PortfolioView";
import { ProjectView } from "./components/ProjectView";

type NewProjectForm = { name: string; description: string; color: string; releaseDate: string };

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    supabase
      .from("projects")
      .select("*, cases:test_cases(*), bugs(*)")
      .then(({ data, error }) => {
        if (error || !data?.length) {
          setProjects(INIT_PROJECTS);
        } else {
          setProjects(data as Project[]);
        }
      });
  }, []);
  const [activeProj, setActiveProj] = useState<string | null>(null);
  const [showNewProj, setShowNewProj] = useState(false);
  const [showDelConfirm, setShowDelConfirm] = useState<string | null>(null);
  const [newProj, setNewProj] = useState<NewProjectForm>({ name: "", description: "", color: PROJECT_COLORS[2], releaseDate: "" });

  const updateProject = (updated: Project) => setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));

  const createProject = () => {
    if (!newProj.name.trim()) return;
    setProjects((prev) => [
      ...prev,
      {
        id: `proj-${Date.now()}`,
        name: newProj.name.trim(),
        description: newProj.description,
        color: newProj.color,
        releaseDate: newProj.releaseDate,
        createdAt: new Date().toISOString().split("T")[0],
        config: { modules: [], sprints: [], stories: [], devs: [], releases: [] },
        cases: [],
        bugs: [],
      },
    ]);
    setNewProj({ name: "", description: "", color: PROJECT_COLORS[2], releaseDate: "" });
    setShowNewProj(false);
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
    setActiveProj(null);
    setShowDelConfirm(null);
  };

  const currentProj = projects.find((project) => project.id === activeProj);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-indigo-700 text-white px-4 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveProj(null)} className="font-bold text-lg hover:text-indigo-200">
            QualifyMe
          </button>
          {currentProj && (
            <>
              <span className="text-indigo-400">›</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: currentProj.color }} />
                <span className="font-semibold">{currentProj.name}</span>
              </span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {currentProj && (
            <button onClick={() => setShowDelConfirm(currentProj.id)} className="text-red-300 hover:text-red-200 text-xs font-semibold px-2 py-1 rounded border border-red-400">
              Delete
            </button>
          )}
          <button onClick={() => setShowNewProj(true)} className="bg-white text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg">
            + New Project
          </button>
        </div>
      </div>

      <div className="bg-white border-b px-4 flex gap-1 overflow-x-auto">
        <NavTab label="🌐 All Projects" active={!activeProj} onClick={() => setActiveProj(null)} />
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setActiveProj(project.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${activeProj === project.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: project.color }} />
            {project.name}
            <span className="ml-1 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">{project.cases.length}tc</span>
          </button>
        ))}
      </div>

      {!activeProj ? (
        <PortfolioView projects={projects} />
      ) : (
        currentProj && <ProjectView key={currentProj.id} project={currentProj} onUpdate={updateProject} />
      )}

      {showNewProj && (
        <Modal title="Create New Project" onClose={() => setShowNewProj(false)}>
          <Field label="Project Name">
            <Inp value={newProj.name} onChange={(event) => setNewProj({ ...newProj, name: event.target.value })} placeholder="e.g. PayFlow" />
          </Field>
          <Field label="Description">
            <Inp value={newProj.description} onChange={(event) => setNewProj({ ...newProj, description: event.target.value })} placeholder="Brief description" />
          </Field>
          <Field label="Target Release Date">
            <Inp type="date" value={newProj.releaseDate} onChange={(event) => setNewProj({ ...newProj, releaseDate: event.target.value })} />
          </Field>
          <Field label="Project Color">
            <div className="flex gap-2 mt-1">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewProj({ ...newProj, color })}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${newProj.color === color ? "border-gray-800 scale-110" : "border-transparent"}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </Field>
          <div className="flex gap-2 mt-4">
            <button onClick={createProject} className="flex-1 bg-indigo-600 text-white font-semibold py-2 rounded-lg">
              Create
            </button>
            <button onClick={() => setShowNewProj(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {showDelConfirm && (
        <Modal title="Delete Project?" onClose={() => setShowDelConfirm(null)}>
          <p className="text-sm text-gray-600 mb-1">Permanently delete <strong>{projects.find((project) => project.id === showDelConfirm)?.name}</strong>?</p>
          <p className="text-xs text-red-500 mb-4">This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => deleteProject(showDelConfirm)} className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-lg">
              Delete
            </button>
            <button onClick={() => setShowDelConfirm(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
