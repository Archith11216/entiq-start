import { useState } from "react";
import { ChevronLeft, Save, CheckCircle, Upload, Users2, Palette, Type, Image, AlignLeft, Table, PenSquare, SquarePen, Trash, X, Link, IndentIncrease } from "lucide-react";
import { INITIAL_FEES, INITIAL_STAFF } from "./ServicesScreen";

// ─── Document Builder screen ──────────────────────────────────────────────────

const MERGE_FIELDS = [
  { group: "Client", fields: ["{{client_name}}", "{{client_email}}", "{{client_phone}}", "{{client_address}}", "{{client_dob}}", "{{client_tfn_last4}}"] },
  { group: "Entity", fields: ["{{entity_name}}", "{{entity_type}}", "{{entity_abn}}", "{{entity_acn}}", "{{entity_address}}"] },
  { group: "Engagement", fields: ["{{service_name}}", "{{annual_fee}}", "{{fee_basis}}", "{{commencement_date}}", "{{engagement_period}}", "{{payment_terms}}"] },
  { group: "Practice", fields: ["{{firm_name}}", "{{firm_abn}}", "{{firm_address}}", "{{adviser_name}}", "{{adviser_email}}", "{{adviser_phone}}", "{{today_date}}"] },
];

type DocSection = { id: string; type: "header" | "recipient" | "body" | "fee-table" | "staff-table" | "signature" | "footer"; label: string; content?: string };

const DEFAULT_SECTIONS: DocSection[] = [
  { id: "s1", type: "header", label: "Letterhead", content: "" },
  { id: "s2", type: "recipient", label: "Recipient block", content: "{{client_name}}\n{{client_address}}\n\n{{today_date}}" },
  { id: "s3", type: "body", label: "Introduction", content: "Dear {{client_name}},\n\nWe are pleased to confirm our engagement to provide the following professional services to {{entity_name}}." },
  { id: "s4", type: "fee-table", label: "Fee table", content: "" },
  { id: "s5", type: "body", label: "Terms & conditions", content: "Our services will be conducted in accordance with the relevant professional standards. Payment is due within 14 days of invoice. GST is applicable to all fees." },
  { id: "s6", type: "signature", label: "Signature block", content: "" },
  { id: "s7", type: "footer", label: "Footer", content: "" },
];

interface DocBuilderProps {
  templateName: string;
  templateType: string;
  onBack: () => void;
}

function DocumentBuilderScreen({ templateName, templateType, onBack }: DocBuilderProps) {
  const [sections, setSections] = useState<DocSection[]>(DEFAULT_SECTIONS);
  const [activeSection, setActiveSection] = useState<string | null>("s3");
  const [branding, setBranding] = useState({ firmName: "Grow Advisory Group", abn: "61 234 567 890", address: "Level 12, 101 Collins Street, Melbourne VIC 3000", phone: "(03) 9000 1234", email: "hello@growadvisory.com.au", website: "www.growadvisory.com.au", primaryColor: "#2855A6", secondaryColor: "#20BCA4", logoUploaded: false });
  const [leftPanel, setLeftPanel] = useState<"branding" | "fields" | "sections">("branding");
  const [saved, setSaved] = useState(false);

  const activeS = sections.find(s => s.id === activeSection);

  function updateContent(id: string, content: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content } : s));
  }

  function addSection(type: DocSection["type"]) {
    const labels: Record<DocSection["type"], string> = { header: "Letterhead", recipient: "Recipient block", body: "Body paragraph", "fee-table": "Fee table", "staff-table": "Staff rates", signature: "Signature block", footer: "Footer" };
    const newS: DocSection = { id: `s${Date.now()}`, type, label: labels[type], content: "" };
    setSections(prev => [...prev, newS]);
    setActiveSection(newS.id);
  }

  function removeSection(id: string) {
    setSections(prev => prev.filter(s => s.id !== id));
    if (activeSection === id) setActiveSection(null);
  }

  function insertField(field: string) {
    if (!activeSection) return;
    setSections(prev => prev.map(s => s.id === activeSection ? { ...s, content: (s.content ?? "") + field } : s));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const sectionTypeIcon: Record<DocSection["type"], React.ReactNode> = {
    header: <Image size={13} />, recipient: <AlignLeft size={13} />, body: <Type size={13} />,
    "fee-table": <Table size={13} />, "staff-table": <Users2 size={13} />, signature: <PenSquare size={13} />, footer: <AlignLeft size={13} />,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F5F7FA]">
      {/* Top bar */}
      <div className="h-[52px] min-h-[52px] bg-card border-b border-border flex items-center px-4 gap-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={14} />Templates
        </button>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <SquarePen size={14} className="text-[#2855A6]" />
          <span className="text-[13px] font-semibold text-foreground">{templateName}</span>
          <span className="px-2 py-0.5 bg-[#EEF2FA] text-[#2855A6] rounded text-[11px] font-semibold">{templateType}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {saved && <span className="text-[12px] text-[#2EA843] font-medium flex items-center gap-1"><CheckCircle size={13} />Saved</span>}
          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-[13px] font-semibold text-foreground rounded hover:bg-muted transition-colors">
            <Save size={13} />Save draft
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors">
            <CheckCircle size={13} />Publish
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-[260px] min-w-[260px] bg-card border-r border-border flex flex-col">
          {/* Panel tabs */}
          <div className="flex border-b border-border">
            {([
              { id: "branding", label: "Branding", icon: <Palette size={13} /> },
              { id: "fields", label: "Fields", icon: <Link size={13} /> },
              { id: "sections", label: "Sections", icon: <IndentIncrease size={13} /> },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setLeftPanel(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold border-b-2 transition-colors -mb-px ${leftPanel === t.id ? "border-[#2855A6] text-[#2855A6]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ── Branding ── */}
            {leftPanel === "branding" && (
              <>
                {/* Logo upload */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Logo</label>
                  <div className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors ${branding.logoUploaded ? "border-[#2EA843] bg-[#E8F7EB]/30" : "border-border hover:border-[#2855A6]/40 hover:bg-[#EEF2FA]/20"}`}
                    onClick={() => setBranding(b => ({ ...b, logoUploaded: !b.logoUploaded }))}>
                    {branding.logoUploaded ? (
                      <>
                        <div className="w-16 h-10 bg-[#2855A6] rounded flex items-center justify-center"><span className="text-white text-[10px] font-bold">LOGO</span></div>
                        <span className="text-[11px] text-[#2EA843] font-semibold">Logo uploaded ✓</span>
                        <span className="text-[10px] text-muted-foreground">Click to replace</span>
                      </>
                    ) : (
                      <>
                        <Upload size={18} className="text-muted-foreground" />
                        <span className="text-[12px] text-muted-foreground text-center">Click to upload logo<br /><span className="text-[10px]">PNG, SVG — max 2 MB</span></span>
                      </>
                    )}
                  </div>
                </div>

                {/* Brand colors */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Brand colours</label>
                  <div className="space-y-2">
                    {([["Primary", "primaryColor"], ["Accent", "secondaryColor"]] as const).map(([label, key]) => (
                      <div key={key} className="flex items-center gap-2">
                        <input type="color" value={branding[key]} onChange={e => setBranding(b => ({ ...b, [key]: e.target.value }))}
                          className="w-8 h-8 rounded cursor-pointer border border-border p-0.5" />
                        <div className="flex-1">
                          <div className="text-[12px] font-medium text-foreground">{label}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{branding[key].toUpperCase()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Firm details */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Firm details</label>
                  <div className="space-y-2">
                    {([["Firm name", "firmName"], ["ABN", "abn"], ["Address", "address"], ["Phone", "phone"], ["Email", "email"], ["Website", "website"]] as const).map(([label, key]) => (
                      <div key={key}>
                        <label className="block text-[10px] text-muted-foreground mb-0.5">{label}</label>
                        <input value={branding[key]} onChange={e => setBranding(b => ({ ...b, [key]: e.target.value }))}
                          className="w-full px-2 py-1.5 text-[12px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]/20 focus:border-[#2855A6]" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Merge fields ── */}
            {leftPanel === "fields" && (
              <>
                <p className="text-[11px] text-muted-foreground">Click a field to insert it at the cursor in the active section.</p>
                {MERGE_FIELDS.map(group => (
                  <div key={group.group}>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{group.group}</div>
                    <div className="space-y-1">
                      {group.fields.map(f => (
                        <button key={f} onClick={() => insertField(f)}
                          className="w-full text-left px-2.5 py-1.5 text-[11px] font-mono bg-[#F5F5F5] border border-border rounded hover:border-[#2855A6]/40 hover:bg-[#EEF2FA]/40 transition-colors text-[#2855A6]">
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── Sections ── */}
            {leftPanel === "sections" && (
              <>
                <p className="text-[11px] text-muted-foreground">Add sections to your document.</p>
                <div className="space-y-1.5">
                  {([
                    { type: "body", label: "Body paragraph" },
                    { type: "fee-table", label: "Fee table" },
                    { type: "staff-table", label: "Staff rates table" },
                    { type: "signature", label: "Signature block" },
                    { type: "footer", label: "Footer" },
                  ] as { type: DocSection["type"]; label: string }[]).map(s => (
                    <button key={s.type} onClick={() => addSection(s.type)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded border border-border text-[12px] text-muted-foreground hover:text-foreground hover:border-[#2855A6]/30 hover:bg-[#EEF2FA]/20 transition-colors">
                      {sectionTypeIcon[s.type]}<span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Centre: document canvas */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col items-center">
          <div className="w-full max-w-[720px] space-y-1">
            {/* Document title bar */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[12px] text-muted-foreground">{sections.length} sections</span>
              <span className="text-[11px] text-muted-foreground">A4 · PDF output</span>
            </div>

            {/* Document page */}
            <div className="bg-white border border-[#D1D1D1] rounded shadow-md overflow-hidden min-h-[900px]">
              {sections.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`relative border-b border-[#E8E8E8] last:border-0 cursor-pointer transition-all group ${activeSection === s.id ? "ring-2 ring-inset ring-[#2855A6]/30 bg-[#EEF2FA]/10" : "hover:bg-[#FAFBFF]"}`}
                >
                  {/* Section type label */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white border border-border rounded text-[10px] text-muted-foreground">
                      {sectionTypeIcon[s.type]} {s.label}
                    </span>
                    <button onClick={e => { e.stopPropagation(); removeSection(s.id); }}
                      className="p-1 rounded bg-white border border-border text-muted-foreground hover:text-[#D0021B] hover:border-[#D0021B]/30 transition-colors">
                      <X size={11} />
                    </button>
                  </div>

                  {/* Section content */}
                  {s.type === "header" && (
                    <div className="px-10 py-8 flex items-start justify-between" style={{ borderBottom: `3px solid ${branding.primaryColor}` }}>
                      <div>
                        {branding.logoUploaded ? (
                          <div className="w-24 h-14 rounded flex items-center justify-center mb-2" style={{ background: branding.primaryColor }}>
                            <span className="text-white text-[12px] font-bold">LOGO</span>
                          </div>
                        ) : (
                          <div className="text-[18px] font-bold mb-1" style={{ color: branding.primaryColor }}>{branding.firmName}</div>
                        )}
                        <div className="text-[11px] text-[#6F6F6F]">ABN {branding.abn}</div>
                      </div>
                      <div className="text-right text-[11px] text-[#6F6F6F] space-y-0.5">
                        <div>{branding.address}</div>
                        <div>{branding.phone} · {branding.email}</div>
                        <div style={{ color: branding.secondaryColor }}>{branding.website}</div>
                      </div>
                    </div>
                  )}

                  {s.type === "recipient" && (
                    <div className="px-10 py-5">
                      <div className="text-[12px] text-[#3D3D3D] whitespace-pre-wrap font-mono leading-relaxed">{s.content}</div>
                    </div>
                  )}

                  {s.type === "body" && (
                    <div className="px-10 py-5">
                      {activeSection === s.id ? (
                        <textarea value={s.content ?? ""} onChange={e => updateContent(s.id, e.target.value)}
                          rows={Math.max(4, (s.content ?? "").split("\n").length + 1)}
                          className="w-full text-[13px] text-[#2D2D2D] leading-relaxed border-none outline-none resize-none bg-transparent placeholder:text-muted-foreground"
                          placeholder="Start typing body content…" />
                      ) : (
                        <div className="text-[13px] text-[#2D2D2D] leading-relaxed whitespace-pre-wrap min-h-[40px]">
                          {s.content || <span className="text-muted-foreground italic">Body paragraph — click to edit</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {s.type === "fee-table" && (
                    <div className="px-10 py-5">
                      <div className="text-[13px] font-semibold mb-3" style={{ color: branding.primaryColor }}>Fee Schedule</div>
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${branding.primaryColor}` }}>
                            {["Service", "Description", "Basis", "Fee (ex-GST)", "GST", "Total"].map(h => (
                              <th key={h} className="text-left py-2 pr-4 font-semibold text-[#3D3D3D] text-[11px]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {INITIAL_FEES.slice(0, 3).map((f, i) => (
                            <tr key={f.id} className={i % 2 !== 0 ? "bg-[#F8F8F8]" : ""}>
                              <td className="py-2 pr-4 font-medium text-[#2D2D2D]">{f.service}</td>
                              <td className="py-2 pr-4 text-[#6F6F6F]">{f.notes || f.service}</td>
                              <td className="py-2 pr-4 text-[#6F6F6F]">{f.basis}</td>
                              <td className="py-2 pr-4 font-semibold">${f.amount.toLocaleString()}</td>
                              <td className="py-2 pr-4 text-[#6F6F6F]">${(f.amount * 0.1).toLocaleString()}</td>
                              <td className="py-2 font-semibold">${(f.amount * 1.1).toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="border-t border-[#D1D1D1]">
                            <td colSpan={5} className="py-2 pr-4 font-semibold text-right text-[#3D3D3D]">Total annual fee incl. GST</td>
                            <td className="py-2 font-bold text-[13px]">$10,890 pa</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-[10px] text-[#9F9F9F] mt-2">Fees are reviewed annually. Payment terms: 14 days from invoice date.</p>
                    </div>
                  )}

                  {s.type === "staff-table" && (
                    <div className="px-10 py-5">
                      <div className="text-[13px] font-semibold mb-3" style={{ color: branding.primaryColor }}>Charge-Out Rates</div>
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${branding.primaryColor}` }}>
                            {["Name", "Role", "Rate (ex-GST/hr)"].map(h => (
                              <th key={h} className="text-left py-2 pr-4 font-semibold text-[#3D3D3D] text-[11px]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {INITIAL_STAFF.map((st, i) => (
                            <tr key={st.id} className={i % 2 !== 0 ? "bg-[#F8F8F8]" : ""}>
                              <td className="py-2 pr-4 font-medium text-[#2D2D2D]">{st.name}</td>
                              <td className="py-2 pr-4 text-[#6F6F6F]">{st.role}</td>
                              <td className="py-2 font-semibold">${st.rate}/hr</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {s.type === "signature" && (
                    <div className="px-10 py-6">
                      <div className="grid grid-cols-2 gap-12">
                        <div>
                          <div className="text-[12px] font-semibold mb-4 text-[#3D3D3D]">Signed on behalf of {branding.firmName}</div>
                          <div className="border-b border-[#3D3D3D] mb-2 h-10" />
                          <div className="text-[11px] text-[#6F6F6F]">Authorized Representative</div>
                          <div className="text-[11px] text-[#6F6F6F]">Date: _______________</div>
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold mb-4 text-[#3D3D3D]">Accepted by Client</div>
                          <div className="border-b border-[#3D3D3D] mb-2 h-10" />
                          <div className="text-[11px] text-[#6F6F6F]">Client Signature</div>
                          <div className="text-[11px] text-[#6F6F6F]">Date: _______________</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {s.type === "footer" && (
                    <div className="px-10 py-4" style={{ borderTop: `2px solid ${branding.primaryColor}` }}>
                      <div className="flex items-center justify-between text-[10px] text-[#9F9F9F]">
                        <span>{branding.firmName} · ABN {branding.abn}</span>
                        <span>Confidential · Page 1 of 1</span>
                        <span style={{ color: branding.secondaryColor }}>{branding.website}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: active section properties */}
        <div className="w-[220px] min-w-[220px] bg-card border-l border-border flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-[12px] font-semibold text-foreground">Section properties</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeS ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Type</label>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F5F5F5] border border-border rounded text-[12px] text-foreground">
                    {sectionTypeIcon[activeS.type]}<span className="capitalize">{activeS.type.replace("-", " ")}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Label</label>
                  <input value={activeS.label} onChange={e => setSections(prev => prev.map(s => s.id === activeS.id ? { ...s, label: e.target.value } : s))}
                    className="w-full px-2.5 py-1.5 text-[12px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]/20 focus:border-[#2855A6]" />
                </div>
                {activeS.type === "body" && (
                  <div className="p-3 rounded-lg bg-[#EEF2FA]/60 border border-[#2855A6]/15 text-[11px] text-[#2855A6]">
                    Click the section on the canvas to edit text inline. Use the Fields panel to insert merge variables.
                  </div>
                )}
                {(activeS.type === "fee-table" || activeS.type === "staff-table") && (
                  <div className="p-3 rounded-lg bg-[#E3F8F5]/60 border border-[#20BCA4]/20 text-[11px] text-[#20BCA4]">
                    This table auto-populates from your <strong>Services & Pricing</strong> settings.
                  </div>
                )}
                <button onClick={() => removeSection(activeS.id)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-[#D0021B]/30 text-[12px] text-[#D0021B] hover:bg-[#FCE8EB] transition-colors">
                  <Trash size={12} />Remove section
                </button>
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">Click a section on the canvas to configure it.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentBuilderScreen;
