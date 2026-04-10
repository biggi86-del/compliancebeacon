"use client";
import { useState } from "react";
import { SAMPLE_CSV, MALFORMED_CSV } from "@/lib/sample-data";

interface TestResult { name: string; status: "PASS" | "FAIL"; expected: string; actual: string; }

export default function ReportsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const call = async (csv: string, d?: string) => {
    const r = await fetch("/api/engine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv, as_of_date: d || "2026-06-15" }) });
    return r.json();
  };

  const runTests = async () => {
    setRunning(true);
    const t: TestResult[] = [];
    try {
      const r = await call(SAMPLE_CSV);
      const e1 = r.calculations?.find((c: {employee_id:string}) => c.employee_id === "E001");
      t.push({ name: "1. Federal TT - OT Premium", status: e1 && Math.abs(e1.box12_code_tt - 100) < 0.01 ? "PASS" : "FAIL", expected: "$100.00", actual: e1 ? `$${e1.box12_code_tt.toFixed(2)}` : "N/A" });
      t.push({ name: "2. Federal TP - Qualified Tips", status: e1 && e1.box12_code_tp === 500 ? "PASS" : "FAIL", expected: "$500.00", actual: e1 ? `$${e1.box12_code_tp.toFixed(2)}` : "N/A" });
      const e2 = r.calculations?.find((c: {employee_id:string}) => c.employee_id === "E002");
      t.push({ name: "3. Service Charge Exclusion", status: e2 && e2.box12_code_tp === 350 ? "PASS" : "FAIL", expected: "TP=$350", actual: e2 ? `TP=$${e2.box12_code_tp.toFixed(2)}` : "N/A" });
      t.push({ name: "4. CA Tip - No Credit State", status: r.rules_applied?.some((x: {rule_id:string}) => x.rule_id === "CA-TIP-2026-001") ? "PASS" : "FAIL", expected: "CA rule applied", actual: r.rules_applied?.some((x: {rule_id:string}) => x.rule_id === "CA-TIP-2026-001") ? "Yes" : "No" });
      const e6d = r.discrepancies?.find((d: {employee_id:string;jurisdiction:string}) => d.employee_id === "E006" && d.jurisdiction === "NY");
      t.push({ name: "5. NY Min Wage Violation", status: e6d ? "PASS" : "FAIL", expected: "E006 flagged ($14<$15)", actual: e6d ? "Flagged" : "Not found" });
      t.push({ name: "6. WA No Tip Credit", status: r.rules_applied?.some((x: {rule_id:string}) => x.rule_id === "WA-TIP-2026-001") ? "PASS" : "FAIL", expected: "WA rule applied", actual: r.rules_applied?.some((x: {rule_id:string}) => x.rule_id === "WA-TIP-2026-001") ? "Yes" : "No" });
      t.push({ name: "7. Mixed-State Unavailable", status: r.unavailable_modules?.includes("TX") && r.unavailable_modules?.includes("FL") ? "PASS" : "FAIL", expected: "TX,FL unavailable", actual: r.unavailable_modules?.join(",") || "none" });
      const mods = r.discrepancies?.filter((d: {rule_id:string}) => d.rule_id === "RULE_MODULE_UNAVAILABLE");
      t.push({ name: "8. Module Unavailable Emission", status: mods?.length >= 2 ? "PASS" : "FAIL", expected: ">=2 emissions", actual: `${mods?.length || 0} found` });
      const mr = await call(MALFORMED_CSV);
      t.push({ name: "9. Malformed CSV Errors", status: mr.csv_errors?.length > 0 ? "PASS" : "FAIL", expected: "Errors detected", actual: `${mr.summary?.error_rows || 0} error rows` });
      const r25 = await call(SAMPLE_CSV, "2025-06-15");
      const r26 = await call(SAMPLE_CSV, "2026-06-15");
      const v25 = r25.rules_applied?.find((x: {rule_id:string}) => x.rule_id === "FED-TP-2026-001")?.version;
      const v26 = r26.rules_applied?.find((x: {rule_id:string}) => x.rule_id === "FED-TP-2026-001")?.version;
      t.push({ name: "10. Rule Version Rollover", status: v25 === 0 && v26 === 1 ? "PASS" : "FAIL", expected: "2025=v0, 2026=v1", actual: `v${v25} to v${v26}` });
    } catch (e: unknown) { t.push({ name: "Error", status: "FAIL", expected: "", actual: e instanceof Error ? e.message : "Unknown" }); }
    setResults(t);
    setRunning(false);
  };

  const pass = results.filter((r) => r.status === "PASS").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold mb-2">Test Reports</h1><p className="text-gray-400">10 required compliance test scenarios</p></div>
        <button onClick={runTests} disabled={running} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold transition">{running ? "Running..." : "Run All 10 Tests"}</button>
      </div>
      {results.length > 0 && (
        <div>
          <div className="flex gap-4 mb-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2"><span className="text-green-400 font-bold text-xl">{pass}</span><span className="text-green-400 ml-2 text-sm">PASSED</span></div>
            <div className={`${results.length - pass > 0 ? "bg-red-500/10 border-red-500/30" : "bg-gray-800 border-gray-700"} border rounded-lg px-4 py-2`}><span className={`font-bold text-xl ${results.length - pass > 0 ? "text-red-400" : "text-gray-500"}`}>{results.length - pass}</span><span className={`ml-2 text-sm ${results.length - pass > 0 ? "text-red-400" : "text-gray-500"}`}>FAILED</span></div>
          </div>
          <div className="space-y-3">{results.map((r, i) => (
            <div key={i} className={`border rounded-xl p-5 ${r.status === "PASS" ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
              <div className="flex items-center gap-3 mb-2"><span>{r.status === "PASS" ? "+" : "x"}</span><span className="font-semibold">{r.name}</span><span className={`ml-auto text-sm font-mono ${r.status === "PASS" ? "text-green-400" : "text-red-400"}`}>{r.status}</span></div>
              <div className="grid md:grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500 text-xs">EXPECTED</span><div className="text-gray-300 font-mono mt-0.5">{r.expected}</div></div><div><span className="text-gray-500 text-xs">ACTUAL</span><div className="text-gray-300 font-mono mt-0.5">{r.actual}</div></div></div>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}
