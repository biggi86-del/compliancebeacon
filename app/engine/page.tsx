"use client";
import { useState } from "react";
import { SAMPLE_CSV } from "@/lib/sample-data";
import type { EngineResult } from "@/lib/types";

const SEV: Record<string, string> = { CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30", ERROR: "bg-orange-500/20 text-orange-400 border-orange-500/30", WARNING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", INFO: "bg-blue-500/20 text-blue-400 border-blue-500/30" };

export default function EnginePage() {
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<EngineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"calcs"|"disc"|"errs"|"rules">("calcs");

  const run = async () => {
    if (!csv.trim()) { setError("Paste CSV data first."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/engine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Engine error");
      setResult(data); setTab("calcs");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-2">Compliance Engine</h1>
      <p className="text-gray-400 mb-6">Upload payroll CSV to analyze TP/TT compliance and detect penalty risks.</p>
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Payroll Data (CSV)</h2>
          <div className="flex gap-2">
            <button onClick={() => setCsv(SAMPLE_CSV)} className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition">Load Sample (10 employees)</button>
            <button onClick={() => { setCsv(""); setResult(null); setError(""); }} className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition">Clear</button>
          </div>
        </div>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={8} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-300 focus:border-blue-500 focus:outline-none resize-y" placeholder="Paste CSV here or click Load Sample..." />
        <div className="mt-4 flex items-center gap-4">
          <button onClick={run} disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold transition shadow-lg shadow-blue-500/25">{loading ? "Analyzing..." : "Run Compliance Engine"}</button>
          {error && <span className="text-red-400 text-sm">{error}</span>}
        </div>
      </div>
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { l: "Total Rows", v: result.summary.total_rows, c: "text-white" },
              { l: "Valid", v: result.summary.valid_rows, c: "text-green-400" },
              { l: "Errors", v: result.summary.error_rows, c: result.summary.error_rows > 0 ? "text-red-400" : "text-gray-500" },
              { l: "Discrepancies", v: result.summary.total_discrepancies, c: "text-yellow-400" },
              { l: "Critical", v: result.summary.critical_count, c: result.summary.critical_count > 0 ? "text-red-400" : "text-gray-500" },
              { l: "Warnings", v: result.summary.warning_count, c: "text-yellow-400" },
              { l: "Penalty Risk", v: `$${result.summary.penalty_risk_total.toLocaleString()}`, c: result.summary.penalty_risk_total > 0 ? "text-red-400" : "text-green-400" },
            ].map((s) => (
              <div key={s.l} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                <div className="text-xs text-gray-500 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
          {result.unavailable_modules.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <span className="text-yellow-400 font-semibold">RULE_MODULE_UNAVAILABLE: </span>
              <span className="text-yellow-300">{result.unavailable_modules.join(", ")}. Only federal rules applied.</span>
            </div>
          )}
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
            {(["calcs","disc","errs","rules"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium transition capitalize ${tab === t ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
                {t === "calcs" ? "Calculations" : t === "disc" ? `Discrepancies (${result.discrepancies.length})` : t === "errs" ? `CSV Errors (${result.csv_errors.length})` : "Rules Applied"}
              </button>
            ))}
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            {tab === "calcs" && (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-800/50 text-gray-400"><tr><th className="px-4 py-3 text-left">Employee</th><th className="px-4 py-3 text-left">Period</th><th className="px-4 py-3">State</th><th className="px-4 py-3 text-right">TP (Tips)</th><th className="px-4 py-3 text-right">TT (OT Premium)</th><th className="px-4 py-3 text-right">Penalty</th></tr></thead><tbody className="divide-y divide-gray-800">{result.calculations.map((c) => (
                <tr key={c.id} className="hover:bg-gray-800/30"><td className="px-4 py-3 font-mono">{c.employee_id}</td><td className="px-4 py-3 text-gray-400 text-xs">{c.pay_period}</td><td className="px-4 py-3 text-center">{c.jurisdiction}</td><td className="px-4 py-3 text-right font-mono text-green-400">${c.box12_code_tp.toFixed(2)}</td><td className="px-4 py-3 text-right font-mono text-cyan-400">${c.box12_code_tt.toFixed(2)}</td><td className="px-4 py-3 text-right">{c.penalty_risk_flag ? <span className="text-red-400 font-semibold">${c.penalty_risk_amount}</span> : <span className="text-green-400">Clean</span>}</td></tr>
              ))}</tbody></table></div>
            )}
            {tab === "disc" && (
              <div className="divide-y divide-gray-800">{result.discrepancies.length === 0 ? <div className="p-6 text-center text-gray-500">No discrepancies found.</div> : result.discrepancies.map((d) => (
                <div key={d.id} className="p-4 hover:bg-gray-800/20"><div className="flex items-start gap-3"><span className={`px-2 py-0.5 rounded text-xs font-semibold border ${SEV[d.severity] || ""}`}>{d.severity}</span><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="font-mono text-sm text-gray-300">{d.rule_id}</span><span className="text-gray-600">-</span><span className="text-sm text-gray-400">{d.jurisdiction}</span><span className="text-gray-600">-</span><span className="text-sm text-gray-400">{d.employee_id}</span></div><p className="text-sm text-gray-300">{d.explanation}</p>{d.delta !== 0 && <div className="mt-1 text-xs text-gray-500">Expected: ${d.expected_value.toFixed(2)} | Actual: ${d.actual_value.toFixed(2)} | Delta: ${d.delta.toFixed(2)}</div>}</div></div></div>
              ))}</div>
            )}
            {tab === "errs" && (
              <div className="divide-y divide-gray-800">{result.csv_errors.length === 0 ? <div className="p-6 text-center text-gray-500">No CSV errors.</div> : result.csv_errors.map((e, i) => (
                <div key={i} className="p-4 text-sm"><span className="text-red-400 font-mono">Row {e.row_number}</span><span className="text-gray-600 mx-2">-</span><span className="text-gray-400">{e.column}:</span><span className="text-gray-300 ml-1">{e.error}</span></div>
              ))}</div>
            )}
            {tab === "rules" && (
              <div className="divide-y divide-gray-800">{result.rules_applied.map((r, i) => (
                <div key={i} className="p-4"><div className="flex items-center gap-2 mb-1"><span className="font-mono text-sm text-blue-400">{r.rule_id}</span><span className="text-xs bg-gray-800 px-2 py-0.5 rounded">v{r.version}</span><span className="text-xs text-gray-500">{r.jurisdiction}</span></div></div>
              ))}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
