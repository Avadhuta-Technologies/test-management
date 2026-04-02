import { useState, useEffect } from "react";
import { PROJECT_COLORS, Project } from "./types";
import { fetchProjects, createProject, deleteProject } from "./db";
import { Field, Inp, Modal, NavTab } from "./components/ui";
import { PortfolioView } from "./components/PortfolioView";
import { ProjectView } from "./components/ProjectView";
import { useAuth, signInWithGitHub, signOut } from "./useAuth";

type NewProjectForm = { name: string; description: string; color: string; releaseDate: string };

export default function App() {
  const auth = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProj, setActiveProj] = useState<string | null>(null);
  const [showNewProj, setShowNewProj] = useState(false);
  const [showDelConfirm, setShowDelConfirm] = useState<string | null>(null);
  const [newProj, setNewProj] = useState<NewProjectForm>({ name: "", description: "", color: PROJECT_COLORS[2], releaseDate: "" });

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    fetchProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, [auth.status]);

  // ── auth screens ──────────────────────────────────────────────────────────
  if (auth.status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-sm animate-pulse">Checking auth…</div>
      </div>
    );
  }

  if (auth.status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 flex flex-col items-center gap-5 w-full max-w-sm">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">at</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Avadhuta Technologies</h1>
            <p className="text-sm text-gray-600 mt-1">Sign in with your GitHub account</p>
          </div>
          <button
            onClick={signInWithGitHub}
            className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white font-semibold py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
          <p className="text-xs text-gray-600">Access restricted to Avadhuta Technologies members</p>
        </div>
      </div>
    );
  }

  if (auth.status === "unauthorized") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 flex flex-col items-center gap-4 w-full max-w-sm text-center">
          <span className="text-4xl">🚫</span>
          <h2 className="text-lg font-bold text-gray-800">Access Denied</h2>
          <p className="text-sm text-gray-700">
            <strong>{auth.login}</strong> is not a member of the <strong>Avadhuta-Technologies</strong> GitHub organisation.
          </p>
          <button onClick={signOut} className="mt-2 text-sm text-indigo-600 hover:underline">Sign out</button>
        </div>
      </div>
    );
  }

  // ── main app (authenticated) ──────────────────────────────────────────────

  const handleCreateProject = async () => {
    if (!newProj.name.trim()) return;
    const created = await createProject(newProj);
    setProjects((prev) => [...prev, created]);
    setNewProj({ name: "", description: "", color: PROJECT_COLORS[2], releaseDate: "" });
    setShowNewProj(false);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setActiveProj(null);
    setShowDelConfirm(null);
  };

  const updateProject = (updated: Project) =>
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const currentProj = projects.find((p) => p.id === activeProj);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-sm animate-pulse">Loading projects…</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-indigo-700 text-white px-4 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveProj(null)} className="font-bold text-lg hover:text-indigo-200">
            Avadhuta Technologies
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
        <div className="flex items-center gap-2">
          {currentProj && (
            <button onClick={() => setShowDelConfirm(currentProj.id)} className="text-red-300 hover:text-red-200 text-xs font-semibold px-2 py-1 rounded border border-red-400">
              Delete
            </button>
          )}
          <button onClick={() => setShowNewProj(true)} className="bg-white text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg">
            + New Project
          </button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-indigo-500">
            {auth.avatarUrl && <img src={auth.avatarUrl} alt={auth.login} className="w-7 h-7 rounded-full" />}
            <span className="text-xs text-indigo-200 hidden sm:block">{auth.login}</span>
            <button onClick={signOut} className="text-xs text-indigo-300 hover:text-white">Sign out</button>
          </div>
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
            <span className="ml-1 bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">{project.cases.length}tc</span>
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
            <Inp value={newProj.name} onChange={(e) => setNewProj({ ...newProj, name: e.target.value })} placeholder="e.g. PayFlow" />
          </Field>
          <Field label="Description">
            <Inp value={newProj.description} onChange={(e) => setNewProj({ ...newProj, description: e.target.value })} placeholder="Brief description" />
          </Field>
          <Field label="Target Release Date">
            <Inp type="date" value={newProj.releaseDate} onChange={(e) => setNewProj({ ...newProj, releaseDate: e.target.value })} />
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
            <button onClick={handleCreateProject} className="flex-1 bg-indigo-600 text-white font-semibold py-2 rounded-lg">
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
          <p className="text-sm text-gray-600 mb-1">Permanently delete <strong>{projects.find((p) => p.id === showDelConfirm)?.name}</strong>?</p>
          <p className="text-xs text-red-500 mb-4">This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => handleDeleteProject(showDelConfirm)} className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-lg">
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
