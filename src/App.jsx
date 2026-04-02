import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

const STATUSES     = ["Not Run","In Progress","Pass","Fail","Blocked","Skipped","Retest"];
const SEVERITIES   = ["Critical","Major","Minor","Trivial"];
const PRIORITIES   = ["P1 - Urgent","P2 - High","P3 - Medium","P4 - Low"];
const BUG_STATUSES = ["Open","In Progress","Retest","Closed","Reopened"];
const STATUS_COLORS = {"Not Run":"#e5e7eb","In Progress":"#93c5fd",Pass:"#86efac",Fail:"#fca5a5",Blocked:"#fdba74",Skipped:"#fde68a",Retest:"#c4b5fd"};
const CHART_COLORS  = ["#6366f1","#22c55e","#ef4444","#f97316","#a855f7","#06b6d4","#eab308"];
const PROJECT_COLORS = ["#6366f1","#06b6d4","#f97316","#a855f7","#22c55e"];

const INIT_PROJECTS = [
  {
    id:"proj-1", name:"QualifyMe", color:"#6366f1", description:"Candidate assessment platform", createdAt:"2024-01-01",
    releaseDate:"2024-04-15",
    config:{ modules:["Login","Dashboard","Registration","Profile","Settings","Reports"], sprints:["Sprint 1","Sprint 2","Sprint 3","Sprint 4"], stories:["US-001","US-002","US-003","US-004","US-005"], devs:["Dev - Arjun","Dev - Sara","Dev - Mike"], releases:["R1 - Mar 1","R1 - Mar 15","R2 - Apr 1","R2 - Apr 15"] },
    cases:[
      {id:"TC-001",title:"Login with valid credentials",module:"Login",story:"US-001",sprint:"Sprint 1",status:"Pass",assignee:"Test Engineer",date:"2024-03-01"},
      {id:"TC-002",title:"Login with invalid password",module:"Login",story:"US-001",sprint:"Sprint 1",status:"Pass",assignee:"Test Engineer",date:"2024-03-02"},
      {id:"TC-003",title:"Dashboard loads after login",module:"Dashboard",story:"US-002",sprint:"Sprint 1",status:"Fail",assignee:"Test Engineer",date:"2024-03-03"},
      {id:"TC-004",title:"User registration flow",module:"Registration",story:"US-003",sprint:"Sprint 2",status:"Pass",assignee:"Test Engineer",date:"2024-03-05"},
      {id:"TC-005",title:"Profile update saves correctly",module:"Profile",story:"US-004",sprint:"Sprint 2",status:"Blocked",assignee:"Test Engineer",date:"2024-03-06"},
      {id:"TC-006",title:"Settings page renders",module:"Settings",story:"US-002",sprint:"Sprint 2",status:"Retest",assignee:"Test Engineer",date:"2024-03-07"},
      {id:"TC-007",title:"Reports export as PDF",module:"Reports",story:"US-005",sprint:"Sprint 3",status:"Pass",assignee:"Test Engineer",date:"2024-03-08"},
      {id:"TC-008",title:"Password reset flow",module:"Login",story:"US-001",sprint:"Sprint 3",status:"Pass",assignee:"Test Engineer",date:"2024-03-09"},
      {id:"TC-009",title:"Dashboard widget click",module:"Dashboard",story:"US-002",sprint:"Sprint 3",status:"Fail",assignee:"Test Engineer",date:"2024-03-10"},
      {id:"TC-010",title:"Bulk user import",module:"Registration",story:"US-003",sprint:"Sprint 4",status:"Not Run",assignee:"Test Engineer",date:"2024-03-12"},
    ],
    bugs:[
      {id:"BUG-001",title:"Dashboard crashes on load",module:"Dashboard",linkedTC:"TC-003",severity:"Critical",priority:"P1 - Urgent",status:"Closed",assignedDev:"Dev - Arjun",reportedDate:"2024-03-03",closedDate:"2024-03-05",reopened:false,release:"R1 - Mar 15"},
      {id:"BUG-002",title:"Profile avatar not saving",module:"Profile",linkedTC:"TC-005",severity:"Major",priority:"P2 - High",status:"Reopened",assignedDev:"Dev - Sara",reportedDate:"2024-03-06",closedDate:"2024-03-08",reopened:true,release:"R1 - Mar 15"},
      {id:"BUG-003",title:"Settings tab freezes on Safari",module:"Settings",linkedTC:"TC-006",severity:"Major",priority:"P2 - High",status:"Retest",assignedDev:"Dev - Mike",reportedDate:"2024-03-07",closedDate:"",reopened:false,release:"R2 - Apr 1"},
      {id:"BUG-004",title:"PDF export missing headers",module:"Reports",linkedTC:"TC-007",severity:"Minor",priority:"P3 - Medium",status:"Open",assignedDev:"Dev - Arjun",reportedDate:"2024-03-08",closedDate:"",reopened:false,release:"R2 - Apr 1"},
      {id:"BUG-005",title:"Dashboard widget not clickable",module:"Dashboard",linkedTC:"TC-009",severity:"Critical",priority:"P1 - Urgent",status:"In Progress",assignedDev:"Dev - Sara",reportedDate:"2024-03-10",closedDate:"",reopened:false,release:"R2 - Apr 15"},
    ]
  },
  {
    id:"proj-2", name:"HireTrack", color:"#06b6d4", description:"Recruitment management system", createdAt:"2024-02-01",
    releaseDate:"2024-05-01",
    config:{ modules:["Jobs","Candidates","Interviews","Offers","Onboarding"], sprints:["Sprint 1","Sprint 2","Sprint 3"], stories:["US-101","US-102","US-103"], devs:["Dev - Priya","Dev - Tom"], releases:["R1 - Apr 1","R1 - Apr 15"] },
    cases:[
      {id:"TC-001",title:"Post a new job listing",module:"Jobs",story:"US-101",sprint:"Sprint 1",status:"Pass",assignee:"Test Engineer",date:"2024-04-01"},
      {id:"TC-002",title:"Filter candidates by skill",module:"Candidates",story:"US-102",sprint:"Sprint 1",status:"Fail",assignee:"Test Engineer",date:"2024-04-02"},
      {id:"TC-003",title:"Schedule interview slot",module:"Interviews",story:"US-103",sprint:"Sprint 2",status:"Pass",assignee:"Test Engineer",date:"2024-04-03"},
      {id:"TC-004",title:"Send offer letter",module:"Offers",story:"US-102",sprint:"Sprint 2",status:"Not Run",assignee:"Test Engineer",date:"2024-04-04"},
    ],
    bugs:[
      {id:"BUG-001",title:"Candidate filter returns empty results",module:"Candidates",linkedTC:"TC-002",severity:"Critical",priority:"P1 - Urgent",status:"Open",assignedDev:"Dev - Priya",reportedDate:"2024-04-02",closedDate:"",reopened:false,release:"R1 - Apr 1"},
      {id:"BUG-002",title:"Interview calendar overlaps slots",module:"Interviews",linkedTC:"TC-003",severity:"Minor",priority:"P3 - Medium",status:"In Progress",assignedDev:"Dev - Tom",reportedDate:"2024-04-03",closedDate:"",reopened:false,release:"R1 - Apr 15"},
    ]
  }
];

// ── UI Primitives ──────────────────────────────
const Badge = ({ text }) => {
  const map = {Pass:"bg-green-100 text-green-700",Fail:"bg-red-100 text-red-700",Blocked:"bg-orange-100 text-orange-700",Skipped:"bg-yellow-100 text-yellow-700",Retest:"bg-purple-100 text-purple-700","In Progress":"bg-blue-100 text-blue-700","Not Run":"bg-gray-100 text-gray-500",Critical:"bg-red-100 text-red-700",Major:"bg-orange-100 text-orange-700",Minor:"bg-yellow-100 text-yellow-700",Trivial:"bg-gray-100 text-gray-400",Open:"bg-red-100 text-red-700",Closed:"bg-green-100 text-green-700",Reopened:"bg-pink-100 text-pink-700","P1 - Urgent":"bg-red-100 text-red-700","P2 - High":"bg-orange-100 text-orange-700","P3 - Medium":"bg-yellow-100 text-yellow-700","P4 - Low":"bg-gray-100 text-gray-500"};
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[text]||"bg-indigo-50 text-indigo-700"}`}>{text}</span>;
};
const KPICard = ({ label, value, sub, color="text-indigo-600", icon }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <div className="flex items-start justify-between">
      <div><p className="text-xs text-gray-500 font-medium">{label}</p><p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>{sub&&<p className="text-xs text-gray-400 mt-0.5">{sub}</p>}</div>
      {icon&&<span className="text-xl">{icon}</span>}
    </div>
  </div>
);
const SectionTitle = ({ children }) => <h2 className="text-base font-bold text-gray-700 mb-3 mt-4">{children}</h2>;
const NavTab = ({ label, active, onClick, count }) => (
  <button onClick={onClick} className={`px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${active?"border-indigo-600 text-indigo-600":"border-transparent text-gray-500 hover:text-gray-700"}`}>
    {label}{count!==undefined&&<span className="ml-1 bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{count}</span>}
  </button>
);
const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-xl shadow-2xl w-full ${wide?"max-w-2xl":"max-w-lg"} max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10"><h3 className="font-bold text-gray-800">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button></div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);
const Field = ({ label, children }) => <div className="mb-3"><label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>{children}</div>;
const Inp = (props) => <input {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>;
const Sel = ({ options, ...props }) => <select {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">{options.map(o=><option key={o}>{o}</option>)}</select>;
const ChartCard = ({ title, children, full }) => (
  <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${full?"col-span-2":""}`}>
    <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>{children}
  </div>
);
const SmallSel = ({ options, value, onChange, prefix="" }) => (
  <select value={value} onChange={e=>onChange(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
    {options.map(o=><option key={o}>{prefix}{o}</option>)}
  </select>
);

// ── Release Progress Tracker ───────────────────
function ReleaseTracker({ project }) {
  const { cases, bugs, releaseDate } = project;
  const today = new Date();
  const release = new Date(releaseDate);
  const startDate = new Date(Math.min(...cases.map(c=>new Date(c.date)), today - 14*86400000));
  const totalDays = Math.max(1, Math.ceil((release - startDate) / 86400000));
  const daysElapsed = Math.max(0, Math.ceil((today - startDate) / 86400000));
  const daysLeft = Math.max(0, Math.ceil((release - today) / 86400000));
  const timeProgress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
  const total = cases.length;
  const executed = cases.filter(c=>["Pass","Fail","Retest","Skipped"].includes(c.status)).length;
  const passed = cases.filter(c=>c.status==="Pass").length;
  const execPct = total ? Math.round((executed/total)*100) : 0;
  const passRate = executed ? Math.round((passed/executed)*100) : 0;
  const openBugs = bugs.filter(b=>b.status!=="Closed").length;
  const criticalOpen = bugs.filter(b=>b.severity==="Critical"&&b.status!=="Closed").length;

  // Build daily execution data from case dates
  const dateMap = {};
  cases.forEach(c => {
    if (!c.date) return;
    const d = c.date;
    if (!dateMap[d]) dateMap[d] = { date:d, Pass:0, Fail:0, Blocked:0, "Not Run":0, Retest:0, Total:0 };
    dateMap[d][c.status] = (dateMap[d][c.status]||0)+1;
    dateMap[d].Total++;
  });
  const dailyData = Object.values(dateMap).sort((a,b)=>a.date.localeCompare(b.date));

  // Cumulative pass line
  let cumPass=0, cumExec=0;
  const cumulData = dailyData.map(d => {
    cumPass += (d.Pass||0);
    cumExec += (d.Total||0);
    return { date:d.date.slice(5), CumPass:cumPass, CumExec:cumExec, PassRate:cumExec?Math.round((cumPass/cumExec)*100):0 };
  });

  // Ideal burn (how many cases should be done each day)
  const idealPerDay = totalDays > 0 ? (total / totalDays) : 0;
  const burnData = dailyData.map((d,i) => ({
    date:d.date.slice(5),
    Actual: cases.filter(c=>c.date<=d.date&&["Pass","Fail","Retest","Skipped"].includes(c.status)).length,
    Ideal: Math.round(idealPerDay*(i+1)),
  }));

  const onTrack = execPct >= timeProgress - 5;

  return (
    <div>
      <SectionTitle>📅 Release Progress Tracker</SectionTitle>

      {/* Release countdown */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <p className="text-xs text-gray-400 font-medium">Target Release Date</p>
            <p className="text-xl font-bold text-gray-800">{releaseDate} <span className="text-sm font-normal text-gray-400">({daysLeft} days left)</span></p>
          </div>
          <span className={`text-sm font-bold px-4 py-2 rounded-xl ${onTrack?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>
            {onTrack?"✅ On Track":"⚠️ Behind Schedule"}
          </span>
        </div>

        {/* Dual progress bars */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1"><span>⏱ Time Elapsed</span><span>{timeProgress}%</span></div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-3 bg-blue-400 rounded-full transition-all" style={{width:`${timeProgress}%`}}/>
          </div>
        </div>
        <div className="mb-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1"><span>✅ Test Execution</span><span>{execPct}%</span></div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            {STATUSES.filter(s=>s!=="Not Run").map(s=>{
              const pct=total?(cases.filter(c=>c.status===s).length/total)*100:0;
              return pct>0?<div key={s} style={{width:`${pct}%`,background:STATUS_COLORS[s]}} className="h-3" title={`${s}: ${Math.round(pct)}%`}/>:null;
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
          <span>📋 {total} total</span><span className="text-green-600 font-semibold">✓ {passed} passed</span>
          <span className="text-red-500 font-semibold">✗ {cases.filter(c=>c.status==="Fail").length} failed</span>
          <span className="text-orange-500 font-semibold">⊘ {cases.filter(c=>c.status==="Blocked").length} blocked</span>
          <span className="text-gray-400">— {cases.filter(c=>c.status==="Not Run").length} not run</span>
        </div>
      </div>

      {/* Daily stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <KPICard label="Pass Rate"      value={`${passRate}%`}  color={passRate>=80?"text-green-600":"text-red-600"} icon="✅"/>
        <KPICard label="Days Left"      value={daysLeft}        color={daysLeft<=3?"text-red-600":daysLeft<=7?"text-orange-500":"text-blue-600"} icon="📅"/>
        <KPICard label="Open Bugs"      value={openBugs}        color={openBugs>0?"text-red-600":"text-green-600"} icon="🐛"/>
        <KPICard label="Critical Open"  value={criticalOpen}    color={criticalOpen>0?"text-red-600":"text-green-600"} icon="🚨"/>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="Daily Execution (by date)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="date" tick={{fontSize:9}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="Pass" stackId="a" fill="#86efac"/>
              <Bar dataKey="Fail" stackId="a" fill="#fca5a5"/>
              <Bar dataKey="Blocked" stackId="a" fill="#fdba74"/>
              <Bar dataKey="Retest" stackId="a" fill="#c4b5fd" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Actual vs Ideal Burn">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={burnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="date" tick={{fontSize:9}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Line type="monotone" dataKey="Ideal" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Ideal"/>
              <Line type="monotone" dataKey="Actual" stroke="#6366f1" strokeWidth={2} dot={{r:3}} name="Actual"/>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cumulative Pass Rate Trend" full>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={cumulData}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="date" tick={{fontSize:9}}/>
              <YAxis domain={[0,100]} tick={{fontSize:11}}/>
              <Tooltip/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{value:"Target 80%",fontSize:10,fill:"#ef4444"}}/>
              <Area type="monotone" dataKey="PassRate" stroke="#22c55e" fill="url(#pg)" strokeWidth={2} name="Pass Rate %"/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* GO/NO-GO */}
      <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p className="text-sm font-bold text-gray-700 mb-3">🚦 Release Readiness</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            {label:"Pass Rate",val:`${passRate}%`,ok:passRate>=80,t:"≥80%"},
            {label:"Execution",val:`${execPct}%`,ok:execPct>=90,t:"≥90%"},
            {label:"Critical Open",val:criticalOpen,ok:criticalOpen===0,t:"=0"},
            {label:"On Track",val:onTrack?"Yes":"No",ok:onTrack,t:"Yes"},
          ].map(v=>(
            <div key={v.label} className={`rounded-xl p-3 flex items-center gap-2 ${v.ok?"bg-green-50 border border-green-200":"bg-red-50 border border-red-200"}`}>
              <span>{v.ok?"✅":"❌"}</span>
              <div><p className="text-xs text-gray-600 font-semibold">{v.label}</p><p className={`text-base font-bold ${v.ok?"text-green-700":"text-red-700"}`}>{v.val}</p><p className="text-xs text-gray-400">Target: {v.t}</p></div>
            </div>
          ))}
        </div>
        <div className={`mt-3 p-3 rounded-xl text-sm font-bold text-center ${passRate>=80&&execPct>=90&&criticalOpen===0&&onTrack?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>
          {passRate>=80&&execPct>=90&&criticalOpen===0&&onTrack?"✅ GO FOR RELEASE":"🚫 NOT READY FOR RELEASE"}
        </div>
      </div>
    </div>
  );
}

// ── KPI Panel ──────────────────────────────────
function KPIPanel({ project }) {
  const { cases, bugs, config } = project;
  const allPeople = ["All", "Test Engineer", ...config.devs];
  const [person, setPerson] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const filterByDate = (items, dateKey) => items.filter(it => {
    const d = it[dateKey];
    if (!d) return true;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo   && d > dateTo)   return false;
    return true;
  });

  const fCases = useMemo(() => {
    let c = filterByDate(cases, "date");
    if (person !== "All" && person === "Test Engineer") c = c.filter(x=>x.assignee==="Test Engineer");
    else if (person !== "All") c = []; // dev doesn't execute cases
    return c;
  }, [cases, person, dateFrom, dateTo]);

  const fBugs = useMemo(() => {
    let b = filterByDate(bugs, "reportedDate");
    if (person !== "All") {
      if (person === "Test Engineer") b = b.filter(x=>x.reportedBy==="Test Engineer"||!x.reportedBy);
      else b = b.filter(x=>x.assignedDev===person);
    }
    return b;
  }, [bugs, person, dateFrom, dateTo]);

  const total=fCases.length, passed=fCases.filter(c=>c.status==="Pass").length;
  const executed=fCases.filter(c=>["Pass","Fail","Retest","Skipped"].includes(c.status)).length;
  const passRate=executed?Math.round((passed/executed)*100):0;
  const blocked=fCases.filter(c=>c.status==="Blocked").length;
  const blockedPct=total?Math.round((blocked/total)*100):0;
  const closedB=fBugs.filter(b=>b.closedDate);
  const avgFix=closedB.length?Math.round(closedB.reduce((a,b)=>{return a+(new Date(b.closedDate)-new Date(b.reportedDate))/86400000;},0)/closedB.length):0;
  const reopenRate=fBugs.length?Math.round((fBugs.filter(b=>b.reopened).length/fBugs.length)*100):0;
  const openBugs=fBugs.filter(b=>b.status!=="Closed").length;
  const criticalOpen=fBugs.filter(b=>b.severity==="Critical"&&b.status!=="Closed").length;

  const isTE = person==="All"||person==="Test Engineer";
  const isDev = person==="All"||config.devs.includes(person);

  const devData = config.devs.map(d=>({
    name:d.replace("Dev - ",""),
    Open: filterByDate(bugs.filter(b=>b.assignedDev===d),"reportedDate").filter(b=>b.status!=="Closed").length,
    Closed: filterByDate(bugs.filter(b=>b.assignedDev===d),"reportedDate").filter(b=>b.status==="Closed").length,
    Reopened: filterByDate(bugs.filter(b=>b.assignedDev===d),"reportedDate").filter(b=>b.reopened).length,
  }));

  const sprintData = config.sprints.map(sp=>({
    sprint:sp.replace("Sprint ","S"),
    Pass: fCases.filter(c=>c.sprint===sp&&c.status==="Pass").length,
    Fail: fCases.filter(c=>c.sprint===sp&&c.status==="Fail").length,
    Blocked: fCases.filter(c=>c.sprint===sp&&c.status==="Blocked").length,
  }));

  const radarData=[{metric:"Pass Rate",val:passRate,target:90},{metric:"Detection",val:Math.min(100,fBugs.length*15),target:80},{metric:"Coverage",val:total?Math.round((executed/total)*100):0,target:95},{metric:"Speed",val:78,target:85},{metric:"Exec",val:total?Math.round((executed/total)*100):0,target:90}];

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3 items-end">
        <div><p className="text-xs font-semibold text-gray-500 mb-1">👤 Person</p>
          <select value={person} onChange={e=>setPerson(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            {allPeople.map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
        <div><p className="text-xs font-semibold text-gray-500 mb-1">📅 From</p><Inp type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{width:140}}/></div>
        <div><p className="text-xs font-semibold text-gray-500 mb-1">📅 To</p><Inp type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{width:140}}/></div>
        {(person!=="All"||dateFrom||dateTo)&&<button onClick={()=>{setPerson("All");setDateFrom("");setDateTo("");}} className="text-xs text-indigo-500 font-semibold mt-4 hover:underline">Clear filters</button>}
        <div className="ml-auto text-xs text-gray-400 mt-4">
          {person!=="All"&&<span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-semibold mr-2">{person}</span>}
          {dateFrom&&dateTo&&<span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{dateFrom} → {dateTo}</span>}
        </div>
      </div>

      {isTE&&(
        <>
          <SectionTitle>🧪 Test Engineer KPIs</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <KPICard label="Executed"     value={executed}        sub={`of ${total}`} icon="▶️"/>
            <KPICard label="Pass Rate"    value={`${passRate}%`}  color={passRate>=80?"text-green-600":"text-red-600"} icon="✅" sub="target: 80%"/>
            <KPICard label="Bugs Found"   value={fBugs.length}    icon="🔍"/>
            <KPICard label="Avg Fix TAT"  value={`${avgFix}d`}    color="text-purple-600" icon="⏱️"/>
            <KPICard label="Blocked %"    value={`${blockedPct}%`} color={blockedPct>15?"text-orange-600":"text-green-600"} icon="🚧" sub="target: <15%"/>
            <KPICard label="Velocity"     value={sprintData[sprintData.length-1]?.Pass||0} sub="passed last sprint" icon="🏃"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <ChartCard title="Execution Radar">
              <ResponsiveContainer width="100%" height={200}><RadarChart data={radarData}><PolarGrid/><PolarAngleAxis dataKey="metric" tick={{fontSize:10}}/><Radar name="Actual" dataKey="val" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4}/><Radar name="Target" dataKey="target" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1}/><Legend wrapperStyle={{fontSize:10}}/><Tooltip/></RadarChart></ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Execution by Sprint">
              <ResponsiveContainer width="100%" height={200}><BarChart data={sprintData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="sprint" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="Pass" stackId="a" fill="#86efac"/><Bar dataKey="Fail" stackId="a" fill="#fca5a5"/><Bar dataKey="Blocked" stackId="a" fill="#fdba74" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {isDev&&(
        <>
          <SectionTitle>👨‍💻 Dev Engineer KPIs</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <KPICard label="Avg Fix Time"  value={`${avgFix}d`}     color="text-purple-600" icon="⚡" sub="target: ≤3d"/>
            <KPICard label="Reopen Rate"   value={`${reopenRate}%`}  color={reopenRate>20?"text-red-600":"text-green-600"} icon="🔁"/>
            <KPICard label="Fix Rate"      value={fBugs.length?`${Math.round((closedB.length/fBugs.length)*100)}%`:"0%"} color="text-blue-600" icon="📈"/>
            <KPICard label="Critical Open" value={criticalOpen}       color={criticalOpen>0?"text-red-600":"text-green-600"} icon="🚨"/>
            <KPICard label="Total Closed"  value={closedB.length}     color="text-green-600" icon="✅"/>
            <KPICard label="Open Bugs"     value={openBugs}           color="text-red-600" icon="🐛"/>
          </div>
          {person==="All"&&(
            <ChartCard title="Bug Performance by Developer">
              <ResponsiveContainer width="100%" height={200}><BarChart data={devData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="Open" fill="#fca5a5" radius={[3,3,0,0]}/><Bar dataKey="Closed" fill="#86efac" radius={[3,3,0,0]}/><Bar dataKey="Reopened" fill="#f9a8d4" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
}

// ── Inline editable row ────────────────────────
function EditableRow({ row, fields, onSave, onCancel }) {
  const [form, setForm] = useState({...row});
  return (
    <tr className="bg-indigo-50 border-t-2 border-indigo-300">
      {fields.map(f=>(
        <td key={f.key} className="px-2 py-1">
          {f.options
            ? <select value={form[f.key]||""} onChange={e=>setForm({...form,[f.key]:e.target.value})} className="border border-indigo-300 rounded px-1.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white">{f.options.map(o=><option key={o}>{o}</option>)}</select>
            : f.type==="date"
              ? <input type="date" value={form[f.key]||""} onChange={e=>setForm({...form,[f.key]:e.target.value})} className="border border-indigo-300 rounded px-1.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
              : <input value={form[f.key]||""} onChange={e=>setForm({...form,[f.key]:e.target.value})} className="border border-indigo-300 rounded px-1.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
          }
        </td>
      ))}
      <td className="px-2 py-1">
        <div className="flex gap-1">
          <button onClick={()=>onSave(form)} className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded hover:bg-indigo-700">✓</button>
          <button onClick={onCancel} className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded hover:bg-gray-300">✕</button>
        </div>
      </td>
    </tr>
  );
}

// ── Test Cases Table ───────────────────────────
function CasesTable({ project, onUpdate }) {
  const { cases, config } = project;
  const [search, setSearch] = useState("");
  const [fMod,   setFMod]   = useState("All");
  const [fSt,    setFSt]    = useState("All");
  const [fSprint,setFSprint]= useState("All");
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [editId,  setEditId]  = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const blank = {title:"",module:config.modules[0]||"",story:config.stories[0]||"",sprint:config.sprints[0]||"",status:"Not Run",assignee:"Test Engineer",date:today};
  const [addForm, setAddForm] = useState(blank);

  const caseFields = [
    {key:"title",label:"Title"},
    {key:"module",label:"Module",options:config.modules},
    {key:"sprint",label:"Sprint",options:config.sprints},
    {key:"story",label:"Story",options:config.stories},
    {key:"status",label:"Status",options:STATUSES},
    {key:"assignee",label:"Assignee"},
    {key:"date",label:"Date",type:"date"},
  ];

  const toggle = (key) => { setSortDir(sortKey===key?(sortDir==="asc"?"desc":"asc"):"asc"); setSortKey(key); };
  const SortTh = ({ k, label }) => (
    <th onClick={()=>toggle(k)} className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap">
      {label} <span className="text-gray-400">{sortKey===k?(sortDir==="asc"?"↑":"↓"):"↕"}</span>
    </th>
  );

  const filtered = useMemo(()=>{
    let r = [...cases];
    if (search) r = r.filter(c=>c.title.toLowerCase().includes(search.toLowerCase())||c.id.toLowerCase().includes(search.toLowerCase()));
    if (fMod!=="All") r = r.filter(c=>c.module===fMod);
    if (fSt!=="All")  r = r.filter(c=>c.status===fSt);
    if (fSprint!=="All") r = r.filter(c=>c.sprint===fSprint);
    r.sort((a,b)=>{
      const av=a[sortKey]||"", bv=b[sortKey]||"";
      return sortDir==="asc"?av.localeCompare(bv):bv.localeCompare(av);
    });
    return r;
  },[cases,search,fMod,fSt,fSprint,sortKey,sortDir]);

  const saveEdit = (form) => { onUpdate({...project,cases:cases.map(c=>c.id===editId?{...form,id:editId}:c)}); setEditId(null); };
  const saveAdd  = () => {
    if (!addForm.title.trim()) return;
    onUpdate({...project,cases:[...cases,{...addForm,id:`TC-${String(cases.length+1).padStart(3,"0")}`}]});
    setAddForm(blank); setShowAdd(false);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search ID or title…" className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-44 focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        <SmallSel options={["All",...config.modules]} value={fMod} onChange={setFMod}/>
        <SmallSel options={["All",...STATUSES]} value={fSt} onChange={setFSt}/>
        <SmallSel options={["All",...config.sprints]} value={fSprint} onChange={setFSprint}/>
        {(search||fMod!=="All"||fSt!=="All"||fSprint!=="All")&&<button onClick={()=>{setSearch("");setFMod("All");setFSt("All");setFSprint("All");}} className="text-xs text-indigo-500 font-semibold hover:underline">Clear</button>}
        <span className="text-xs text-gray-400">{filtered.length} of {cases.length}</span>
        <button onClick={()=>setShowAdd(true)} className="ml-auto bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">+ Add</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <SortTh k="id" label="ID"/>
              <SortTh k="title" label="Title"/>
              <SortTh k="module" label="Module"/>
              <SortTh k="sprint" label="Sprint"/>
              <SortTh k="story" label="Story"/>
              <SortTh k="status" label="Status"/>
              <SortTh k="assignee" label="Assignee"/>
              <SortTh k="date" label="Date"/>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c=>
              editId===c.id
                ? <EditableRow key={c.id} row={c} fields={caseFields} onSave={saveEdit} onCancel={()=>setEditId(null)}/>
                : <tr key={c.id} onClick={()=>setEditId(c.id)} className="border-t hover:bg-indigo-50 cursor-pointer transition-colors" title="Click to edit">
                    <td className="px-3 py-2 font-mono text-gray-400">{c.id}</td>
                    <td className="px-3 py-2 text-gray-800 max-w-xs truncate">{c.title}</td>
                    <td className="px-3 py-2"><Badge text={c.module}/></td>
                    <td className="px-3 py-2 text-gray-500">{c.sprint}</td>
                    <td className="px-3 py-2 text-gray-400">{c.story}</td>
                    <td className="px-3 py-2"><Badge text={c.status}/></td>
                    <td className="px-3 py-2 text-gray-500">{c.assignee}</td>
                    <td className="px-3 py-2 text-gray-400">{c.date}</td>
                    <td className="px-3 py-2 text-indigo-400 text-xs">✏️ edit</td>
                  </tr>
            )}
            {filtered.length===0&&<tr><td colSpan={9} className="text-center py-8 text-gray-400">No test cases match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
      {showAdd&&(
        <Modal title="Add Test Case" onClose={()=>setShowAdd(false)}>
          <Field label="Title"><Inp value={addForm.title} onChange={e=>setAddForm({...addForm,title:e.target.value})} placeholder="Test case title"/></Field>
          <Field label="Module"><Sel options={config.modules} value={addForm.module} onChange={e=>setAddForm({...addForm,module:e.target.value})}/></Field>
          {/* <Field label="User Story"><Sel options={config.stories} value={addForm.story} onChange={e=>setAddForm({...addForm,story:e.target.value})}/></Field> */}
          <Field label="Sprint"><Sel options={config.sprints} value={addForm.sprint} onChange={e=>setAddForm({...addForm,sprint:e.target.value})}/></Field>
          <Field label="Status"><Sel options={STATUSES} value={addForm.status} onChange={e=>setAddForm({...addForm,status:e.target.value})}/></Field>
          <Field label="Assignee"><Inp value={addForm.assignee} onChange={e=>setAddForm({...addForm,assignee:e.target.value})}/></Field>
          <Field label="Date"><Inp type="date" value={addForm.date} onChange={e=>setAddForm({...addForm,date:e.target.value})}/></Field>
          <div className="flex gap-2 mt-4"><button onClick={saveAdd} className="flex-1 bg-indigo-600 text-white font-semibold py-2 rounded-lg">Add</button><button onClick={()=>setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">Cancel</button></div>
        </Modal>
      )}
    </div>
  );
}

// ── Bugs Table ─────────────────────────────────
function BugsTable({ project, onUpdate }) {
  const { bugs, config } = project;
  const [search, setSearch] = useState("");
  const [fMod,  setFMod]  = useState("All");
  const [fSt,   setFSt]   = useState("All");
  const [fSev,  setFSev]  = useState("All");
  const [fDev,  setFDev]  = useState("All");
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [editId,  setEditId]  = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const blank = {title:"",module:config.modules[0]||"",linkedTC:"",severity:"Major",priority:"P3 - Medium",status:"Open",assignedDev:config.devs[0]||"",reportedDate:today,closedDate:"",reopened:false,release:config.releases[0]||""};
  const [addForm, setAddForm] = useState(blank);

  const bugFields = [
    {key:"title",label:"Title"},
    {key:"module",label:"Module",options:config.modules},
    {key:"linkedTC",label:"Linked TC"},
    {key:"severity",label:"Severity",options:SEVERITIES},
    {key:"priority",label:"Priority",options:PRIORITIES},
    {key:"status",label:"Status",options:BUG_STATUSES},
    {key:"assignedDev",label:"Dev",options:config.devs},
    {key:"release",label:"Release",options:config.releases},
    {key:"reportedDate",label:"Reported",type:"date"},
    {key:"closedDate",label:"Closed",type:"date"},
  ];

  const toggle = (key) => { setSortDir(sortKey===key?(sortDir==="asc"?"desc":"asc"):"asc"); setSortKey(key); };
  const SortTh = ({ k, label }) => (
    <th onClick={()=>toggle(k)} className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap">
      {label} <span className="text-gray-400">{sortKey===k?(sortDir==="asc"?"↑":"↓"):"↕"}</span>
    </th>
  );

  const filtered = useMemo(()=>{
    let r = [...bugs];
    if (search) r = r.filter(b=>b.title.toLowerCase().includes(search.toLowerCase())||b.id.toLowerCase().includes(search.toLowerCase()));
    if (fMod!=="All")  r = r.filter(b=>b.module===fMod);
    if (fSt!=="All")   r = r.filter(b=>b.status===fSt);
    if (fSev!=="All")  r = r.filter(b=>b.severity===fSev);
    if (fDev!=="All")  r = r.filter(b=>b.assignedDev===fDev);
    r.sort((a,b)=>{
      const av=a[sortKey]||"", bv=b[sortKey]||"";
      return sortDir==="asc"?av.localeCompare(bv):bv.localeCompare(av);
    });
    return r;
  },[bugs,search,fMod,fSt,fSev,fDev,sortKey,sortDir]);

  const saveEdit = (form) => { onUpdate({...project,bugs:bugs.map(b=>b.id===editId?{...form,id:editId,reopened:form.reopened==="true"||form.reopened===true}:b)}); setEditId(null); };
  const saveAdd  = () => {
    if (!addForm.title.trim()) return;
    onUpdate({...project,bugs:[...bugs,{...addForm,id:`BUG-${String(bugs.length+1).padStart(3,"0")}`}]});
    setAddForm(blank); setShowAdd(false);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search ID or title…" className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-44 focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        <SmallSel options={["All",...config.modules]} value={fMod} onChange={setFMod}/>
        <SmallSel options={["All",...BUG_STATUSES]} value={fSt} onChange={setFSt}/>
        <SmallSel options={["All",...SEVERITIES]} value={fSev} onChange={setFSev}/>
        <SmallSel options={["All",...config.devs]} value={fDev} onChange={v=>setFDev(v)}/>
        {(search||fMod!=="All"||fSt!=="All"||fSev!=="All"||fDev!=="All")&&<button onClick={()=>{setSearch("");setFMod("All");setFSt("All");setFSev("All");setFDev("All");}} className="text-xs text-indigo-500 font-semibold hover:underline">Clear</button>}
        <span className="text-xs text-gray-400">{filtered.length} of {bugs.length}</span>
        <button onClick={()=>setShowAdd(true)} className="ml-auto bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">+ Log Bug</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <SortTh k="id" label="ID"/>
              <SortTh k="title" label="Title"/>
              <SortTh k="module" label="Module"/>
              <SortTh k="linkedTC" label="TC"/>
              <SortTh k="severity" label="Severity"/>
              <SortTh k="priority" label="Priority"/>
              <SortTh k="status" label="Status"/>
              <SortTh k="assignedDev" label="Dev"/>
              <SortTh k="reportedDate" label="Reported"/>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b=>
              editId===b.id
                ? <EditableRow key={b.id} row={b} fields={bugFields} onSave={saveEdit} onCancel={()=>setEditId(null)}/>
                : <tr key={b.id} onClick={()=>setEditId(b.id)} className="border-t hover:bg-red-50 cursor-pointer transition-colors" title="Click to edit">
                    <td className="px-3 py-2 font-mono text-gray-400">{b.id}</td>
                    <td className="px-3 py-2 text-gray-800 max-w-xs truncate">{b.title}</td>
                    <td className="px-3 py-2"><Badge text={b.module}/></td>
                    <td className="px-3 py-2 font-mono text-gray-400">{b.linkedTC}</td>
                    <td className="px-3 py-2"><Badge text={b.severity}/></td>
                    <td className="px-3 py-2"><Badge text={b.priority}/></td>
                    <td className="px-3 py-2"><Badge text={b.status}/></td>
                    <td className="px-3 py-2 text-gray-500">{b.assignedDev?.replace("Dev - ","")}</td>
                    <td className="px-3 py-2 text-gray-400">{b.reportedDate}</td>
                    <td className="px-3 py-2 text-indigo-400 text-xs">✏️ edit</td>
                  </tr>
            )}
            {filtered.length===0&&<tr><td colSpan={10} className="text-center py-8 text-gray-400">No bugs match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
      {showAdd&&(
        <Modal title="Log New Bug" onClose={()=>setShowAdd(false)}>
          <Field label="Title"><Inp value={addForm.title} onChange={e=>setAddForm({...addForm,title:e.target.value})} placeholder="Describe the bug"/></Field>
          <Field label="Module"><Sel options={config.modules} value={addForm.module} onChange={e=>setAddForm({...addForm,module:e.target.value})}/></Field>
          <Field label="Linked TC"><Inp value={addForm.linkedTC} onChange={e=>setAddForm({...addForm,linkedTC:e.target.value})} placeholder="e.g. TC-003"/></Field>
          <Field label="Severity"><Sel options={SEVERITIES} value={addForm.severity} onChange={e=>setAddForm({...addForm,severity:e.target.value})}/></Field>
          <Field label="Priority"><Sel options={PRIORITIES} value={addForm.priority} onChange={e=>setAddForm({...addForm,priority:e.target.value})}/></Field>
          <Field label="Status"><Sel options={BUG_STATUSES} value={addForm.status} onChange={e=>setAddForm({...addForm,status:e.target.value})}/></Field>
          <Field label="Assigned Dev"><Sel options={config.devs} value={addForm.assignedDev} onChange={e=>setAddForm({...addForm,assignedDev:e.target.value})}/></Field>
          <Field label="Release"><Sel options={config.releases} value={addForm.release} onChange={e=>setAddForm({...addForm,release:e.target.value})}/></Field>
          <Field label="Reported Date"><Inp type="date" value={addForm.reportedDate} onChange={e=>setAddForm({...addForm,reportedDate:e.target.value})}/></Field>
          <div className="flex gap-2 mt-4"><button onClick={saveAdd} className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-lg">Log Bug</button><button onClick={()=>setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">Cancel</button></div>
        </Modal>
      )}
    </div>
  );
}

// ── Settings Panel ─────────────────────────────
function SettingsPanel({ project, onUpdate }) {
  const { config, releaseDate } = project;
  const [vals, setVals] = useState({modules:"",sprints:"",stories:"",devs:"",releases:""});
  const [rd, setRd] = useState(releaseDate||"");
  const [confirmDel, setConfirmDel] = useState(null);
  const sections = [{key:"modules",label:"Modules",icon:"📦",hint:"e.g. Checkout"},{key:"sprints",label:"Sprints",icon:"🏃",hint:"e.g. Sprint 5"},{key:"devs",label:"Dev Engineers",icon:"👨‍💻",hint:"e.g. Dev - Priya"},{key:"releases",label:"Releases",icon:"🚀",hint:"e.g. R3 - May 1"}];
  const add = (key) => { const v=vals[key].trim(); if(!v||config[key].includes(v))return; onUpdate({...project,config:{...config,[key]:[...config[key],v]}}); setVals(n=>({...n,[key]:""})); };
  const remove = (key,val) => { onUpdate({...project,config:{...config,[key]:config[key].filter(x=>x!==val)}}); setConfirmDel(null); };
  return (
    <div>
      <SectionTitle>⚙️ Project Settings</SectionTitle>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
        <p className="text-sm font-bold text-gray-700 mb-2">📅 Target Release Date</p>
        <div className="flex gap-2 items-center">
          <Inp type="date" value={rd} onChange={e=>setRd(e.target.value)} style={{maxWidth:200}}/>
          <button onClick={()=>onUpdate({...project,releaseDate:rd})} className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-lg">Save</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map(({key,label,icon,hint})=>(
          <div key={key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-700 mb-3">{icon} {label}</p>
            <div className="flex flex-wrap gap-2 mb-3 min-h-8">
              {config[key].map(val=><span key={val} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-1 rounded-full">{val}<button onClick={()=>setConfirmDel({key,val})} className="ml-1 text-indigo-300 hover:text-red-500 font-bold">×</button></span>)}
              {config[key].length===0&&<span className="text-xs text-gray-300 italic">No values yet</span>}
            </div>
            <div className="flex gap-2">
              <input value={vals[key]} onChange={e=>setVals(n=>({...n,[key]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&add(key)} placeholder={hint} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
              <button onClick={()=>add(key)} className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Add</button>
            </div>
          </div>
        ))}
      </div>
      {confirmDel&&<Modal title="Remove Value?" onClose={()=>setConfirmDel(null)}><p className="text-sm text-gray-600 mb-1">Remove <strong>"{confirmDel.val}"</strong>?</p><p className="text-xs text-orange-500 mb-4">Existing records won't be affected.</p><div className="flex gap-2"><button onClick={()=>remove(confirmDel.key,confirmDel.val)} className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-lg">Remove</button><button onClick={()=>setConfirmDel(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">Cancel</button></div></Modal>}
    </div>
  );
}

// ── Project View ───────────────────────────────
function ProjectView({ project, onUpdate }) {
  const [tab, setTab] = useState("progress");
  return (
    <div>
      <div className="bg-white border-b px-4 flex gap-1 overflow-x-auto">
        {[["progress","📅 Progress"],["cases","Test Cases",project.cases.length],["bugs","Bugs",project.bugs.length],["kpi","KPIs"],["settings","⚙️ Settings"]].map(([id,label,cnt])=>(
          <NavTab key={id} label={label} active={tab===id} onClick={()=>setTab(id)} count={cnt}/>
        ))}
      </div>
      <div className="p-4 max-w-6xl mx-auto">
        {tab==="progress" && <ReleaseTracker project={project}/>}
        {tab==="cases"    && <CasesTable project={project} onUpdate={onUpdate}/>}
        {tab==="bugs"     && <BugsTable  project={project} onUpdate={onUpdate}/>}
        {tab==="kpi"      && <KPIPanel   project={project}/>}
        {tab==="settings" && <SettingsPanel project={project} onUpdate={onUpdate}/>}
      </div>
    </div>
  );
}

// ── Portfolio ──────────────────────────────────
function PortfolioView({ projects }) {
  const stats = projects.map(p=>{
    const total=p.cases.length, passed=p.cases.filter(c=>c.status==="Pass").length;
    const executed=p.cases.filter(c=>["Pass","Fail","Retest","Skipped"].includes(c.status)).length;
    const passRate=executed?Math.round((passed/executed)*100):0;
    const openBugs=p.bugs.filter(b=>b.status!=="Closed").length;
    const criticalOpen=p.bugs.filter(b=>b.severity==="Critical"&&b.status!=="Closed").length;
    const reopenRate=p.bugs.length?Math.round((p.bugs.filter(b=>b.reopened).length/p.bugs.length)*100):0;
    const go=passRate>=80&&criticalOpen===0&&reopenRate<=20;
    const daysLeft=p.releaseDate?Math.max(0,Math.ceil((new Date(p.releaseDate)-new Date())/86400000)):null;
    return {name:p.name,color:p.color,total,passRate,openBugs,criticalOpen,go,executed,daysLeft};
  });
  const totalCases=stats.reduce((a,s)=>a+s.total,0);
  const totalBugs=projects.reduce((a,p)=>a+p.bugs.length,0);
  const avgPass=stats.length?Math.round(stats.reduce((a,s)=>a+s.passRate,0)/stats.length):0;
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <SectionTitle>🌐 Portfolio Overview</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KPICard label="Projects"    value={projects.length} icon="📁"/>
        <KPICard label="Total Cases" value={totalCases}      icon="📋"/>
        <KPICard label="Total Bugs"  value={totalBugs}       color="text-red-600" icon="🐛"/>
        <KPICard label="Avg Pass"    value={`${avgPass}%`}   color={avgPass>=80?"text-green-600":"text-red-600"} icon="✅"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {stats.map(s=>(
          <div key={s.name} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{background:s.color}}/>
              <span className="font-bold text-gray-800">{s.name}</span>
              {s.daysLeft!==null&&<span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.daysLeft<=3?"bg-red-100 text-red-600":s.daysLeft<=7?"bg-orange-100 text-orange-600":"bg-blue-50 text-blue-600"}`}>⏳ {s.daysLeft}d left</span>}
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${s.go?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{s.go?"✅ GO":"🚫 NO-GO"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div><p className="text-xs text-gray-400">Cases</p><p className="font-bold text-gray-700">{s.total}</p></div>
              <div><p className="text-xs text-gray-400">Pass Rate</p><p className={`font-bold ${s.passRate>=80?"text-green-600":"text-red-600"}`}>{s.passRate}%</p></div>
              <div><p className="text-xs text-gray-400">Open Bugs</p><p className={`font-bold ${s.openBugs>0?"text-red-600":"text-green-600"}`}>{s.openBugs}</p></div>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-2 rounded-full" style={{width:`${s.total?Math.round((s.executed/s.total)*100):0}%`,background:s.color}}/>
            </div>
            <p className="text-xs text-gray-400 mt-1">{s.total?Math.round((s.executed/s.total)*100):0}% executed</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="Pass Rate by Project">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.map(s=>({name:s.name,"Pass Rate":s.passRate}))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip/>
              <Bar dataKey="Pass Rate" radius={[4,4,0,0]}>{stats.map((s,i)=><Cell key={i} fill={s.color}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Open Bugs by Project">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.map(s=>({name:s.name,"Open Bugs":s.openBugs}))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/>
              <Bar dataKey="Open Bugs" radius={[4,4,0,0]}>{stats.map((s,i)=><Cell key={i} fill={s.color}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────
export default function App() {
  const [projects, setProjects] = useState(INIT_PROJECTS);
  const [activeProj, setActiveProj] = useState(null);
  const [showNewProj, setShowNewProj] = useState(false);
  const [showDelConfirm, setShowDelConfirm] = useState(null);
  const [newProj, setNewProj] = useState({name:"",description:"",color:PROJECT_COLORS[2],releaseDate:""});

  const updateProject = (updated) => setProjects(ps=>ps.map(p=>p.id===updated.id?updated:p));
  const createProject = () => {
    if (!newProj.name.trim()) return;
    setProjects(ps=>[...ps,{id:`proj-${Date.now()}`,name:newProj.name.trim(),description:newProj.description,color:newProj.color,releaseDate:newProj.releaseDate,createdAt:new Date().toISOString().split("T")[0],config:{modules:[],sprints:[],stories:[],devs:[],releases:[]},cases:[],bugs:[]}]);
    setNewProj({name:"",description:"",color:PROJECT_COLORS[2],releaseDate:""});
    setShowNewProj(false);
  };
  const deleteProject = (id) => { setProjects(ps=>ps.filter(p=>p.id!==id)); setActiveProj(null); setShowDelConfirm(null); };
  const currentProj = projects.find(p=>p.id===activeProj);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-indigo-700 text-white px-4 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <button onClick={()=>setActiveProj(null)} className="font-bold text-lg hover:text-indigo-200">QualifyMe</button>
          {currentProj&&<><span className="text-indigo-400">›</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{background:currentProj.color}}/><span className="font-semibold">{currentProj.name}</span></span></>}
        </div>
        <div className="flex gap-2">
          {currentProj&&<button onClick={()=>setShowDelConfirm(currentProj.id)} className="text-red-300 hover:text-red-200 text-xs font-semibold px-2 py-1 rounded border border-red-400">Delete</button>}
          <button onClick={()=>setShowNewProj(true)} className="bg-white text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg">+ New Project</button>
        </div>
      </div>
      <div className="bg-white border-b px-4 flex gap-1 overflow-x-auto">
        <NavTab label="🌐 All Projects" active={!activeProj} onClick={()=>setActiveProj(null)}/>
        {projects.map(p=>(
          <button key={p.id} onClick={()=>setActiveProj(p.id)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${activeProj===p.id?"border-indigo-600 text-indigo-600":"border-transparent text-gray-500 hover:text-gray-700"}`}>
            <span className="w-2 h-2 rounded-full" style={{background:p.color}}/>{p.name}
            <span className="ml-1 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">{p.cases.length}tc</span>
          </button>
        ))}
      </div>
      {!activeProj ? <PortfolioView projects={projects}/> : currentProj && <ProjectView key={currentProj.id} project={currentProj} onUpdate={updateProject}/>}

      {showNewProj&&(
        <Modal title="Create New Project" onClose={()=>setShowNewProj(false)}>
          <Field label="Project Name"><Inp value={newProj.name} onChange={e=>setNewProj({...newProj,name:e.target.value})} placeholder="e.g. PayFlow"/></Field>
          <Field label="Description"><Inp value={newProj.description} onChange={e=>setNewProj({...newProj,description:e.target.value})} placeholder="Brief description"/></Field>
          <Field label="Target Release Date"><Inp type="date" value={newProj.releaseDate} onChange={e=>setNewProj({...newProj,releaseDate:e.target.value})}/></Field>
          <Field label="Project Color">
            <div className="flex gap-2 mt-1">{PROJECT_COLORS.map(c=><button key={c} onClick={()=>setNewProj({...newProj,color:c})} className={`w-7 h-7 rounded-full border-2 transition-all ${newProj.color===c?"border-gray-800 scale-110":"border-transparent"}`} style={{background:c}}/>)}</div>
          </Field>
          <div className="flex gap-2 mt-4"><button onClick={createProject} className="flex-1 bg-indigo-600 text-white font-semibold py-2 rounded-lg">Create</button><button onClick={()=>setShowNewProj(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">Cancel</button></div>
        </Modal>
      )}
      {showDelConfirm&&(
        <Modal title="Delete Project?" onClose={()=>setShowDelConfirm(null)}>
          <p className="text-sm text-gray-600 mb-1">Permanently delete <strong>{projects.find(p=>p.id===showDelConfirm)?.name}</strong>?</p>
          <p className="text-xs text-red-500 mb-4">This cannot be undone.</p>
          <div className="flex gap-2"><button onClick={()=>deleteProject(showDelConfirm)} className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-lg">Delete</button><button onClick={()=>setShowDelConfirm(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg">Cancel</button></div>
        </Modal>
      )}
    </div>
  );
}
