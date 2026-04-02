import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from "react";

type BadgeProps = { text: string };
export function Badge({ text }: BadgeProps) {
  const map: Record<string, string> = {
    Pass: "bg-green-100 text-green-700",
    Fail: "bg-red-100 text-red-700",
    Blocked: "bg-orange-100 text-orange-700",
    Skipped: "bg-yellow-100 text-yellow-700",
    Retest: "bg-purple-100 text-purple-700",
    "In Progress": "bg-blue-100 text-blue-700",
    "Not Run": "bg-gray-100 text-gray-700",
    Critical: "bg-red-100 text-red-700",
    Major: "bg-orange-100 text-orange-700",
    Minor: "bg-yellow-100 text-yellow-700",
    Trivial: "bg-gray-100 text-gray-700",
    Open: "bg-red-100 text-red-700",
    Closed: "bg-green-100 text-green-700",
    Reopened: "bg-pink-100 text-pink-700",
    "P1 - Urgent": "bg-red-100 text-red-700",
    "P2 - High": "bg-orange-100 text-orange-700",
    "P3 - Medium": "bg-yellow-100 text-yellow-700",
    "P4 - Low": "bg-gray-100 text-gray-700",
  };

  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[text] || "bg-indigo-50 text-indigo-700"}`}>{text}</span>;
}

type KPICardProps = {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: ReactNode;
};
export function KPICard({ label, value, sub, color = "text-indigo-600", icon }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-600 font-medium">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
        </div>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
    </div>
  );
}

type SectionTitleProps = { children: ReactNode };
export function SectionTitle({ children }: SectionTitleProps) {
  return <h2 className="text-base font-bold text-gray-700 mb-3 mt-4">{children}</h2>;
}

type NavTabProps = { label: string; active: boolean; onClick: () => void; count?: number };
export function NavTab({ label, active, onClick, count }: NavTabProps) {
  return (
    <button onClick={onClick} className={`px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${active ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
      {label}
      {count !== undefined && <span className="ml-1 bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">{count}</span>}
    </button>
  );
}

type ModalProps = { title: string; onClose: () => void; children: ReactNode; wide?: boolean };
export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="drawer-overlay flex-1 bg-white/10 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-panel w-1/2 min-w-80 bg-white shadow-2xl flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl font-bold leading-none">×</button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

type FieldProps = { label: string; children: ReactNode };
export function Field({ label, children }: FieldProps) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

export function Inp(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />;
}

type SelProps = SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[] };
export function Sel({ options, ...props }: SelProps) {
  return (
    <select {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

type ChartCardProps = { title: string; children: ReactNode; full?: boolean };
export function ChartCard({ title, children, full }: ChartCardProps) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${full ? "col-span-2" : ""}`}>
      <p className="text-sm font-semibold text-gray-800 mb-3">{title}</p>
      {children}
    </div>
  );
}

type SmallSelProps = { options: readonly string[]; value: string; onChange: (value: string) => void; prefix?: string };
export function SmallSel({ options, value, onChange, prefix = "" }: SmallSelProps) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
      {options.map((option) => (
        <option key={option} value={option}>
          {prefix}{option}
        </option>
      ))}
    </select>
  );
}
