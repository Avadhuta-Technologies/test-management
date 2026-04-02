import { useState } from "react";
import type { EditField } from "../types";

type EditableRowProps = {
  row: Record<string, any>;
  fields: EditField[];
  onSave: (form: Record<string, any>) => void;
  onCancel: () => void;
};

export function EditableRow({ row, fields, onSave, onCancel }: EditableRowProps) {
  const [form, setForm] = useState<Record<string, any>>({ ...row });

  return (
    <tr className="bg-indigo-50 border-t-2 border-indigo-300">
      {fields.map((field) => (
        <td key={field.key} className="px-2 py-1">
          {field.options ? (
            <select
              value={form[field.key] ?? ""}
              onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
              className="border border-indigo-300 rounded px-1.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
            >
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : field.type === "date" ? (
            <input
              type="date"
              value={form[field.key] ?? ""}
              onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
              className="border border-indigo-300 rounded px-1.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          ) : (
            <input
              value={form[field.key] ?? ""}
              onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
              className="border border-indigo-300 rounded px-1.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          )}
        </td>
      ))}
      <td className="px-2 py-1">
        <div className="flex gap-1">
          <button onClick={() => onSave(form)} className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded hover:bg-indigo-700">✓</button>
          <button onClick={onCancel} className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded hover:bg-gray-300">✕</button>
        </div>
      </td>
    </tr>
  );
}
