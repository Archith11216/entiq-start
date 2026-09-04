import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { PageShell } from "./shared";

// ─── Integration Centre screen ────────────────────────────────────────────────

interface Integration {
  id: string;
  name: string;
  vendor: string;
  category: string;
  direction: string;
  status: "Connected" | "Pending" | "Error" | "Not configured";
  lastSync: string;
  health: "Healthy" | "Degraded" | "Error" | "—";
  description: string;
  modules: string[];
  iconBg: string;
  iconText: string;
  warning?: string;
  capabilities: string[];
}

const INTEGRATIONS: Integration[] = [
  {
    id: "INT-001",
    name: "Xero Practice Manager",
    vendor: "Xero",
    category: "Practice management",
    direction: "Two-way",
    status: "Connected",
    lastSync: "2 min ago",
    health: "Healthy",
    description: "Syncs clients, groups, contacts, jobs, staff and acceptance status with XPM.",
    modules: ["Start", "Practice"],
    iconBg: "bg-[#13B5EA]/10",
    iconText: "text-[#13B5EA]",
    capabilities: ["Client sync", "Job creation on acceptance", "Staff mapping", "Contact enrichment"],
  },
  {
    id: "INT-002",
    name: "Xero Accounting",
    vendor: "Xero",
    category: "Accounting",
    direction: "Two-way",
    status: "Connected",
    lastSync: "11 min ago",
    health: "Healthy",
    description: "Pushes accepted client and entity records into Xero for invoicing and chart of accounts.",
    modules: ["Start", "Accounting"],
    iconBg: "bg-[#13B5EA]/10",
    iconText: "text-[#13B5EA]",
    capabilities: ["Contact creation", "Invoice sync", "Entity mapping", "Engagement fee push"],
  },
  {
    id: "INT-003",
    name: "Claude (Anthropic)",
    vendor: "Anthropic",
    category: "AI assistant",
    direction: "Outbound",
    status: "Connected",
    lastSync: "Just now",
    health: "Healthy",
    description: "Powers intelligent review guidance, risk summaries, document analysis and engagement drafting across EnTIQ modules.",
    modules: ["Start", "Compliance", "Advice"],
    iconBg: "bg-[#D97706]/10",
    iconText: "text-[#D97706]",
    capabilities: ["Review alert summaries", "Risk narrative drafting", "Document Q&A", "Engagement clause suggestions"],
  },
  {
    id: "INT-004",
    name: "ChatGPT (OpenAI)",
    vendor: "OpenAI",
    category: "AI assistant",
    direction: "Outbound",
    status: "Pending",
    lastSync: "—",
    health: "—",
    description: "Optional second AI provider for fallback generation, comparison drafting and staff-facing copilot features.",
    modules: ["Start", "Advice"],
    iconBg: "bg-[#10A37F]/10",
    iconText: "text-[#10A37F]",
    capabilities: ["Fallback generation", "Advice drafting", "Staff copilot", "Template suggestions"],
  },
  {
    id: "INT-005",
    name: "eSign",
    vendor: "External eSign provider",
    category: "Electronic signing",
    direction: "Two-way",
    status: "Connected",
    lastSync: "8 min ago",
    health: "Healthy",
    description: "Sends engagement letters and legal documents for e-signature, tracks signatory events and returns signed certificates. Plugs into the E-Signature step in the Process Builder.",
    modules: ["Start"],
    iconBg: "bg-[#2855A6]/10",
    iconText: "text-[#2855A6]",
    capabilities: ["Envelope creation", "Multi-signatory routing", "Event webhooks", "Signed PDF storage", "Process Builder integration"],
  },
  {
    id: "INT-006",
    name: "Entiq KYC",
    vendor: "Entiq",
    category: "Identity verification",
    direction: "Two-way",
    status: "Connected",
    lastSync: "Just now",
    health: "Healthy",
    description: "Handles all identity checks including document verification, biometric liveness and NFC passport reads. Identity documents and biometric data are stored within Entiq KYC — not in this system. Plugs into all Identity steps in the Process Builder.",
    modules: ["Start", "Compliance"],
    iconBg: "bg-[#20BCA4]/10",
    iconText: "text-[#20BCA4]",
    capabilities: ["Document check", "Biometric liveness", "NFC passport read", "Assurance result", "Identity evidence storage", "Process Builder integration"],
  },
  {
    id: "INT-007",
    name: "ASIC / ABR",
    vendor: "Australian Government",
    category: "Public registers",
    direction: "Inbound",
    status: "Connected",
    lastSync: "1 hr ago",
    health: "Degraded",
    description: "Enriches company and entity records with ASIC register data and ABN lookups.",
    modules: ["Start", "Entity Administration"],
    iconBg: "bg-[#6B7280]/10",
    iconText: "text-[#6B7280]",
    warning: "ASIC register queries are responding slowly. Entity enrichment may be delayed by up to 15 minutes.",
    capabilities: ["Entity status", "Officeholder data", "ABN / ACN lookup", "Address enrichment"],
  },
  {
    id: "INT-009",
    name: "Square",
    vendor: "Block, Inc.",
    category: "Payments",
    direction: "Two-way",
    status: "Connected",
    lastSync: "Just now",
    health: "Healthy",
    description: "Processes client payments via card-on-file, payment links and recurring subscriptions. Payment events post receipts back to Xero for one-click reconciliation.",
    modules: ["Start", "Practice"],
    iconBg: "bg-black/5",
    iconText: "text-black",
    capabilities: ["Card-on-file charges", "Payment links", "Recurring subscriptions", "Payment webhooks", "Xero receipt posting"],
  },
  {
    id: "INT-008",
    name: "Microsoft 365",
    vendor: "Microsoft",
    category: "Productivity",
    direction: "Two-way",
    status: "Connected",
    lastSync: "20 min ago",
    health: "Healthy",
    description: "Connects email, calendar, Teams notifications and SharePoint document links.",
    modules: ["Start", "Practice"],
    iconBg: "bg-[#0078D4]/10",
    iconText: "text-[#0078D4]",
    capabilities: ["Email notifications", "Calendar events", "Teams alerts", "SharePoint links"],
  },
];

// EnTIQ module cross-links
const ENTIQ_MODULES = [
  { id: "M-START", name: "EnTIQ Start", description: "Onboarding, identity checks via Entiq KYC, engagements via eSign, and acceptance.", status: "Active", color: "bg-[#2855A6]" },
  { id: "M-COMP", name: "EnTIQ Compliance", description: "AML/CTF program, ongoing monitoring and risk reviews.", status: "Active", color: "bg-[#20BCA4]" },
  { id: "M-PRAC", name: "EnTIQ Practice", description: "Jobs, WIP, staff capacity and billing.", status: "Active", color: "bg-[#2855A6]" },
  { id: "M-ACCT", name: "EnTIQ Accounting", description: "Tax returns, workpapers and financial statements.", status: "Coming soon", color: "bg-[#6B7280]" },
  { id: "M-ENTITY", name: "EnTIQ Entity Administration", description: "ASIC lodgements, officeholder changes and registers.", status: "Coming soon", color: "bg-[#6B7280]" },
  { id: "M-ADVICE", name: "EnTIQ Advice", description: "Complex tax advice, SOAs and modelling.", status: "Coming soon", color: "bg-[#6B7280]" },
];

const WEBHOOK_EVENTS = [
  { event: "case.accepted", target: "XPM, Xero, E-Sign", case: "C-2024-0885", time: "Today 11:42 am", ok: true },
  { event: "person.verified", target: "Entiq KYC → Compliance module", case: "C-2024-0891", time: "Today 10:15 am", ok: true },
  { event: "proposal.issued", target: "eSign", case: "C-2024-0887", time: "Yesterday 4:51 pm", ok: true },
  { event: "document.rejected", target: "Internal", case: "C-2024-0889", time: "28 Jul 10:22 am", ok: true },
  { event: "entity.enriched", target: "ASIC / ABR", case: "C-2024-0890", time: "28 Jul 9:14 am", ok: false },
];

function intHealthColor(h: string) {
  if (h === "Healthy") return "text-[#2EA843]";
  if (h === "Degraded") return "text-[#F5A623]";
  if (h === "Error") return "text-[#D0021B]";
  return "text-muted-foreground";
}

function intStatusColor(s: string) {
  if (s === "Connected") return "bg-[#E8F7EB] text-[#1E7A31]";
  if (s === "Pending") return "bg-[#F0F0F0] text-[#6F6F6F]";
  if (s === "Error") return "bg-[#FCE8EB] text-[#A80016]";
  return "bg-[#F0F0F0] text-[#6F6F6F]";
}

// Connect modal
function ConnectModal({ integration, onClose }: { integration: Integration; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [connected, setConnected] = useState(false);

  const isAI = integration.category === "AI assistant";

  function handleConnect() {
    setStep(3);
    setTimeout(() => setConnected(true), 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card w-[520px] rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${integration.iconBg} flex items-center justify-center`}>
              <span className={`text-[11px] font-bold ${integration.iconText}`}>{integration.name.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Connect {integration.name}</h2>
              <p className="text-[11px] text-muted-foreground">{integration.vendor} · {integration.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"><XCircle size={17} /></button>
        </div>

        {/* Steps */}
        <div className="px-6 pt-4 flex items-center gap-2">
          {["Authorise", "Permissions", "Confirm"].map((l, i) => (
            <div key={l} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${i + 1 <= step ? "bg-[#2855A6] text-white" : "bg-[#F0F0F0] text-muted-foreground"}`}>
                {i + 1 < step || connected ? <CheckCircle size={13} /> : i + 1}
              </div>
              <span className={`text-[12px] font-medium ${i + 1 <= step ? "text-foreground" : "text-muted-foreground"}`}>{l}</span>
              {i < 2 && <div className={`flex-1 h-px ${i + 1 < step ? "bg-[#2855A6]" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4 min-h-[220px]">
          {step === 1 && (
            <>
              <p className="text-[13px] text-muted-foreground">{integration.description}</p>
              <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-2">
                <p className="text-[12px] font-semibold text-foreground">What EnTIQ will access:</p>
                {integration.capabilities.map(c => (
                  <div key={c} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <CheckCircle size={12} className="text-[#2EA843] shrink-0" />{c}
                  </div>
                ))}
              </div>
              {isAI && (
                <div className="flex items-start gap-2 text-[11px] text-[#B87A1A] bg-[#FEF6E9] px-3 py-2.5 rounded border border-[#F5A623]/30">
                  <Shield size={12} className="shrink-0 mt-0.5" />
                  <span>EnTIQ never sends client identity documents, TFNs or biometric data to AI providers. Only anonymised summaries and structured metadata are used.</span>
                </div>
              )}
              {isAI && (
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1.5">API key</label>
                  <input type="password" placeholder="sk-..." className="w-full px-3 py-2 text-[13px] font-mono bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all" />
                  <p className="mt-1 text-[11px] text-muted-foreground">Stored in the EnTIQ secrets vault. Never logged or exposed.</p>
                </div>
              )}
              {!isAI && (
                <div className="flex items-start gap-2 text-[11px] text-[#1A5DA6] bg-[#E3F0FB] px-3 py-2.5 rounded">
                  <Shield size={12} className="shrink-0 mt-0.5" />
                  <span>You will be redirected to {integration.vendor} to authorise access using OAuth 2.0. No passwords are stored by EnTIQ.</span>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-[13px] text-muted-foreground mb-2">Choose which EnTIQ modules can use this integration and which data may be exchanged.</p>
              <div className="space-y-2">
                {integration.modules.map(m => (
                  <label key={m} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-[#2855A6]/30 cursor-pointer transition-colors">
                    <div>
                      <div className="text-[13px] font-semibold text-foreground">EnTIQ {m}</div>
                      <div className="text-[11px] text-muted-foreground">{integration.capabilities.slice(0, 2).join(", ")}</div>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-[#2855A6] w-4 h-4" />
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F5F5]">
                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-foreground">Restrict to anonymised data only</div>
                  <div className="text-[11px] text-muted-foreground">Never send names, identifiers or documents to this provider</div>
                </div>
                <input type="checkbox" defaultChecked={isAI} className="accent-[#2855A6] w-4 h-4" />
              </div>
            </>
          )}

          {step === 3 && !connected && (
            <div className="flex flex-col items-center justify-center h-36 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#2855A6] border-t-transparent animate-spin" />
              <p className="text-[13px] text-muted-foreground">Verifying credentials and testing connection…</p>
            </div>
          )}

          {step === 3 && connected && (
            <div className="flex flex-col items-center justify-center h-36 gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F7EB] flex items-center justify-center">
                <CheckCircle size={22} className="text-[#2EA843]" />
              </div>
              <p className="text-[14px] font-semibold text-foreground">{integration.name} connected</p>
              <p className="text-[12px] text-muted-foreground">First sync will complete within 2 minutes.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button onClick={() => step > 1 && !connected ? setStep(step - 1) : onClose()} className="px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            {connected ? "Done" : step === 1 ? "Cancel" : "Back"}
          </button>
          {!connected && (
            <button
              onClick={() => step < 3 ? setStep(step + 1) : handleConnect()}
              className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors"
            >
              {step === 2 ? "Connect" : "Continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Configure modal (for already-connected integrations)
function ConfigureModal({ integration, onClose }: { integration: Integration; onClose: () => void }) {
  const [tab, setTab] = useState("Settings");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card w-[580px] rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${integration.iconBg} flex items-center justify-center`}>
              <span className={`text-[10px] font-bold ${integration.iconText}`}>{integration.name.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">{integration.name}</h2>
              <p className="text-[11px] text-muted-foreground">{integration.vendor} · {integration.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-[#2EA843] bg-[#E8F7EB] px-2 py-0.5 rounded">Connected</span>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"><XCircle size={17} /></button>
          </div>
        </div>

        <div className="flex border-b border-border px-6">
          {["Settings", "Permissions", "Logs"].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2.5 text-[12px] font-semibold border-b-2 transition-colors ${tab === t ? "border-[#2855A6] text-[#2855A6]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>
          ))}
        </div>

        <div className="px-6 py-5">
          {tab === "Settings" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[["Last sync", integration.lastSync], ["Health", integration.health], ["Direction", integration.direction], ["Modules", integration.modules.join(", ")]].map(([k, v]) => (
                  <div key={k} className="bg-[#F5F5F5] rounded-lg p-3">
                    <div className="text-[11px] text-muted-foreground mb-0.5">{k}</div>
                    <div className="text-[13px] font-medium text-foreground">{v}</div>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[12px] font-semibold text-foreground mb-2">Capabilities enabled</p>
                <div className="space-y-1.5">
                  {integration.capabilities.map(c => (
                    <label key={c} className="flex items-center justify-between py-1.5 px-3 rounded border border-border">
                      <span className="text-[12px] text-foreground">{c}</span>
                      <input type="checkbox" defaultChecked className="accent-[#2855A6]" />
                    </label>
                  ))}
                </div>
              </div>
              {integration.warning && (
                <div className="flex items-start gap-2 text-[11px] text-[#B87A1A] bg-[#FEF6E9] px-3 py-2.5 rounded">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />{integration.warning}
                </div>
              )}
            </div>
          )}
          {tab === "Permissions" && (
            <div className="space-y-2">
              {integration.modules.map(m => (
                <div key={m} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">EnTIQ {m}</div>
                    <div className="text-[11px] text-muted-foreground">Read + write access granted</div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#2EA843] bg-[#E8F7EB] px-2 py-0.5 rounded">Enabled</span>
                </div>
              ))}
            </div>
          )}
          {tab === "Logs" && (
            <div className="space-y-1">
              {WEBHOOK_EVENTS.slice(0, 4).map((ev, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0 text-[12px]">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${ev.ok ? "bg-[#2EA843]" : "bg-[#D0021B]"}`} />
                  <span className="font-mono text-[11px] text-[#2855A6] w-[150px] shrink-0">{ev.event}</span>
                  <span className="text-muted-foreground flex-1">{ev.target}</span>
                  <span className="text-muted-foreground">{ev.time}</span>
                  <span className={`text-[11px] font-semibold ${ev.ok ? "text-[#2EA843]" : "text-[#D0021B]"}`}>{ev.ok ? "OK" : "Failed"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button className="px-3 py-1.5 text-[12px] font-semibold text-[#D0021B] border border-[#D0021B]/30 rounded hover:bg-[#FCE8EB] transition-colors">Disconnect</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-[13px] font-semibold border border-border rounded hover:bg-muted transition-colors">Close</button>
            <button className="px-4 py-2 text-[13px] font-semibold bg-[#2855A6] text-white rounded hover:bg-[#1F4491] transition-colors">Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationsScreen() {
  const [activeModal, setActiveModal] = useState<{ type: "connect" | "configure"; integration: Integration } | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [integrations, setIntegrations] = useState(INTEGRATIONS);

  const categories = ["All", "Practice management", "Accounting", "AI assistant", "Electronic signing", "Identity verification", "Public registers", "Productivity"];
  const visible = activeCategory === "All" ? integrations : integrations.filter(i => i.category === activeCategory);

  const connectedCount = integrations.filter(i => i.status === "Connected").length;
  const pendingCount = integrations.filter(i => i.status === "Pending" || i.status === "Not configured").length;
  const degradedCount = integrations.filter(i => i.health === "Degraded").length;

  return (
    <>
      {activeModal?.type === "connect" && (
        <ConnectModal
          integration={activeModal.integration}
          onClose={() => {
            setIntegrations(prev => prev.map(i => i.id === activeModal.integration.id ? { ...i, status: "Connected" as const, lastSync: "Just now", health: "Healthy" as const } : i));
            setActiveModal(null);
          }}
        />
      )}
      {activeModal?.type === "configure" && (
        <ConfigureModal integration={activeModal.integration} onClose={() => setActiveModal(null)} />
      )}

      <PageShell
        title="Integration Centre"
        subtitle="Connected systems, sync health and data permissions"
        breadcrumb={["EnTIQ", "Start", "Settings", "Integrations"]}
      >
        {/* Health strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Connected", value: connectedCount, color: "text-[#2EA843]", bg: "bg-[#E8F7EB]" },
            { label: "Pending setup", value: pendingCount, color: "text-muted-foreground", bg: "bg-[#F0F0F0]" },
            { label: "Health alerts", value: degradedCount, color: "text-[#F5A623]", bg: "bg-[#FEF6E9]" },
            { label: "Sync errors (24h)", value: 1, color: "text-[#D0021B]", bg: "bg-[#FCE8EB]" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <span className={`text-[16px] font-bold ${s.color}`}>{s.value}</span>
              </div>
              <span className="text-[12px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* EnTIQ module map */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-[13px] font-semibold text-foreground">EnTIQ platform modules</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Integrations are scoped per module. Active modules share the connected provider pool.</p>
          </div>
          <div className="grid grid-cols-3 gap-0">
            {ENTIQ_MODULES.map((m, i) => (
              <div key={m.id} className={`p-4 ${i % 3 !== 2 ? "border-r border-border" : ""} ${i < 3 ? "border-b border-border" : ""}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${m.color}`} />
                  <span className="text-[13px] font-semibold text-foreground">{m.name}</span>
                  <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${m.status === "Active" ? "bg-[#E8F7EB] text-[#1E7A31]" : "bg-[#F0F0F0] text-[#6F6F6F]"}`}>{m.status}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{m.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded border transition-colors ${activeCategory === c ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-muted-foreground hover:text-foreground bg-card"}`}
            >{c}</button>
          ))}
        </div>

        {/* Integration cards */}
        <div className="grid grid-cols-2 gap-4">
          {visible.map(int => (
            <div key={int.id} className={`bg-card border rounded-lg p-5 hover:shadow-sm transition-shadow ${int.health === "Degraded" ? "border-[#F5A623]/40" : "border-border"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${int.iconBg} flex items-center justify-center shrink-0`}>
                  <span className={`text-[11px] font-bold ${int.iconText}`}>{int.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[14px] font-semibold text-foreground">{int.name}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${intStatusColor(int.status)}`}>{int.status}</span>
                    {int.health !== "—" && (
                      <span className={`text-[11px] font-semibold ${intHealthColor(int.health)}`}>· {int.health}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-2">{int.vendor} · {int.category} · {int.direction}</div>
                  <p className="text-[12px] text-muted-foreground mb-3 leading-snug">{int.description}</p>

                  {/* Module chips */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {int.modules.map(m => (
                      <span key={m} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#EEF2FA] text-[#2855A6]">EnTIQ {m}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    {int.status === "Connected" && (
                      <span className="text-[11px] text-muted-foreground">Last sync: <span className="text-foreground">{int.lastSync}</span></span>
                    )}
                    {int.status !== "Connected" && <span />}
                    <div className="flex gap-2">
                      {int.status === "Connected" ? (
                        <>
                          <button onClick={() => setActiveModal({ type: "configure", integration: int })} className="px-2.5 py-1 text-[11px] font-semibold text-[#2855A6] border border-[#2855A6]/30 rounded hover:bg-[#EEF2FA] transition-colors">Configure</button>
                          <button className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground border border-border rounded hover:bg-muted transition-colors">Logs</button>
                        </>
                      ) : (
                        <button onClick={() => setActiveModal({ type: "connect", integration: int })} className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#2855A6] rounded hover:bg-[#1F4491] transition-colors">Connect</button>
                      )}
                    </div>
                  </div>

                  {int.warning && (
                    <div className="mt-3 flex items-start gap-1.5 text-[11px] text-[#B87A1A] bg-[#FEF6E9] px-3 py-2 rounded">
                      <AlertTriangle size={11} className="shrink-0 mt-0.5" />{int.warning}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Webhook events */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-foreground">Recent webhook events</h3>
            <button className="text-[12px] text-[#2855A6] font-semibold hover:underline">View all events</button>
          </div>
          <div>
            {WEBHOOK_EVENTS.map((ev, i) => (
              <div key={`${ev.event}-${i}`} className={`flex items-center gap-4 px-5 py-3 text-[12px] ${i < WEBHOOK_EVENTS.length - 1 ? "border-b border-border" : ""}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${ev.ok ? "bg-[#2EA843]" : "bg-[#D0021B]"}`} />
                <span className="font-mono text-[11px] text-[#2855A6] w-[160px] shrink-0">{ev.event}</span>
                <span className="text-muted-foreground w-[120px] shrink-0">{ev.case}</span>
                <span className="text-muted-foreground flex-1">{ev.target}</span>
                <span className="text-muted-foreground">{ev.time}</span>
                <span className={`text-[11px] font-semibold ${ev.ok ? "text-[#2EA843]" : "text-[#D0021B]"}`}>{ev.ok ? "Delivered" : "Failed"}</span>
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    </>
  );
}

export default IntegrationsScreen;
