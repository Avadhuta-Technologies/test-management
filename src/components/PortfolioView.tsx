import type { Project } from "../types";
import { ChartCard, KPICard, SectionTitle } from "./ui";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type PortfolioViewProps = { projects: Project[] };

export function PortfolioView({ projects }: PortfolioViewProps) {
  const stats = projects.map((project) => {
    const total = project.cases.length;
    const passed = project.cases.filter((c) => c.status === "Pass").length;
    const executed = project.cases.filter((c) => ["Pass", "Fail", "Retest", "Skipped"].includes(c.status)).length;
    const passRate = executed ? Math.round((passed / executed) * 100) : 0;
    const openBugs = project.bugs.filter((b) => b.status !== "Closed").length;
    const criticalOpen = project.bugs.filter((b) => b.severity === "Critical" && b.status !== "Closed").length;
    const reopenRate = project.bugs.length ? Math.round((project.bugs.filter((b) => b.reopened).length / project.bugs.length) * 100) : 0;
    const go = passRate >= 80 && criticalOpen === 0 && reopenRate <= 20;
    const daysLeft = project.releaseDate ? Math.max(0, Math.ceil((new Date(project.releaseDate).getTime() - new Date().getTime()) / 86400000)) : null;
    return { name: project.name, color: project.color, total, passRate, openBugs, criticalOpen, go, executed, daysLeft };
  });

  const totalCases = stats.reduce((sum, item) => sum + item.total, 0);
  const totalBugs = projects.reduce((sum, project) => sum + project.bugs.length, 0);
  const avgPass = stats.length ? Math.round(stats.reduce((sum, item) => sum + item.passRate, 0) / stats.length) : 0;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <SectionTitle>🌐 Portfolio Overview</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KPICard label="Projects" value={projects.length} icon="📁" />
        <KPICard label="Total Cases" value={totalCases} icon="📋" />
        <KPICard label="Total Bugs" value={totalBugs} color="text-red-600" icon="🐛" />
        <KPICard label="Avg Pass" value={`${avgPass}%`} color={avgPass >= 80 ? "text-green-600" : "text-red-600"} icon="✅" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {stats.map((item) => (
          <div key={item.name} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
              <span className="font-bold text-gray-800">{item.name}</span>
              {item.daysLeft !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${item.daysLeft <= 3 ? "bg-red-100 text-red-600" : item.daysLeft <= 7 ? "bg-orange-100 text-orange-600" : "bg-blue-50 text-blue-600"}`}>
                  ⏳ {item.daysLeft}d left
                </span>
              )}
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${item.go ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {item.go ? "✅ GO" : "🚫 NO-GO"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div>
                <p className="text-xs text-gray-600">Cases</p>
                <p className="font-bold text-gray-800">{item.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Pass Rate</p>
                <p className={`font-bold ${item.passRate >= 80 ? "text-green-600" : "text-red-600"}`}>{item.passRate}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Open Bugs</p>
                <p className={`font-bold ${item.openBugs > 0 ? "text-red-600" : "text-green-600"}`}>{item.openBugs}</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-2 rounded-full" style={{ width: `${item.total ? Math.round((item.executed / item.total) * 100) : 0}%`, background: item.color }} />
            </div>
            <p className="text-xs text-gray-600 mt-1">{item.total ? Math.round((item.executed / item.total) * 100) : 0}% executed</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="Pass Rate by Project">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.map((item) => ({ name: item.name, "Pass Rate": item.passRate }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="Pass Rate" radius={[4, 4, 0, 0]}>
                {stats.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Open Bugs by Project">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.map((item) => ({ name: item.name, "Open Bugs": item.openBugs }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="Open Bugs" radius={[4, 4, 0, 0]}>
                {stats.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
