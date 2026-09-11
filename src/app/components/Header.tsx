import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Bell,
  HelpCircle,
  Key,
  Plus,
  ChevronRight,
  X,
  Users,
  Building2,
  Inbox,
  LayoutDashboard,
  FileText,
  CreditCard,
  Activity,
  Layers,
  Settings,
  Workflow,
  DollarSign,
  CheckCircle,
  Shield,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Database,
} from "lucide-react";
import {
  alerts as alertsApi,
  activity as activityApi,
  cases as casesApi,
  clients as clientsApi,
  invitations as invitationsApi,
} from "../../lib/api";
import type {
  OnboardingCase,
  ReviewAlert,
  Invitation,
  ClientEntity,
  ActivityEvent,
} from "../../types/api";
import { useNavigation } from "../NavigationContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(s: string): string {
  const map: Record<string, string> = {
    Draft: "bg-[#F0F0F0] text-[#6F6F6F]",
    Invited: "bg-[#EEF2FA] text-[#2855A6]",
    "In progress": "bg-[#EEF2FA] text-[#2855A6]",
    "Awaiting others": "bg-[#FEF6E9] text-[#B87A1A]",
    Submitted: "bg-[#E8F7EB] text-[#1E7A31]",
    "Internal review": "bg-[#E3F0FB] text-[#1A5DA6]",
    "Proposal issued": "bg-[#EEF2FA] text-[#2855A6]",
    Signed: "bg-[#E8F7EB] text-[#1E7A31]",
    "Acceptance review": "bg-[#FEF6E9] text-[#B87A1A]",
    Accepted: "bg-[#E8F7EB] text-[#1E7A31]",
    Conditional: "bg-[#FEF6E9] text-[#B87A1A]",
    Rejected: "bg-[#FCE8EB] text-[#A80016]",
  };
  return map[s] ?? "bg-[#F0F0F0] text-[#6F6F6F]";
}

function invStatusColor(s: string): string {
  const map: Record<string, string> = {
    Delivered: "bg-[#EEF2FA] text-[#2855A6]",
    Opened: "bg-[#E3F0FB] text-[#1A5DA6]",
    "In progress": "bg-[#FEF6E9] text-[#B87A1A]",
    Completed: "bg-[#E8F7EB] text-[#1E7A31]",
    Expired: "bg-[#FCE8EB] text-[#A80016]",
  };
  return map[s] ?? "bg-[#F0F0F0] text-[#6F6F6F]";
}

function activityDot(type: string): string {
  const colors: Record<string, string> = {
    accept: "bg-[#2EA843]",
    verify: "bg-[#20BCA4]",
    invite: "bg-[#2855A6]",
    proposal: "bg-[#2855A6]",
    exception: "bg-[#F5A623]",
    submit: "bg-[#20BCA4]",
    request: "bg-[#F5A623]",
    reject: "bg-[#D0021B]",
    assign: "bg-[#6F6F6F]",
    open: "bg-[#2855A6]",
    upload: "bg-[#20BCA4]",
  };
  return colors[type] ?? "bg-[#D1D1D1]";
}

// ─── Help & Documentation Modal ───────────────────────────────────────────────

export function HelpModal({
  isOpen,
  onClose,
  onOpenApiKeyModal,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenApiKeyModal?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"guides" | "shortcuts" | "system" | "faqs">("guides");
  const [diagStatus, setDiagStatus] = useState<"loading" | "online" | "offline">("loading");
  const [latency, setLatency] = useState<number | null>(null);

  // Check system health when system tab opened
  useEffect(() => {
    if (isOpen && activeTab === "system") {
      const t0 = performance.now();
      fetch("http://127.0.0.1:8000/api/v1/health")
        .then((res) => {
          const delta = Math.round(performance.now() - t0);
          setLatency(delta);
          if (res.ok) setDiagStatus("online");
          else setDiagStatus("offline");
        })
        .catch(() => {
          setDiagStatus("offline");
        });
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
      <div className="bg-card w-[640px] max-h-[88vh] rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FA] text-[#2855A6] flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-foreground">EnTIQ Start — Help & Quick Reference</h2>
              <p className="text-[11px] text-muted-foreground">Client onboarding, AML/CTF verification & system diagnostics</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border bg-card px-6 pt-2 gap-4 text-[12px]">
          {[
            { id: "guides", label: "Quick Guides" },
            { id: "shortcuts", label: "Keyboard Shortcuts" },
            { id: "system", label: "System Diagnostics" },
            { id: "faqs", label: "FAQs & Support" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-2.5 font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? "border-[#2855A6] text-[#2855A6] font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "guides" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg border border-border bg-card space-y-1.5">
                <div className="flex items-center gap-2 text-[#2855A6] font-semibold text-[13px]">
                  <Inbox size={15} />
                  <span>1. Launching Onboarding & Invitations</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Click <strong>New engagement</strong> or <strong>New invitation</strong> to dispatch an automated onboarding invitation.
                  The client receives an email containing a secure, tokenized magic link directly to their branded self-serve onboarding portal.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-card space-y-1.5">
                <div className="flex items-center gap-2 text-[#2855A6] font-semibold text-[13px]">
                  <Shield size={15} />
                  <span>2. Automated AML/CTF & Biometric KYC</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  EnTIQ verifies identity documents (Passports, Driver Licences, Medicare) and captures live biometric selfies with 3D liveness detection.
                  Cases passing all screening rules are marked <em>Accepted</em>; exceptions trigger instant Review Alerts.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-card space-y-1.5">
                <div className="flex items-center gap-2 text-[#2855A6] font-semibold text-[13px]">
                  <FileText size={15} />
                  <span>3. Engagement Letters & Digital Proposals</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Proposals bundle service line agreements, fee structures, and AML disclosures into a single legally binding document with electronic signatures and audit trails.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-card space-y-1.5">
                <div className="flex items-center gap-2 text-[#2855A6] font-semibold text-[13px]">
                  <Database size={15} />
                  <span>4. SQLite Database & Live API Sync</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  All cases, invitations, clients, and activity logs are stored in your local SQLite database (<code className="bg-muted px-1 py-0.5 rounded text-[11px]">entiq.db</code>).
                  Changes sync in real time with the FastAPI REST server.
                </p>
              </div>
            </div>
          )}

          {activeTab === "shortcuts" && (
            <div className="space-y-2">
              <p className="text-[12px] text-muted-foreground mb-3">Master your workflow with quick keyboard navigation:</p>
              {[
                { keys: ["Ctrl", "K"], desc: "Focus global search bar anywhere in the app" },
                { keys: ["Esc"], desc: "Close search dropdown, notifications, or active modal" },
                { keys: ["?"], desc: "Open this Help & Documentation modal" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border text-[12px]">
                  <span className="text-foreground font-medium">{s.desc}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k) => (
                      <kbd key={k} className="px-2 py-1 text-[11px] font-mono font-semibold bg-card border border-border rounded shadow-xs text-foreground">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "system" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${diagStatus === "online" ? "bg-emerald-500 animate-pulse" : diagStatus === "loading" ? "bg-amber-400 animate-spin" : "bg-red-500"}`} />
                    <span className="font-semibold text-[13px] text-foreground">FastAPI Backend Service</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${diagStatus === "online" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                    {diagStatus === "online" ? "Operational" : diagStatus === "loading" ? "Connecting…" : "Offline"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1">
                  <div>Endpoint: <code className="text-foreground">http://127.0.0.1:8000</code></div>
                  <div>Latency: <span className="text-foreground font-medium">{latency !== null ? `${latency}ms` : "—"}</span></div>
                  <div>Database Engine: <span className="text-foreground font-medium">SQLite 3 (entiq.db)</span></div>
                  <div>Practice: <span className="text-foreground font-medium">Grow Advisory Group</span></div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-[12px] font-bold text-emerald-900">API Key & SQLite DB Management</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Inspect tables, execute raw queries, and manage live API credentials.</p>
                </div>
                {onOpenApiKeyModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenApiKeyModal();
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[12px] font-semibold transition-colors shadow-xs"
                  >
                    Open DB & API Keys
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "faqs" && (
            <div className="space-y-3">
              {[
                {
                  q: "How does the client access their onboarding portal?",
                  a: "Clients receive a unique, tamper-proof onboarding link via email. They can complete their questionnaire, biometric identity verification, and sign engagement letters on any smartphone, tablet, or desktop without downloading an app.",
                },
                {
                  q: "What happens when an identity check expires or fails?",
                  a: "If an identity document is expired or biometric likeness score is below threshold, EnTIQ automatically files a Review Alert in your dashboard. You can review the details, request additional information, or manually accept the case.",
                },
                {
                  q: "Where is my data stored?",
                  a: "All firm cases, invitations, and audit events are stored securely in your local SQLite database (entiq.db) with ISO 27001 compliant architecture and API key authentication.",
                },
              ].map((faq, i) => (
                <div key={i} className="p-3.5 rounded-lg border border-border bg-card space-y-1">
                  <h4 className="text-[12px] font-semibold text-foreground">{faq.q}</h4>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
              <div className="pt-2 text-center">
                <span className="text-[11px] text-muted-foreground">Need dedicated assistance? </span>
                <a href="mailto:andrew@growadvisorygroup.com.au" className="text-[11px] text-[#2855A6] font-semibold hover:underline">
                  Contact firm administrator
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>EnTIQ Start Version 1.0.0</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#2855A6] text-white font-medium rounded hover:bg-[#1F4491] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Header Props ─────────────────────────────────────────────────────────────

export interface HeaderProps {
  breadcrumb?: string[];
  onNewInvitation?: () => void;
  onOpenApiKeyModal?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

// ─── Header Component ─────────────────────────────────────────────────────────

export function Header({
  breadcrumb,
  onNewInvitation,
  onOpenApiKeyModal,
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const nav = useNavigation();
  const [localQuery, setLocalQuery] = useState(searchQuery || "");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<"all" | "alerts">("all");
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [isMarkedAllRead, setIsMarkedAllRead] = useState(false);

  // Live data states
  const [liveAlerts, setLiveAlerts] = useState<ReviewAlert[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityEvent[]>([]);
  const [allCases, setAllCases] = useState<OnboardingCase[]>([]);
  const [allClients, setAllClients] = useState<ClientEntity[]>([]);
  const [allInvitations, setAllInvitations] = useState<Invitation[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch live alerts & activity & cases & clients
  const fetchData = useCallback(async () => {
    try {
      const [alertsRes, actRes, casesRes, clientsRes, invRes] = await Promise.allSettled([
        alertsApi.list(),
        activityApi.list(),
        casesApi.list(),
        clientsApi.list(),
        invitationsApi.list(),
      ]);
      if (alertsRes.status === "fulfilled") setLiveAlerts(alertsRes.value || []);
      if (actRes.status === "fulfilled") setRecentActivities(actRes.value.items?.slice(0, 6) || []);
      if (casesRes.status === "fulfilled") setAllCases(casesRes.value.items || []);
      if (clientsRes.status === "fulfilled") setAllClients(clientsRes.value.items || []);
      if (invRes.status === "fulfilled") setAllInvitations(invRes.value.items || []);
    } catch {
      // Fallbacks maintained
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync with prop if provided
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== localQuery) {
      setLocalQuery(searchQuery);
    }
  }, [searchQuery]);

  const activeAlerts = liveAlerts.filter((a) => !dismissedAlertIds.includes(a.id));
  const unreadAlertCount = isMarkedAllRead ? 0 : activeAlerts.length;

  // Search Results
  const searchResults = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    const allPages = [
      { id: "dashboard", label: "Start Dashboard", icon: LayoutDashboard, category: "Overview" },
      { id: "cases", label: "Onboarding Cases", icon: Users, category: "Workflow" },
      { id: "invitations", label: "Invitations & Links", icon: Inbox, category: "Workflow" },
      { id: "clients", label: "Clients & Entities", icon: Building2, category: "Records" },
      { id: "engagements", label: "Engagements & Proposals", icon: FileText, category: "Legal" },
      { id: "billing", label: "Billing & Invoices", icon: CreditCard, category: "Finance" },
      { id: "process-builder", label: "Process Builder", icon: Workflow, category: "Workflow" },
      { id: "activity", label: "Activity Audit Log", icon: Activity, category: "Compliance" },
      { id: "templates", label: "Template Manager", icon: Layers, category: "Settings" },
      { id: "services", label: "Services & Pricing", icon: DollarSign, category: "Settings" },
      { id: "integrations", label: "Integrations & Webhooks", icon: Settings, category: "Settings" },
    ];

    if (!q) {
      return {
        cases: [],
        clients: [],
        invitations: [],
        pages: allPages.slice(0, 8),
        total: 8,
      };
    }

    const matchedCases = allCases
      .filter(
        (c) =>
          c.client.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.entity.toLowerCase().includes(q) ||
          c.service.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const matchedClients = allClients
      .filter(
        (cl) =>
          cl.name.toLowerCase().includes(q) ||
          cl.type.toLowerCase().includes(q) ||
          (cl.abn && cl.abn.toLowerCase().includes(q))
      )
      .slice(0, 4);

    const matchedInvitations = allInvitations
      .filter(
        (inv) =>
          inv.client.toLowerCase().includes(q) ||
          inv.email.toLowerCase().includes(q) ||
          inv.service.toLowerCase().includes(q) ||
          inv.status.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedPages = allPages.filter((p) => p.label.toLowerCase().includes(q));

    return {
      cases: matchedCases,
      clients: matchedClients,
      invitations: matchedInvitations,
      pages: matchedPages,
      total: matchedCases.length + matchedClients.length + matchedInvitations.length + matchedPages.length,
    };
  }, [localQuery, allCases, allClients, allInvitations]);

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsHelpOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQueryChange = (val: string) => {
    setLocalQuery(val);
    if (onSearchChange) onSearchChange(val);
    if (!isSearchOpen) setIsSearchOpen(true);
  };

  const currentBreadcrumbs = breadcrumb ?? ["EnTIQ", "Start", "Dashboard"];
  const handleNewAction = onNewInvitation || nav?.openNewInvitation;
  const handleApiKeyAction = onOpenApiKeyModal || nav?.openApiKeyModal;

  return (
    <>
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onOpenApiKeyModal={handleApiKeyAction}
      />

      <header className="h-[52px] min-h-[52px] bg-card border-b border-border flex items-center px-6 gap-4 relative z-40">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          {currentBreadcrumbs.map((b, i) => (
            <span key={b} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={12} />}
              <span className={i === currentBreadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
                {b}
              </span>
            </span>
          ))}
        </div>

        <div className="flex-1" />

        {/* Global Search with Autocomplete Dropdown */}
        <div className="relative" ref={searchRef}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={localQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search cases, clients, entities…"
            className="w-[280px] pl-8 pr-8 py-1.5 text-[13px] bg-[#F5F5F5] border border-border rounded placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2855A6]/30 focus:border-[#2855A6] focus:bg-card transition-all"
          />
          {localQuery && (
            <button
              onClick={() => handleQueryChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {isSearchOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-[380px] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
              <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60 p-2">
                {/* Cases Results */}
                {searchResults.cases.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Cases ({searchResults.cases.length})
                    </div>
                    {searchResults.cases.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          if (nav?.openCaseDetail) {
                            nav.openCaseDetail(c);
                          } else {
                            nav?.setActiveNav("cases");
                          }
                          setIsSearchOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#EEF2FA] rounded-lg transition-colors flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded bg-[#EEF2FA] text-[#2855A6] flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                            <Users size={12} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[13px] text-foreground truncate">{c.client}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">{c.id}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">{c.entity} · {c.service}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${statusColor(c.status)}`}>
                          {c.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Clients Results */}
                {searchResults.clients.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Clients & Entities ({searchResults.clients.length})
                    </div>
                    {searchResults.clients.map((cl) => (
                      <button
                        key={cl.id}
                        onClick={() => {
                          nav?.setActiveNav("clients");
                          setIsSearchOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#EEF2FA] rounded-lg transition-colors flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded bg-[#EEF2FA] text-[#2855A6] flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                            <Building2 size={12} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[13px] text-foreground truncate">{cl.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{cl.type} {cl.abn ? `· ABN ${cl.abn}` : ""}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium shrink-0">{cl.status}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Invitations Results */}
                {searchResults.invitations.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Invitations ({searchResults.invitations.length})
                    </div>
                    {searchResults.invitations.map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => {
                          nav?.setActiveNav("invitations");
                          setIsSearchOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#EEF2FA] rounded-lg transition-colors flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded bg-[#EEF2FA] text-[#2855A6] flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                            <Inbox size={12} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[13px] text-foreground truncate">{inv.client}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{inv.email} · {inv.service}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${invStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Navigation Pages */}
                {searchResults.pages.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {localQuery ? "Navigation" : "Quick Jump"}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {searchResults.pages.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            nav?.setActiveNav(p.id);
                            setIsSearchOpen(false);
                          }}
                          className="text-left px-3 py-1.5 hover:bg-[#EEF2FA] rounded-lg transition-colors flex items-center gap-2 group"
                        >
                          <div className="w-5 h-5 rounded bg-muted text-muted-foreground flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-[#2855A6] transition-colors">
                            <p.icon size={12} />
                          </div>
                          <span className="text-[12px] font-medium text-foreground truncate">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.total === 0 && (
                  <div className="py-8 text-center text-muted-foreground space-y-1">
                    <Search size={20} className="mx-auto text-muted-foreground/60" />
                    <p className="text-[13px] font-medium text-foreground">No matching results found</p>
                    <p className="text-[11px]">Try searching by client name, case ID, entity or service.</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 bg-muted/30 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Navigate with click or search</span>
                <span>Press <strong>Esc</strong> to close</span>
              </div>
            </div>
          )}
        </div>

        {/* Notifications (Bell Icon) */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
              setIsSearchOpen(false);
            }}
            title="Notifications & Review Alerts"
            className="relative p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Bell size={16} />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#D0021B] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-[400px] bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-foreground">Notifications</span>
                  {unreadAlertCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-[#D0021B]/10 text-[#D0021B] text-[10px] font-bold rounded-full">
                      {unreadAlertCount} unread
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadAlertCount > 0 && (
                    <button
                      onClick={() => setIsMarkedAllRead(true)}
                      className="text-[11px] text-[#2855A6] hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border bg-card px-3 pt-2 gap-2 text-[12px]">
                <button
                  onClick={() => setNotificationTab("all")}
                  className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
                    notificationTab === "all"
                      ? "border-[#2855A6] text-[#2855A6]"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({activeAlerts.length + recentActivities.length})
                </button>
                <button
                  onClick={() => setNotificationTab("alerts")}
                  className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
                    notificationTab === "alerts"
                      ? "border-[#2855A6] text-[#2855A6]"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Review Alerts ({activeAlerts.length})
                </button>
              </div>

              {/* Items List */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-border/60">
                {/* Active Review Alerts */}
                {activeAlerts.map((a) => (
                  <div
                    key={a.id}
                    className={`p-3 border-l-3 transition-colors ${
                      a.severity === "error"
                        ? "border-l-[#D0021B] bg-[#FCE8EB]/30"
                        : a.severity === "warning"
                        ? "border-l-[#F5A623] bg-[#FEF6E9]/40"
                        : "border-l-[#2855A6] bg-[#EEF2FA]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                          a.severity === "error" ? "text-[#D0021B]" : a.severity === "warning" ? "text-[#B87A1A]" : "text-[#2855A6]"
                        }`}>
                          {a.type}
                        </span>
                        <span className="text-muted-foreground text-[10px]">·</span>
                        <button
                          onClick={() => {
                            const target = allCases.find((c) => c.id === a.case);
                            if (target && nav?.openCaseDetail) {
                              nav.openCaseDetail(target);
                            } else {
                              nav?.setActiveNav("cases");
                            }
                            setIsNotificationsOpen(false);
                          }}
                          className="font-mono text-[11px] text-[#2855A6] font-semibold hover:underline"
                        >
                          {a.case}
                        </button>
                        <span className="text-[10px] text-muted-foreground ml-auto">{a.age} ago</span>
                      </div>
                    </div>
                    <p className="text-[12px] text-foreground leading-snug mt-1">{a.message}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const target = allCases.find((c) => c.id === a.case);
                          if (target && nav?.openCaseDetail) {
                            nav.openCaseDetail(target);
                          } else {
                            nav?.setActiveNav("cases");
                          }
                          setIsNotificationsOpen(false);
                        }}
                        className="text-[11px] font-semibold text-[#2855A6] hover:bg-[#EEF2FA] px-2 py-1 rounded transition-colors"
                      >
                        Review case →
                      </button>
                      <button
                        onClick={async () => {
                          setDismissedAlertIds((prev) => [...prev, a.id]);
                          try { await alertsApi.dismiss(a.id); } catch {}
                        }}
                        className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}

                {/* Activity items if tab === "all" */}
                {notificationTab === "all" &&
                  recentActivities.map((ev) => (
                    <div key={ev.id} className="p-3 hover:bg-muted/40 transition-colors flex gap-3 items-start">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activityDot(ev.type)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-0.5">
                          <span className="text-[12px] font-semibold text-foreground">{ev.action}</span>
                          <span className="text-[10px] text-muted-foreground">{ev.time}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1">{ev.target}</p>
                        <span className="text-[10px] text-muted-foreground">by {ev.actor}</span>
                      </div>
                    </div>
                  ))}

                {activeAlerts.length === 0 && (notificationTab === "alerts" || recentActivities.length === 0) && (
                  <div className="py-8 text-center text-muted-foreground space-y-1">
                    <CheckCircle size={24} className="mx-auto text-emerald-500" />
                    <p className="text-[13px] font-medium text-foreground">You're all caught up!</p>
                    <p className="text-[11px]">No unresolved review alerts or notifications.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 border-t border-border bg-muted/20 text-center">
                <button
                  onClick={() => {
                    nav?.setActiveNav("activity");
                    setIsNotificationsOpen(false);
                  }}
                  className="text-[11px] text-[#2855A6] font-semibold hover:underline"
                >
                  View full audit log in Activity →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Beside Icon (Help & Support) */}
        <button
          onClick={() => {
            setIsHelpOpen(true);
            setIsNotificationsOpen(false);
            setIsSearchOpen(false);
          }}
          title="Help, Quick Guides & Diagnostics (?)"
          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <HelpCircle size={16} />
        </button>

        {/* Action Button */}
        {handleNewAction && (
          <button
            onClick={handleNewAction}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors shadow-xs"
          >
            <Plus size={14} />
            New engagement
          </button>
        )}
      </header>
    </>
  );
}

export default Header;
