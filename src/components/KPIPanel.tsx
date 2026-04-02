import { useMemo, useState } from "react";
import type { Bug, Project, TestCase } from "../types";
import { ChartCard, KPICard, SectionTitle, Inp } from "./ui";
import { Radar, RadarChart, PolarAngleAxis, PolarGrid, ResponsiveContainer, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, Legend } from "recharts";

type KPIPanelProps = { project: Project };

function filterByDate<T extends { [key: string]: string }>(items: T[], dateKey: string, dateFrom: string, dateTo: string) {
  return items.filter((item) => {
    const date = item[dateKey];
    if (!date) return true;
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    return true;
  });
}

export function KPIPanel({ project }: KPIPanelProps) {
  const { cases, bugs, config } = project;
  const allPeople = ["All", "Test Engineer", ...config.devs];
  const [person, setPerson] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fCases = useMemo(() => {
    let list = filterByDate(cases, "date", dateFrom, dateTo);
    if (person !== "All") {
      if (person === "Test Engineer") {
        list = list.filter((item) => item.assignee === "Test Engineer");
      } else {
        list = [];
      }
    }
    return list;
  }, [cases, person, dateFrom, dateTo]);

  const fBugs = useMemo(() => {
    let list = filterByDate(bugs, "reportedDate", dateFrom, dateTo);
    if (person !== "All") {
      if (person === "Test Engineer") {
        list = list.filter((item) => item.reportedBy === "Test Engineer" || !item.reportedBy);
      } else {
        list = list.filter((item) => item.assignedDev === person);
      }
    }
    return list;
  }, [bugs, person, dateFrom, dateTo]);

  const total = fCases.length;
  const passed = fCases.filter((c) => c.status === "Pass").length;
  const executed = fCases.filter((c) => ["Pass", "Fail", "Retest", "Skipped"].includes(c.status)).length;
  const passRate = executed ? Math.round((passed / executed) * 100) : 0;
  const blocked = fCases.filter((c) => c.status === "Blocked").length;
  const blockedPct = total ? Math.round((blocked / total) * 100) : 0;
  const closedBugs = fBugs.filter((b) => b.closedDate);
  const avgFix = closedBugs.length
    ? Math.round(
        closedBugs.reduce((sum, bug) => sum + (new Date(bug.closedDate).getTime() - new Date(bug.reportedDate).getTime()) / 86400000, 0) / closedBugs.length,
      )
    : 0;
  const reopenRate = fBugs.length ? Math.round((fBugs.filter((b) => b.reopened).length / fBugs.length) * 100) : 0;
  const openBugs = fBugs.filter((b) => b.status !== "Closed").length;
  const criticalOpen = fBugs.filter((b) => b.severity === "Critical" && b.status !== "Closed").length;

  const isTE = person === "All" || person === "Test Engineer";
  const isDev = person === "All" || config.devs.includes(person);

  const devData = config.devs.map((dev) => ({
    name: dev.replace("Dev - ", ""),
    Open: filterByDate(bugs.filter((bug) => bug.assignedDev === dev), "reportedDate", dateFrom, dateTo).filter((bug) => bug.status !== "Closed").length,
    Closed: filterByDate(bugs.filter((bug) => bug.assignedDev === dev), "reportedDate", dateFrom, dateTo).filter((bug) => bug.status === "Closed").length,
    Reopened: filterByDate(bugs.filter((bug) => bug.assignedDev === dev), "reportedDate", dateFrom, dateTo).filter((bug) => bug.reopened).length,
  }));

  const sprintData = config.sprints.map((sprint) => ({
    sprint: sprint.replace("Sprint ", "S"),
    Pass: fCases.filter((c) => c.sprint === sprint && c.status === "Pass").length,
    Fail: fCases.filter((c) => c.sprint === sprint && c.status === "Fail").length,
    Blocked: fCases.filter((c) => c.sprint === sprint && c.status === "Blocked").length,
  }));

  const radarData = [
    { metric: "Pass Rate", val: passRate, target: 90 },
    { metric: "Detection", val: Math.min(100, fBugs.length * 15), target: 80 },
    { metric: "Coverage", val: total ? Math.round((executed / total) * 100) : 0, target: 95 },
    { metric: "Speed", val: 78, target: 85 },
    { metric: "Exec", val: total ? Math.round((executed / total) * 100) : 0, target: 90 },
  ];

  return (
    <div>
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">👤 Person</p>
          <select value={person} onChange={(event) => setPerson(event.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            {allPeople.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">📅 From</p>
          <Inp type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} style={{ width: 140 }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">📅 To</p>
          <Inp type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} style={{ width: 140 }} />
        </div>
        {(person !== "All" || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setPerson("All");
              setDateFrom("");
              setDateTo("");
            }}
            className="text-xs text-indigo-500 font-semibold mt-4 hover:underline"
          >
            Clear filters
          </button>
        )}
        <div className="ml-auto text-xs text-gray-400 mt-4">
          {person !== "All" && <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-semibold mr-2">{person}</span>}
          {dateFrom && dateTo && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{dateFrom} → {dateTo}</span>}
        </div>
      </div>

      {isTE && (
        <>
          <SectionTitle>🧪 Test Engineer KPIs</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <KPICard label="Executed" value={executed} sub={`of ${total}`} icon="▶️" />
            <KPICard label="Pass Rate" value={`${passRate}%`} color={passRate >= 80 ? "text-green-600" : "text-red-600"} icon="✅" sub="target: 80%" />
            <KPICard label="Bugs Found" value={fBugs.length} icon="🔍" />
            <KPICard label="Avg Fix TAT" value={`${avgFix}d`} color="text-purple-600" icon="⏱️" />
            <KPICard label="Blocked %" value={`${blockedPct}%`} color={blockedPct > 15 ? "text-orange-600" : "text-green-600"} icon="🚧" sub="target: <15%" />
            <KPICard label="Velocity" value={sprintData[sprintData.length - 1]?.Pass || 0} sub="passed last sprint" icon="🏃" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <ChartCard title="Execution Radar">
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <Radar name="Actual" dataKey="val" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                  <Radar name="Target" dataKey="target" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Execution by Sprint">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sprintData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Pass" stackId="a" fill="#86efac" />
                  <Bar dataKey="Fail" stackId="a" fill="#fca5a5" />
                  <Bar dataKey="Blocked" stackId="a" fill="#fdba74" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {isDev && (
        <>
          <SectionTitle>👨‍💻 Dev Engineer KPIs</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <KPICard label="Avg Fix Time" value={`${avgFix}d`} color="text-purple-600" icon="⚡" sub="target: ≤3d" />
            <KPICard label="Reopen Rate" value={`${reopenRate}%`} color={reopenRate > 20 ? "text-red-600" : "text-green-600"} icon="🔁" />
            <KPICard label="Fix Rate" value={fBugs.length ? `${Math.round((closedBugs.length / fBugs.length) * 100)}%` : "0%"} color="text-blue-600" icon="📈" />
            <KPICard label="Critical Open" value={criticalOpen} color={criticalOpen > 0 ? "text-red-600" : "text-green-600"} icon="🚨" />
            <KPICard label="Total Closed" value={closedBugs.length} color="text-green-600" icon="✅" />
            <KPICard label="Open Bugs" value={openBugs} color="text-red-600" icon="🐛" />
          </div>
          {person === "All" && (
            <ChartCard title="Bug Performance by Developer">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={devData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Open" fill="#fca5a5" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Closed" fill="#86efac" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Reopened" fill="#f9a8d4" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
}
