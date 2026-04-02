import type { Project, Status } from "../types";
import { STATUS_COLORS, STATUSES } from "../types";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard, KPICard, SectionTitle } from "./ui";

type ReleaseTrackerProps = { project: Project };

export function ReleaseTracker({ project }: ReleaseTrackerProps) {
  const { cases, bugs, releaseDate } = project;
  const today = new Date();
  const release = new Date(releaseDate);
  const startDate = new Date(Math.min(...cases.map((c) => new Date(c.date).getTime()), today.getTime() - 14 * 86400000));
  const totalDays = Math.max(1, Math.ceil((release.getTime() - startDate.getTime()) / 86400000));
  const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / 86400000));
  const daysLeft = Math.max(0, Math.ceil((release.getTime() - today.getTime()) / 86400000));
  const timeProgress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
  const total = cases.length;
  const executed = cases.filter((c) => ["Pass", "Fail", "Retest", "Skipped"].includes(c.status)).length;
  const passed = cases.filter((c) => c.status === "Pass").length;
  const execPct = total ? Math.round((executed / total) * 100) : 0;
  const passRate = executed ? Math.round((passed / executed) * 100) : 0;
  const openBugs = bugs.filter((b) => b.status !== "Closed").length;
  const criticalOpen = bugs.filter((b) => b.severity === "Critical" && b.status !== "Closed").length;

  const dateMap: Record<string, { date: string; Pass: number; Fail: number; Blocked: number; "Not Run": number; Retest: number; Total: number }> = {};
  cases.forEach((c) => {
    if (!c.date) return;
    const d = c.date;
    if (!dateMap[d]) {
      dateMap[d] = { date: d, Pass: 0, Fail: 0, Blocked: 0, "Not Run": 0, Retest: 0, Total: 0 };
    }
    dateMap[d][c.status as Status] += 1;
    dateMap[d].Total += 1;
  });

  const dailyData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  let cumPass = 0;
  let cumExec = 0;
  const cumulData = dailyData.map((d) => {
    cumPass += d.Pass;
    cumExec += d.Total;
    return {
      date: d.date.slice(5),
      CumPass: cumPass,
      CumExec: cumExec,
      PassRate: cumExec ? Math.round((cumPass / cumExec) * 100) : 0,
    };
  });

  const idealPerDay = totalDays > 0 ? total / totalDays : 0;
  const burnData = dailyData.map((d, index) => ({
    date: d.date.slice(5),
    Actual: cases.filter((c) => c.date <= d.date && ["Pass", "Fail", "Retest", "Skipped"].includes(c.status)).length,
    Ideal: Math.round(idealPerDay * (index + 1)),
  }));

  const onTrack = execPct >= timeProgress - 5;

  return (
    <div>
      <SectionTitle>📅 Release Progress Tracker</SectionTitle>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <p className="text-xs text-gray-600 font-medium">Target Release Date</p>
            <p className="text-xl font-bold text-gray-800">
              {releaseDate} <span className="text-sm font-normal text-gray-600">({daysLeft} days left)</span>
            </p>
          </div>
          <span className={`text-sm font-bold px-4 py-2 rounded-xl ${onTrack ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {onTrack ? "✅ On Track" : "⚠️ Behind Schedule"}
          </span>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>⏱ Time Elapsed</span>
            <span>{timeProgress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-3 bg-blue-400 rounded-full transition-all" style={{ width: `${timeProgress}%` }} />
          </div>
        </div>

        <div className="mb-1">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>✅ Test Execution</span>
            <span>{execPct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            {STATUSES.filter((s) => s !== "Not Run").map((status) => {
              const count = cases.filter((c) => c.status === status).length;
              const pct = total ? (count / total) * 100 : 0;
              return (
                pct > 0 && (
                  <div key={status} style={{ width: `${pct}%`, background: STATUS_COLORS[status] }} className="h-3" title={`${status}: ${Math.round(pct)}%`} />
                )
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
          <span>📋 {total} total</span>
          <span className="text-green-600 font-semibold">✓ {passed} passed</span>
          <span className="text-red-500 font-semibold">✗ {cases.filter((c) => c.status === "Fail").length} failed</span>
          <span className="text-orange-500 font-semibold">⊘ {cases.filter((c) => c.status === "Blocked").length} blocked</span>
          <span className="text-gray-600">— {cases.filter((c) => c.status === "Not Run").length} not run</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <KPICard label="Pass Rate" value={`${passRate}%`} color={passRate >= 80 ? "text-green-600" : "text-red-600"} icon="✅" />
        <KPICard label="Days Left" value={daysLeft} color={daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-orange-500" : "text-blue-600"} icon="📅" />
        <KPICard label="Open Bugs" value={openBugs} color={openBugs > 0 ? "text-red-600" : "text-green-600"} icon="🐛" />
        <KPICard label="Critical Open" value={criticalOpen} color={criticalOpen > 0 ? "text-red-600" : "text-green-600"} icon="🚨" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="Daily Execution (by date)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Pass" stackId="a" fill="#86efac" />
              <Bar dataKey="Fail" stackId="a" fill="#fca5a5" />
              <Bar dataKey="Blocked" stackId="a" fill="#fdba74" />
              <Bar dataKey="Retest" stackId="a" fill="#c4b5fd" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Actual vs Ideal Burn">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={burnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="Ideal" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Ideal" />
              <Line type="monotone" dataKey="Actual" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cumulative Pass Rate Trend" full>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={cumulData}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Target 80%", fontSize: 10, fill: "#ef4444" }} />
              <Area type="monotone" dataKey="PassRate" stroke="#22c55e" fill="url(#pg)" strokeWidth={2} name="Pass Rate %" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p className="text-sm font-bold text-gray-700 mb-3">🚦 Release Readiness</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { label: "Pass Rate", val: `${passRate}%`, ok: passRate >= 80, t: "≥80%" },
            { label: "Execution", val: `${execPct}%`, ok: execPct >= 90, t: "≥90%" },
            { label: "Critical Open", val: criticalOpen, ok: criticalOpen === 0, t: "=0" },
            { label: "On Track", val: onTrack ? "Yes" : "No", ok: onTrack, t: "Yes" },
          ].map((metric) => (
            <div key={metric.label} className={`rounded-xl p-3 flex items-center gap-2 ${metric.ok ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <span>{metric.ok ? "✅" : "❌"}</span>
              <div>
                <p className="text-xs text-gray-600 font-semibold">{metric.label}</p>
                <p className={`text-base font-bold ${metric.ok ? "text-green-700" : "text-red-700"}`}>{metric.val}</p>
                <p className="text-xs text-gray-600">Target: {metric.t}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={`mt-3 p-3 rounded-xl text-sm font-bold text-center ${passRate >= 80 && execPct >= 90 && criticalOpen === 0 && onTrack ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {passRate >= 80 && execPct >= 90 && criticalOpen === 0 && onTrack ? "✅ GO FOR RELEASE" : "🚫 NOT READY FOR RELEASE"}
        </div>
      </div>
    </div>
  );
}
