import { useState } from "react";
import { Plus, Trash, DollarSign, Users2, Package } from "lucide-react";
import { PageShell } from "./shared";

// ─── Services & Pricing screen ───────────────────────────────────────────────

const INITIAL_SERVICES = [
  { id: "SVC-001", name: "Individual Tax Return", description: "Annual income tax return preparation and lodgement", entityTypes: ["Individual"], scope: "Includes one rental property, up to $20k investments", status: "Active" },
  { id: "SVC-002", name: "Company Tax Return", description: "Corporate income tax return and financial statements", entityTypes: ["Company"], scope: "Standard small business — excludes R&D or transfer pricing", status: "Active" },
  { id: "SVC-003", name: "Trust Tax Return", description: "Trust income tax return and distribution statements", entityTypes: ["Trust"], scope: "Discretionary and unit trusts", status: "Active" },
  { id: "SVC-004", name: "SMSF Administration", description: "Full SMSF audit, compliance and tax return", entityTypes: ["SMSF"], scope: "Up to 4 members, standard investment strategy", status: "Active" },
  { id: "SVC-005", name: "BAS Preparation", description: "Quarterly Business Activity Statement preparation", entityTypes: ["Company", "Partnership", "Trust"], scope: "GST, PAYG withholding, fuel tax credits", status: "Active" },
  { id: "SVC-006", name: "Business Advisory", description: "Strategic financial advice and management reporting", entityTypes: ["Company", "Partnership"], scope: "Monthly meetings, management accounts, KPI dashboard", status: "Active" },
  { id: "SVC-007", name: "Partnership Tax Return", description: "Partnership tax return and distribution schedule", entityTypes: ["Partnership"], scope: "Standard partnership — excludes foreign partners", status: "Active" },
];

export const INITIAL_FEES = [
  { id: "FEE-001", service: "Individual Tax Return", basis: "Fixed", amount: 1650, frequency: "Annual", gst: true, notes: "Base rate — complex returns quoted separately" },
  { id: "FEE-002", service: "Company Tax Return", amount: 3850, basis: "Fixed", frequency: "Annual", gst: true, notes: "Turnover < $5M. Additional $550 per entity in group." },
  { id: "FEE-003", service: "Trust Tax Return", amount: 4400, basis: "Fixed", frequency: "Annual", gst: true, notes: "Discretionary trust base rate" },
  { id: "FEE-004", service: "SMSF Administration", amount: 3300, basis: "Fixed", frequency: "Annual", gst: true, notes: "Full admin + audit. Audit conducted by external auditor." },
  { id: "FEE-005", service: "BAS Preparation", amount: 550, basis: "Fixed", frequency: "Quarterly", gst: true, notes: "Per quarter — IAS lodgement included" },
  { id: "FEE-006", service: "Business Advisory", amount: 1100, basis: "Fixed", frequency: "Monthly", gst: true, notes: "Retainer. Additional project work at charge-out rate." },
  { id: "FEE-007", service: "Partnership Tax Return", amount: 2750, basis: "Fixed", frequency: "Annual", gst: true, notes: "" },
];

export const INITIAL_STAFF = [
  { id: "STF-001", name: "James Okafor", role: "Partner", rate: 520, currency: "AUD", unit: "hour", email: "j.okafor@growadvisory.com.au", status: "Active" },
  { id: "STF-002", name: "Amelia Brennan", role: "Senior Manager", rate: 380, currency: "AUD", unit: "hour", email: "a.brennan@growadvisory.com.au", status: "Active" },
  { id: "STF-003", name: "Sanjay Patel", role: "Senior Accountant", rate: 280, currency: "AUD", unit: "hour", email: "s.patel@growadvisory.com.au", status: "Active" },
  { id: "STF-004", name: "Chloe Richardson", role: "Accountant", rate: 195, currency: "AUD", unit: "hour", email: "c.richardson@growadvisory.com.au", status: "Active" },
  { id: "STF-005", name: "Marcus Webb", role: "Graduate Accountant", rate: 130, currency: "AUD", unit: "hour", email: "m.webb@growadvisory.com.au", status: "Active" },
  { id: "STF-006", name: "Linda Tran", role: "Practice Manager", rate: 165, currency: "AUD", unit: "hour", email: "l.tran@growadvisory.com.au", status: "Active" },
];

const ENTITY_TYPES = ["Individual", "Company", "Trust", "SMSF", "Partnership", "Individual group"];
const FEE_BASIS = ["Fixed", "Hourly", "Range"];
const FEE_FREQUENCIES = ["Annual", "Monthly", "Quarterly", "Per event", "One-off"];
const STAFF_ROLES = ["Partner", "Director", "Senior Manager", "Manager", "Senior Accountant", "Accountant", "Graduate Accountant", "Practice Manager", "Administration"];

function ServicesScreen() {
  const [tab, setTab] = useState<"services" | "fees" | "staff">("services");

  // Service catalogue state
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [showNewService, setShowNewService] = useState(false);
  const [newSvc, setNewSvc] = useState({ name: "", description: "", entityTypes: [] as string[], scope: "" });
  const [editingSvcId, setEditingSvcId] = useState<string | null>(null);
  const [editSvc, setEditSvc] = useState<typeof INITIAL_SERVICES[0] | null>(null);

  // Fee schedule state
  const [fees, setFees] = useState(INITIAL_FEES);
  const [showNewFee, setShowNewFee] = useState(false);
  const [newFee, setNewFee] = useState({ service: INITIAL_SERVICES[0].name, basis: "Fixed", amount: "", frequency: "Annual", gst: true, notes: "" });
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editFee, setEditFee] = useState<typeof INITIAL_FEES[0] | null>(null);

  // Staff rates state
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [showNewStaff, setShowNewStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", role: "Accountant", rate: "", email: "" });
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaff, setEditStaff] = useState<typeof INITIAL_STAFF[0] | null>(null);

  const inputCls = "w-full px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all";
  const selectCls = inputCls + " appearance-none cursor-pointer";

  return (
    <PageShell
      title="Services & Pricing"
      subtitle="Configure your service catalogue, fees and staff charge-out rates"
      breadcrumb={["EnTIQ", "Start", "Settings", "Services & Pricing"]}
      actions={
        <div className="flex gap-2">
          {tab === "services" && (
            <button onClick={() => setShowNewService(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors">
              <Plus size={14} />Add service
            </button>
          )}
          {tab === "fees" && (
            <button onClick={() => setShowNewFee(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors">
              <Plus size={14} />Add fee
            </button>
          )}
          {tab === "staff" && (
            <button onClick={() => setShowNewStaff(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors">
              <Plus size={14} />Add staff member
            </button>
          )}
        </div>
      }
    >
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border">
        {([
          { id: "services", label: "Service Catalogue", icon: <Package size={14} /> },
          { id: "fees", label: "Fee Schedule", icon: <DollarSign size={14} /> },
          { id: "staff", label: "Staff Charge-Out Rates", icon: <Users2 size={14} /> },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-5 py-3 text-[13px] font-medium border-b-2 transition-colors -mb-px ${tab === t.id ? "border-[#2855A6] text-[#2855A6]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Service Catalogue ── */}
      {tab === "services" && (
        <>
          {showNewService && (
            <div className="bg-card border border-[#2855A6]/30 rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-[14px] font-bold text-foreground">New service</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5">Service name *</label>
                  <input value={newSvc.name} onChange={e => setNewSvc(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Individual Tax Return" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5">Short description</label>
                  <input value={newSvc.description} onChange={e => setNewSvc(p => ({ ...p, description: e.target.value }))} placeholder="One-line description" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-2">Applicable entity types</label>
                <div className="flex flex-wrap gap-2">
                  {ENTITY_TYPES.map(t => (
                    <label key={t} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] cursor-pointer transition-colors ${newSvc.entityTypes.includes(t) ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-muted-foreground hover:border-[#2855A6]/40"}`}>
                      <input type="checkbox" className="sr-only" checked={newSvc.entityTypes.includes(t)} onChange={e => setNewSvc(p => ({ ...p, entityTypes: e.target.checked ? [...p.entityTypes, t] : p.entityTypes.filter(x => x !== t) }))} />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5">Standard scope / inclusions</label>
                <textarea value={newSvc.scope} onChange={e => setNewSvc(p => ({ ...p, scope: e.target.value }))} placeholder="What's included in this service at the standard price…" rows={2} className={inputCls + " resize-none"} />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setShowNewService(false); setNewSvc({ name: "", description: "", entityTypes: [], scope: "" }); }} className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
                <button
                  disabled={!newSvc.name.trim()}
                  onClick={() => {
                    setServices(prev => [...prev, { id: `SVC-${String(prev.length + 1).padStart(3, "0")}`, name: newSvc.name.trim(), description: newSvc.description, entityTypes: newSvc.entityTypes, scope: newSvc.scope, status: "Active" }]);
                    setShowNewService(false); setNewSvc({ name: "", description: "", entityTypes: [], scope: "" });
                  }}
                  className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors disabled:opacity-40">
                  Add service
                </button>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border bg-[#FAFAFA]">
                  {["ID", "Service name", "Description", "Entity types", "Scope / inclusions", "Status", ""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((s, i) => (
                  editingSvcId === s.id && editSvc ? (
                    <tr key={s.id} className="border-b border-[#2855A6]/30 bg-[#EEF2FA]/30">
                      <td className="px-4 py-3"><span className="font-mono text-[11px] text-[#2855A6]">{s.id}</span></td>
                      <td className="px-4 py-2"><input value={editSvc.name} onChange={e => setEditSvc(p => p && ({ ...p, name: e.target.value }))} className={inputCls} /></td>
                      <td className="px-4 py-2"><input value={editSvc.description} onChange={e => setEditSvc(p => p && ({ ...p, description: e.target.value }))} className={inputCls} /></td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {ENTITY_TYPES.map(t => (
                            <label key={t} className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={editSvc.entityTypes.includes(t)} onChange={e => setEditSvc(p => p && ({ ...p, entityTypes: e.target.checked ? [...p.entityTypes, t] : p.entityTypes.filter(x => x !== t) }))} className="accent-[#2855A6] w-3 h-3" />
                              <span className="text-[10px] text-foreground">{t}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2"><input value={editSvc.scope} onChange={e => setEditSvc(p => p && ({ ...p, scope: e.target.value }))} className={inputCls} /></td>
                      <td className="px-4 py-2">
                        <select value={editSvc.status} onChange={e => setEditSvc(p => p && ({ ...p, status: e.target.value }))} className={selectCls}>
                          <option>Active</option><option>Inactive</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => { setServices(prev => prev.map(x => x.id === s.id ? editSvc! : x)); setEditingSvcId(null); setEditSvc(null); }} className="px-2.5 py-1 bg-[#2855A6] text-white text-[11px] font-semibold rounded hover:bg-[#1F4491] transition-colors">Save</button>
                          <button onClick={() => { setEditingSvcId(null); setEditSvc(null); }} className="px-2.5 py-1 border border-border text-[11px] text-muted-foreground rounded hover:bg-muted transition-colors">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={s.id} onClick={() => { setEditingSvcId(s.id); setEditSvc({ ...s }); }} className={`border-b border-border last:border-0 hover:bg-[#F0F5FF] cursor-pointer transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}>
                      <td className="px-4 py-3"><span className="font-mono text-[11px] text-[#2855A6]">{s.id}</span></td>
                      <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px]">{s.description}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.entityTypes.map(t => <span key={t} className="px-1.5 py-0.5 bg-[#EEF2FA] text-[#2855A6] rounded text-[10px] font-semibold">{t}</span>)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[220px] text-[11px]">{s.scope}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-[#E8F7EB] text-[#1E7A31] rounded text-[11px] font-semibold">{s.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setEditingSvcId(s.id); setEditSvc({ ...s }); }} className="p-1 rounded text-muted-foreground hover:text-[#2855A6] hover:bg-[#EEF2FA] transition-colors text-[11px] font-semibold px-2">Edit</button>
                          <button onClick={() => setServices(prev => prev.filter(x => x.id !== s.id))} className="p-1 rounded text-muted-foreground hover:text-[#D0021B] hover:bg-[#FCE8EB] transition-colors"><Trash size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Fee Schedule ── */}
      {tab === "fees" && (
        <>
          {showNewFee && (
            <div className="bg-card border border-[#2855A6]/30 rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-[14px] font-bold text-foreground">New fee entry</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[12px] font-semibold mb-1.5">Service *</label>
                  <select value={newFee.service} onChange={e => setNewFee(p => ({ ...p, service: e.target.value }))} className={selectCls}>
                    {services.map(s => <option key={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5">Basis</label>
                  <select value={newFee.basis} onChange={e => setNewFee(p => ({ ...p, basis: e.target.value }))} className={selectCls}>
                    {FEE_BASIS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5">Frequency</label>
                  <select value={newFee.frequency} onChange={e => setNewFee(p => ({ ...p, frequency: e.target.value }))} className={selectCls}>
                    {FEE_FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5">Amount (AUD ex-GST) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px]">$</span>
                    <input type="number" value={newFee.amount} onChange={e => setNewFee(p => ({ ...p, amount: e.target.value }))} placeholder="0" className={inputCls + " pl-7"} />
                  </div>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newFee.gst} onChange={e => setNewFee(p => ({ ...p, gst: e.target.checked }))} className="accent-[#2855A6] w-4 h-4" />
                    <span className="text-[13px] text-foreground font-medium">GST applicable</span>
                  </label>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5">Notes</label>
                  <input value={newFee.notes} onChange={e => setNewFee(p => ({ ...p, notes: e.target.value }))} placeholder="Conditions, exclusions…" className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setShowNewFee(false); setNewFee({ service: services[0]?.name ?? "", basis: "Fixed", amount: "", frequency: "Annual", gst: true, notes: "" }); }} className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
                <button
                  disabled={!newFee.amount}
                  onClick={() => {
                    setFees(prev => [...prev, { id: `FEE-${String(prev.length + 1).padStart(3, "0")}`, service: newFee.service, basis: newFee.basis, amount: Number(newFee.amount), frequency: newFee.frequency, gst: newFee.gst, notes: newFee.notes }]);
                    setShowNewFee(false); setNewFee({ service: services[0]?.name ?? "", basis: "Fixed", amount: "", frequency: "Annual", gst: true, notes: "" });
                  }}
                  className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors disabled:opacity-40">
                  Add fee
                </button>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border bg-[#FAFAFA]">
                  {["ID", "Service", "Basis", "Amount (ex-GST)", "+ GST", "Frequency", "Notes", ""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fees.map((f, i) => (
                  editingFeeId === f.id && editFee ? (
                    <tr key={f.id} className="border-b border-[#2855A6]/30 bg-[#EEF2FA]/30">
                      <td className="px-4 py-2"><span className="font-mono text-[11px] text-[#2855A6]">{f.id}</span></td>
                      <td className="px-4 py-2">
                        <select value={editFee.service} onChange={e => setEditFee(p => p && ({ ...p, service: e.target.value }))} className={selectCls}>
                          {services.map(s => <option key={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select value={editFee.basis} onChange={e => setEditFee(p => p && ({ ...p, basis: e.target.value }))} className={selectCls}>
                          {FEE_BASIS.map(b => <option key={b}>{b}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[12px]">$</span>
                          <input type="number" value={editFee.amount} onChange={e => setEditFee(p => p && ({ ...p, amount: Number(e.target.value) }))} className={inputCls + " pl-5"} />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={editFee.gst} onChange={e => setEditFee(p => p && ({ ...p, gst: e.target.checked }))} className="accent-[#2855A6] w-4 h-4" />
                          <span className="text-[11px]">GST</span>
                        </label>
                      </td>
                      <td className="px-4 py-2">
                        <select value={editFee.frequency} onChange={e => setEditFee(p => p && ({ ...p, frequency: e.target.value }))} className={selectCls}>
                          {FEE_FREQUENCIES.map(fr => <option key={fr}>{fr}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2"><input value={editFee.notes} onChange={e => setEditFee(p => p && ({ ...p, notes: e.target.value }))} placeholder="Notes…" className={inputCls} /></td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => { setFees(prev => prev.map(x => x.id === f.id ? editFee! : x)); setEditingFeeId(null); setEditFee(null); }} className="px-2.5 py-1 bg-[#2855A6] text-white text-[11px] font-semibold rounded hover:bg-[#1F4491] transition-colors">Save</button>
                          <button onClick={() => { setEditingFeeId(null); setEditFee(null); }} className="px-2.5 py-1 border border-border text-[11px] text-muted-foreground rounded hover:bg-muted transition-colors">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={f.id} onClick={() => { setEditingFeeId(f.id); setEditFee({ ...f }); }} className={`border-b border-border last:border-0 hover:bg-[#F0F5FF] cursor-pointer transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}>
                      <td className="px-4 py-3"><span className="font-mono text-[11px] text-[#2855A6]">{f.id}</span></td>
                      <td className="px-4 py-3 font-medium text-foreground">{f.service}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.basis}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">${f.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {f.gst ? <span className="px-1.5 py-0.5 bg-[#E8F7EB] text-[#1E7A31] rounded text-[10px] font-semibold">Yes</span> : <span className="text-muted-foreground">No</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{f.frequency}</td>
                      <td className="px-4 py-3 text-muted-foreground text-[11px]">{f.notes || "—"}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setFees(prev => prev.filter(x => x.id !== f.id))} className="p-1 rounded text-muted-foreground hover:text-[#D0021B] hover:bg-[#FCE8EB] transition-colors"><Trash size={13} /></button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-border bg-[#FAFAFA] flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{fees.length} fee entries</span>
              <span className="font-semibold text-foreground">These rates populate fee tables in engagement templates</span>
            </div>
          </div>
        </>
      )}

      {/* ── Staff Rates ── */}
      {tab === "staff" && (
        <>
          {showNewStaff && (
            <div className="bg-card border border-[#2855A6]/30 rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-[14px] font-bold text-foreground">New staff member</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5">Full name *</label>
                  <input value={newStaff.name} onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))} placeholder="Full name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5">Role / title</label>
                  <select value={newStaff.role} onChange={e => setNewStaff(p => ({ ...p, role: e.target.value }))} className={selectCls}>
                    {STAFF_ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5">Charge-out rate ($/hr)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px]">$</span>
                    <input type="number" value={newStaff.rate} onChange={e => setNewStaff(p => ({ ...p, rate: e.target.value }))} placeholder="0" className={inputCls + " pl-7"} />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5">Email</label>
                  <input type="email" value={newStaff.email} onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))} placeholder="name@firm.com.au" className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setShowNewStaff(false); setNewStaff({ name: "", role: "Accountant", rate: "", email: "" }); }} className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
                <button
                  disabled={!newStaff.name.trim()}
                  onClick={() => {
                    setStaff(prev => [...prev, { id: `STF-${String(prev.length + 1).padStart(3, "0")}`, name: newStaff.name.trim(), role: newStaff.role, rate: Number(newStaff.rate) || 0, currency: "AUD", unit: "hour", email: newStaff.email, status: "Active" }]);
                    setShowNewStaff(false); setNewStaff({ name: "", role: "Accountant", rate: "", email: "" });
                  }}
                  className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors disabled:opacity-40">
                  Add staff member
                </button>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border bg-[#FAFAFA]">
                  {["ID", "Name", "Role / Title", "Charge-out rate", "Email", "Status", ""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((s, i) => (
                  editingStaffId === s.id && editStaff ? (
                    <tr key={s.id} className="border-b border-[#2855A6]/30 bg-[#EEF2FA]/30">
                      <td className="px-4 py-2"><span className="font-mono text-[11px] text-[#2855A6]">{s.id}</span></td>
                      <td className="px-4 py-2"><input value={editStaff.name} onChange={e => setEditStaff(p => p && ({ ...p, name: e.target.value }))} className={inputCls} /></td>
                      <td className="px-4 py-2">
                        <select value={editStaff.role} onChange={e => setEditStaff(p => p && ({ ...p, role: e.target.value }))} className={selectCls}>
                          {STAFF_ROLES.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[12px]">$</span>
                          <input type="number" value={editStaff.rate} onChange={e => setEditStaff(p => p && ({ ...p, rate: Number(e.target.value) }))} className={inputCls + " pl-5"} />
                        </div>
                      </td>
                      <td className="px-4 py-2"><input type="email" value={editStaff.email} onChange={e => setEditStaff(p => p && ({ ...p, email: e.target.value }))} className={inputCls} /></td>
                      <td className="px-4 py-2">
                        <select value={editStaff.status} onChange={e => setEditStaff(p => p && ({ ...p, status: e.target.value }))} className={selectCls}>
                          <option>Active</option><option>Inactive</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => { setStaff(prev => prev.map(x => x.id === s.id ? editStaff! : x)); setEditingStaffId(null); setEditStaff(null); }} className="px-2.5 py-1 bg-[#2855A6] text-white text-[11px] font-semibold rounded hover:bg-[#1F4491] transition-colors">Save</button>
                          <button onClick={() => { setEditingStaffId(null); setEditStaff(null); }} className="px-2.5 py-1 border border-border text-[11px] text-muted-foreground rounded hover:bg-muted transition-colors">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={s.id} onClick={() => { setEditingStaffId(s.id); setEditStaff({ ...s }); }} className={`border-b border-border last:border-0 hover:bg-[#F0F5FF] cursor-pointer transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}>
                      <td className="px-4 py-3"><span className="font-mono text-[11px] text-[#2855A6]">{s.id}</span></td>
                      <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.role}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground">${s.rate.toLocaleString()}</span>
                        <span className="text-muted-foreground">/hr</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-[#E8F7EB] text-[#1E7A31] rounded text-[11px] font-semibold">{s.status}</span></td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingStaffId(s.id); setEditStaff({ ...s }); }} className="p-1 rounded text-muted-foreground hover:text-[#2855A6] hover:bg-[#EEF2FA] transition-colors text-[11px] font-semibold px-2">Edit</button>
                          <button onClick={() => setStaff(prev => prev.filter(x => x.id !== s.id))} className="p-1 rounded text-muted-foreground hover:text-[#D0021B] hover:bg-[#FCE8EB] transition-colors"><Trash size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-border bg-[#FAFAFA] text-[11px] text-muted-foreground">
              Charge-out rates are used in engagement proposals and quoted estimates
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

export default ServicesScreen;
