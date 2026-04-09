import Link from "next/link";

const stats = [
  { label: "Federal Rules", value: "4", sub: "TP + TT + Penalty" },
  { label: "State Modules", value: "3", sub: "CA / NY / WA" },
  { label: "Penalty Detection", value: "$680", sub: "per W-2 error" },
  { label: "Test Scenarios", value: "10", sub: "All passing" },
];

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <section className="pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-blue-300">2026 OBBBA Rules Engine Live</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
          Payroll Compliance<br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">Automated and Auditable</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">Instantly validate W-2 Box 12 Code TP (Tips) and Code TT (Overtime Premium) against 2026 federal and state rules. Detect $680 penalty risks before they cost you.</p>
        <div className="flex justify-center gap-4">
          <Link href="/engine" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold transition shadow-lg shadow-blue-500/25">Launch Engine</Link>
          <Link href="/rules" className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3 rounded-lg font-semibold transition">View Rules</Link>
        </div>
      </section>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="text-sm font-medium text-gray-400 mt-1">{s.label}</div>
            <div className="text-xs text-gray-600 mt-1">{s.sub}</div>
          </div>
        ))}
      </section>
      <section className="text-center pb-20">
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Eliminate Penalty Risk?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">Upload your payroll CSV and get instant compliance analysis across federal and state jurisdictions.</p>
          <Link href="/engine" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold transition shadow-lg shadow-blue-500/25">Start Free Analysis</Link>
        </div>
      </section>
    </div>
  );
}
