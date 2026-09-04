import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import IntegrationsScreen from "./IntegrationsScreen";
import ProcessBuilderScreen from "./ProcessBuilderScreen";
import ServicesScreen from "./ServicesScreen";
import { INITIAL_FEES, INITIAL_STAFF } from "./ServicesScreen";
import BillingScreen from "./BillingScreen";
import DocumentBuilderScreen from "./DocumentBuilderScreen";
import { auth as authApi, cases as casesApi, alerts as alertsApi, invitations as invitationsApi, clients as clientsApi, engagements as engagementsApi, activity as activityApi, templates as templatesApi, ApiError, exportToCsv } from "../lib/api";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import type { OnboardingCase as ApiCase, ReviewAlert as ApiAlert, Invitation, ClientEntity, Engagement as ApiEngagement, ActivityEvent as ApiActivityEvent, Template as ApiTemplate } from "../types/api";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  MoreHorizontal,
  Shield,
  TrendingUp,
  Building2,
  UserCheck,
  Inbox,
  Activity,
  LogOut,
  HelpCircle,
  Layers,
  Workflow,
  Trash2,
  Copy,
  GitBranch,
  Fingerprint,
  ScanFace,
  FileCheck,
  CreditCard,
  MessageSquare,
  UserCog,
  Network,
  Pen,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Save,
  RotateCcw,
  Sparkles,
  Wand2,
  Pencil,
  BookOpen,
  Scale,
  Briefcase,
  Hash,
  List,
  PenLine,
  CheckSquare,
  X,
  Upload,
  DollarSign,
  Users2,
  Palette,
  Type,
  Image,
  AlignLeft,
  Table,
  PenSquare,
  ChevronsUpDown,
  GripVertical,
  Link,
  SquarePen,
  Trash,
  Package,
  IndentIncrease,
} from "lucide-react";

// ─── Types (local aliases for API types) ──────────────────────────────────────

type CaseStatus = ApiCase["status"];
type RiskLevel = ApiCase["risk"];
type OnboardingCase = ApiCase;
type ReviewAlert = ApiAlert;

// ─── API data hook ────────────────────────────────────────────────────────────

function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const countRef = useRef(0);

  const fetch = useCallback(() => {
    const id = ++countRef.current;
    setLoading(true);
    setError(null);
    fetcher()
      .then((res) => { if (id === countRef.current) setData(res); })
      .catch((err) => { if (id === countRef.current) setError(err instanceof ApiError ? err.message : "Failed to load data"); })
      .finally(() => { if (id === countRef.current) setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`flex gap-4 px-4 py-3 ${i < rows - 1 ? "border-b border-border" : ""}`}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className={`h-3 rounded bg-[#F0F0F0] ${j === 1 ? "flex-[2]" : "flex-1"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${count} gap-3 animate-pulse`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="h-2.5 w-20 rounded bg-[#F0F0F0] mb-2" />
          <div className="h-7 w-10 rounded bg-[#F0F0F0]" />
        </div>
      ))}
    </div>
  );
}

function ApiErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#FCE8EB] border border-[#D0021B]/20 text-[13px] text-[#A80016]">
      <AlertTriangle size={15} className="shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onRetry} className="text-[12px] font-semibold underline hover:no-underline">Retry</button>
    </div>
  );
}

// ─── Login screen ─────────────────────────────────────────────────────────────

function LoginScreen() {
  const { login, error, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password).catch(() => { /* error shown via context */ });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-[#2855A6] flex items-center justify-center">
            <span className="text-white text-[13px] font-bold tracking-tight">EN</span>
          </div>
          <div>
            <div className="text-[18px] font-bold text-foreground leading-none">EnTIQ</div>
            <div className="text-[11px] text-[#20BCA4] font-semibold tracking-wide">START</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          <h1 className="text-[20px] font-bold text-foreground mb-1">Sign in</h1>
          <p className="text-[13px] text-muted-foreground mb-6">Enter your practice credentials to continue.</p>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-[#FCE8EB] border border-[#D0021B]/20 text-[12px] text-[#A80016]">
              <AlertTriangle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-foreground mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourfirm.com.au"
                autoComplete="email"
                className="w-full px-3 py-2.5 text-[13px] bg-[#F5F5F5] border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2855A6]/30 focus:border-[#2855A6] transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-semibold text-foreground">Password</label>
                <button type="button" className="text-[11px] text-[#2855A6] hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 text-[13px] bg-[#F5F5F5] border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2855A6]/30 focus:border-[#2855A6] transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F4491] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : "Sign in"}
            </button>
          </form>

          <div className="mt-5 px-3 py-2.5 bg-[#FEF6E9] border border-[#F5A623]/30 rounded-lg">
            <p className="text-[11px] text-[#B87A1A] text-center">
              <span className="font-semibold">Dev mode</span> — leave fields empty and press Sign in to bypass auth
            </p>
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-4">
            Secured by EnTIQ · <span className="text-[#2855A6]">ISO 27001</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Mock data (used as fallback when API is unavailable) ─────────────────────

const CASES: OnboardingCase[] = [
  { id: "C-2024-0900", client: "Manoj Tech Solutions Pty Ltd", entity: "Company", service: "Company Tax + Advisory", status: "Accepted", risk: "Low", owner: "J. Okafor", created: "Today", due: "18 Sept", channel: "Invitation", progress: 100 },
  { id: "C-2024-0899", client: "Manoj Kumar", entity: "Individual", service: "Individual Tax", status: "Accepted", risk: "Low", owner: "J. Okafor", created: "Today", due: "18 Sept", channel: "Invitation", progress: 100 },
  { id: "C-2024-0891", client: "Harrington, Sophie", entity: "Individual", service: "Individual Tax", status: "Internal review", risk: "Low", owner: "J. Okafor", created: "22 Jul", due: "31 Jul", channel: "Invitation", progress: 88 },
  { id: "C-2024-0890", client: "Northfield Holdings Pty Ltd", entity: "Company", service: "Company Tax + Advisory", status: "Acceptance review", risk: "Medium", owner: "A. Brennan", created: "20 Jul", due: "28 Jul", channel: "QR code", progress: 97 },
  { id: "C-2024-0889", client: "The Marcelline Family Trust", entity: "Trust", service: "Trust Tax", status: "Awaiting others", risk: "High", owner: "J. Okafor", created: "18 Jul", due: "25 Jul", channel: "Referral", progress: 54 },
  { id: "C-2024-0888", client: "Chen, David & Liu, Wei", entity: "Individual group", service: "Individual Tax × 2", status: "In progress", risk: "Low", owner: "S. Patel", created: "17 Jul", due: "30 Jul", channel: "Share My EnTIQ", progress: 41 },
  { id: "C-2024-0887", client: "Apex Ventures Pty Ltd", entity: "Company", service: "Company Tax + BAS", status: "Proposal issued", risk: "Medium", owner: "A. Brennan", created: "15 Jul", due: "22 Jul", channel: "Invitation", progress: 72 },
  { id: "C-2024-0886", client: "Caldwell SMSF", entity: "SMSF", service: "SMSF Administration", status: "Submitted", risk: "Low", owner: "S. Patel", created: "14 Jul", due: "21 Jul", channel: "Invitation", progress: 100 },
  { id: "C-2024-0885", client: "Greenbrook Unit Trust", entity: "Trust", service: "Trust Tax + Advisory", status: "Accepted", risk: "Low", owner: "J. Okafor", created: "10 Jul", due: "18 Jul", channel: "Referral", progress: 100 },
  { id: "C-2024-0884", client: "Nguyen, Thanh", entity: "Individual", service: "Individual Tax", status: "Invited", risk: "Low", owner: "S. Patel", created: "28 Jul", due: "11 Aug", channel: "Invitation", progress: 0 },
  { id: "C-2024-0883", client: "Blackwood & Associates", entity: "Partnership", service: "Partnership Tax", status: "Rejected", risk: "High", owner: "A. Brennan", created: "5 Jul", due: "15 Jul", channel: "Invitation", progress: 100 },
  { id: "C-2024-0882", client: "Tran, Linh Phuong", entity: "Individual", service: "Individual Tax", status: "In progress", risk: "Low", owner: "S. Patel", created: "25 Jul", due: "8 Aug", channel: "QR code", progress: 28 },
];

const ALERTS: ReviewAlert[] = [
  { id: "A-001", type: "identity", severity: "error", case: "C-2024-0889", message: "Entiq KYC: identity check flagged — document expired 14 July. Review result in Entiq KYC.", age: "3d" },
  { id: "A-002", type: "commercial", severity: "warning", case: "C-2024-0890", message: "Proposed fee 18% below recommended price — partner approval required", age: "1d" },
  { id: "A-003", type: "conflict", severity: "warning", case: "C-2024-0891", message: "Potential related-party match detected against existing client Harrington, T.", age: "5h" },
  { id: "A-004", type: "document", severity: "warning", case: "C-2024-0887", message: "Proposal unsigned — 7 days since issue, no client response", age: "7d" },
  { id: "A-005", type: "compliance", severity: "error", case: "C-2024-0889", message: "Trust deed date predates beneficiary relationship record by 4 years", age: "2d" },
];

const conversionData = [
  { stage: "Invited", count: 48 },
  { stage: "Opened", count: 41 },
  { stage: "In progress", count: 35 },
  { stage: "Submitted", count: 29 },
  { stage: "Signed", count: 24 },
  { stage: "Accepted", count: 21 },
];

const completionTrend = [
  { week: "W1", time: 18 },
  { week: "W2", time: 16 },
  { week: "W3", time: 19 },
  { week: "W4", time: 14 },
  { week: "W5", time: 12 },
  { week: "W6", time: 11 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(s: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
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

function riskColor(r: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    Low: "text-[#2EA843]",
    Medium: "text-[#F5A623]",
    High: "text-[#D0021B]",
    Critical: "text-[#D0021B] font-semibold",
  };
  return map[r];
}

function alertIcon(type: ReviewAlert["type"]) {
  const icons = {
    identity: <UserCheck size={14} />,
    document: <FileText size={14} />,
    commercial: <TrendingUp size={14} />,
    conflict: <Users size={14} />,
    compliance: <Shield size={14} />,
  };
  return icons[type];
}

function alertBg(severity: ReviewAlert["severity"]): string {
  return severity === "error"
    ? "border-l-[#D0021B] bg-[#FCE8EB]/40"
    : severity === "warning"
    ? "border-l-[#F5A623] bg-[#FEF6E9]/60"
    : "border-l-[#2855A6] bg-[#EEF2FA]/60";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className={`p-2 rounded-lg ${accent ?? "bg-muted"}`}>{icon}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[28px] font-700 leading-none text-foreground" style={{ fontWeight: 700 }}>{value}</span>
        {sub && <span className="text-[12px] text-muted-foreground mb-0.5">{sub}</span>}
      </div>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const color =
    pct === 100 ? "#2EA843" : pct >= 70 ? "#2855A6" : pct >= 40 ? "#F5A623" : "#D1D1D1";
  return (
    <div className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
      <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all" />
    </div>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold leading-5 whitespace-nowrap ${statusColor(status)}`}>
      {status}
    </span>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Start Dashboard", icon: <LayoutDashboard size={16} />, id: "dashboard" },
  { label: "Onboarding Cases", icon: <Layers size={16} />, id: "cases" },
  { label: "Invitations", icon: <Inbox size={16} />, id: "invitations" },
  { label: "Clients & Entities", icon: <Building2 size={16} />, id: "clients" },
  { label: "Engagements", icon: <FileText size={16} />, id: "engagements" },
  { label: "Billing & Payments", icon: <CreditCard size={16} />, id: "billing" },
  { label: "Process Builder", icon: <Workflow size={16} />, id: "process-builder" },
  { label: "Activity", icon: <Activity size={16} />, id: "activity" },
];

const SETTINGS_ITEMS = [
  { label: "Template Manager", icon: <FileText size={16} />, id: "templates" },
  { label: "Services & Pricing", icon: <DollarSign size={16} />, id: "services" },
  { label: "Integrations", icon: <Settings size={16} />, id: "integrations" },
];

function Sidebar({ active, setActive }: { active: string; setActive: (id: string) => void }) {
  const { user, logout } = useAuth();
  const initials = user?.initials ?? "JO";
  const displayName = user?.displayName ?? "J. Okafor";
  const role = user?.role ?? "Partner";

  return (
    <aside className="w-[220px] min-w-[220px] h-full bg-card border-r border-border flex flex-col">
      {/* Logo / product identity */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#2855A6] flex items-center justify-center">
            <span className="text-white text-[11px] font-bold tracking-tight">EN</span>
          </div>
          <div>
            <div className="text-[13px] font-semibold text-foreground leading-none">EnTIQ</div>
            <div className="text-[10px] text-[#20BCA4] font-semibold tracking-wide leading-none mt-0.5">START</div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-[13px] text-left transition-colors ${
              active === item.id
                ? "bg-[#EEF2FA] text-[#2855A6] font-semibold"
                : "text-[#6F6F6F] hover:bg-[#F5F5F5] hover:text-foreground"
            }`}
          >
            <span className={active === item.id ? "text-[#2855A6]" : "text-[#9F9F9F]"}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="pt-4 pb-1 px-3">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Settings</span>
        </div>
        {SETTINGS_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-[13px] text-left transition-colors ${
              active === item.id
                ? "bg-[#EEF2FA] text-[#2855A6] font-semibold"
                : "text-[#6F6F6F] hover:bg-[#F5F5F5] hover:text-foreground"
            }`}
          >
            <span className="text-[#9F9F9F]">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#2855A6] flex items-center justify-center text-white text-[11px] font-semibold">{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-foreground leading-none truncate">{displayName}</div>
            <div className="text-[11px] text-muted-foreground">{role}</div>
          </div>
          <button onClick={() => logout()} title="Sign out" className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ onNewInvitation }: { onNewInvitation: () => void; }) {
  return (
    <header className="h-[52px] min-h-[52px] bg-card border-b border-border flex items-center px-6 gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <span>EnTIQ</span>
        <ChevronRight size={12} />
        <span className="text-foreground font-medium">Start</span>
        <ChevronRight size={12} />
        <span className="text-foreground font-medium">Dashboard</span>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search cases, clients, entities…"
          className="w-[280px] pl-8 pr-4 py-1.5 text-[13px] bg-[#F5F5F5] border border-border rounded placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2855A6]/30 focus:border-[#2855A6] transition-all"
        />
      </div>

      {/* Actions */}
      <button className="relative p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
        <Bell size={16} />
        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#D0021B] rounded-full" />
      </button>
      <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
        <HelpCircle size={16} />
      </button>

      <button
        onClick={onNewInvitation}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors"
      >
        <Plus size={14} />
        New engagement
      </button>
    </header>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const STATUSES: CaseStatus[] = [
  "Draft", "Invited", "In progress", "Awaiting others", "Submitted",
  "Internal review", "Proposal issued", "Signed", "Acceptance review",
  "Accepted", "Conditional", "Rejected",
];

function FilterBar({
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  ownerFilter = "",
  setOwnerFilter,
  channelFilter = "",
  setChannelFilter,
  onExport,
}: {
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  search: string;
  setSearch: (s: string) => void;
  ownerFilter?: string;
  setOwnerFilter?: (o: string) => void;
  channelFilter?: string;
  setChannelFilter?: (c: string) => void;
  onExport?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by client or entity…"
          className="pl-7 pr-3 py-1.5 text-[12px] bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] w-[220px] transition-all"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="text-[12px] border border-border rounded px-2.5 py-1.5 bg-card focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] appearance-none pr-7 cursor-pointer"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236F6F6F' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <select
        value={ownerFilter}
        onChange={(e) => setOwnerFilter && setOwnerFilter(e.target.value)}
        className="text-[12px] border border-border rounded px-2.5 py-1.5 bg-card focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] appearance-none pr-7 cursor-pointer"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236F6F6F' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
      >
        <option value="">All owners</option>
        <option value="J. Okafor">J. Okafor</option>
        <option value="A. Brennan">A. Brennan</option>
        <option value="S. Patel">S. Patel</option>
      </select>

      <select
        value={channelFilter}
        onChange={(e) => setChannelFilter && setChannelFilter(e.target.value)}
        className="text-[12px] border border-border rounded px-2.5 py-1.5 bg-card focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] appearance-none pr-7 cursor-pointer"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236F6F6F' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
      >
        <option value="">All channels</option>
        <option value="Invitation">Invitation</option>
        <option value="QR code">QR code</option>
        <option value="Referral">Referral</option>
        <option value="Share My EnTIQ">Share My EnTIQ</option>
      </select>

      <div className="flex-1" />

      {onExport && (
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
        >
          <Download size={12} />
          Export
        </button>
      )}
    </div>
  );
}

// ─── Cases Table ──────────────────────────────────────────────────────────────

function CasesTable({
  cases,
  onSelect,
}: {
  cases: OnboardingCase[];
  onSelect: (c: OnboardingCase) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(cases.length / pageSize));
  const displayedCases = cases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-border bg-[#FAFAFA]">
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[100px]">Case ID</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Client</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[110px]">Entity</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Service</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[140px]">Status</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[80px]">Progress</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[60px]">Risk</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[80px]">Owner</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[70px]">Due</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {displayedCases.map((c, i) => (
            <tr
              key={c.id}
              onClick={() => onSelect(c)}
              className={`border-b border-border last:border-0 hover:bg-[#F8FAFF] cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-[#FAFAFA]/50"}`}
            >
              <td className="px-4 py-3">
                <span className="font-mono text-[11px] text-[#2855A6]">{c.id}</span>
              </td>
              <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">{c.client}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.entity}</td>
              <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">{c.service}</td>
              <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <ProgressBar pct={c.progress} />
                  <span className="text-[11px] text-muted-foreground w-7 text-right">{c.progress}%</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`text-[11px] font-semibold ${riskColor(c.risk)}`}>{c.risk}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{c.owner}</td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.due}</td>
              <td className="px-4 py-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(c); }}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MoreHorizontal size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {cases.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-[13px]">
          No cases match your current filters.
        </div>
      )}

      <div className="px-4 py-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{cases.length} case{cases.length !== 1 ? "s" : ""} shown</span>
        <div className="flex items-center gap-3">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="hover:text-foreground transition-colors disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-2 py-0.5 bg-[#EEF2FA] text-[#2855A6] rounded font-semibold">{currentPage} / {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="hover:text-foreground transition-colors disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Review Alert Rail ────────────────────────────────────────────────────────

function ReviewAlertRail({ alerts, onSelectCase }: { alerts: ReviewAlert[]; onSelectCase?: (caseId: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-foreground">Review alerts</h3>
        <span className="px-1.5 py-0.5 rounded bg-[#FCE8EB] text-[#A80016] text-[11px] font-semibold">
          {alerts.filter((a) => a.severity === "error").length} critical
        </span>
      </div>

      {alerts.map((alert) => (
        <div
          key={alert.id}
          onClick={() => onSelectCase && onSelectCase(alert.case)}
          className={`border border-border rounded-lg p-3 border-l-[3px] ${alertBg(alert.severity)} cursor-pointer hover:shadow-sm transition-shadow`}
        >
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 ${alert.severity === "error" ? "text-[#D0021B]" : "text-[#F5A623]"}`}>
              {alertIcon(alert.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-mono text-[10px] text-[#2855A6]">{alert.case}</span>
                <span className="text-muted-foreground text-[10px]">· {alert.age} ago</span>
              </div>
              <p className="text-[11px] text-foreground leading-snug">{alert.message}</p>
              <button
                onClick={(e) => { e.stopPropagation(); onSelectCase && onSelectCase(alert.case); }}
                className="mt-1.5 text-[11px] text-[#2855A6] font-semibold hover:underline flex items-center gap-0.5"
              >
                <Eye size={11} /> Review
              </button>
            </div>
          </div>
        </div>
      ))}

      {alerts.length === 0 && (
        <div className="py-6 text-center text-[12px] text-muted-foreground bg-card border border-border rounded-lg">
          No active review alerts.
        </div>
      )}
    </div>
  );
}

// ─── Case Detail Drawer ───────────────────────────────────────────────────────

const TABS = ["Overview", "Parties", "Information", "Documents", "Proposal", "Acceptance", "Activity"];

function CaseDetailDrawer({
  c,
  onClose,
  onUpdateCase,
}: {
  c: OnboardingCase;
  onClose: () => void;
  onUpdateCase?: (updated: OnboardingCase) => void;
}) {
  const [tab, setTab] = useState("Overview");
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentCase, setCurrentCase] = useState<OnboardingCase>(c);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showInfoRequestModal, setShowInfoRequestModal] = useState(false);
  const [infoRequestText, setInfoRequestText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const [checklist, setChecklist] = useState({
    identity: true,
    aml: true,
    conflicts: true,
    margin: true,
  });

  const [uploadedDocs, setUploadedDocs] = useState([
    { name: "Primary Photo ID (Passport)", verified: true, source: "Entiq KYC Biometric", date: "22 Jul 2024" },
    { name: "Trust Deed / Constitution", verified: true, source: "Client Upload", date: "20 Jul 2024" },
    { name: "ASIC Company Extract", verified: true, source: "ASIC Register Sync", date: "20 Jul 2024" },
  ]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleStatusChange = (status: OnboardingCase["status"]) => {
    const updated = { ...currentCase, status, progress: status === "Accepted" ? 100 : currentCase.progress };
    setCurrentCase(updated);
    casesApi.updateStatus(updated.id, status);
    activityApi.log({
      time: "Just now",
      actor: "J. Okafor",
      action: status === "Accepted" ? "Accepted case" : status === "Rejected" ? "Rejected case" : "Updated case status",
      target: `${updated.id} · ${updated.client}`,
      type: status === "Accepted" ? "accept" : status === "Rejected" ? "reject" : "accept",
    });
    if (onUpdateCase) onUpdateCase(updated);
    showToast(`Case marked as ${status}`);
  };

  const handleAssign = (newOwner: string) => {
    const updated = { ...currentCase, owner: newOwner };
    setCurrentCase(updated);
    setShowAssignModal(false);
    activityApi.log({
      time: "Just now",
      actor: "J. Okafor",
      action: "Assigned case",
      target: `${updated.id} · ${updated.client} → ${newOwner}`,
      type: "assign",
    });
    if (onUpdateCase) onUpdateCase(updated);
    showToast(`Assigned to ${newOwner}`);
  };

  const handleSendInfoRequest = () => {
    if (!infoRequestText.trim()) return;
    activityApi.log({
      time: "Just now",
      actor: "J. Okafor",
      action: "Requested additional information",
      target: `${currentCase.id} · ${currentCase.client} — ${infoRequestText}`,
      type: "request",
    });
    setShowInfoRequestModal(false);
    setInfoRequestText("");
    showToast("Information request sent to client");
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className={`${isExpanded ? "w-[95vw] max-w-[1200px]" : "w-[720px]"} bg-card h-full flex flex-col shadow-2xl overflow-hidden transition-all duration-200`}>
        {/* Drawer header */}
        <div className="px-6 pt-5 pb-0 border-b border-border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[12px] text-[#2855A6] bg-[#EEF2FA] px-2 py-0.5 rounded">{currentCase.id}</span>
                <StatusBadge status={currentCase.status} />
                <span className={`text-[11px] font-semibold ${riskColor(currentCase.risk)}`}>
                  {currentCase.risk} risk
                </span>
                <span className="text-[11px] text-muted-foreground ml-2">Owner: <strong>{currentCase.owner}</strong></span>
              </div>
              <h2 className="text-[18px] font-semibold text-foreground leading-tight">{currentCase.client}</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">{currentCase.entity} · {currentCase.service}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse width" : "Expand full width"}
                className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                <XCircle size={18} />
              </button>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className="mb-3 px-3 py-2 bg-[#E8F7EB] border border-[#2EA843]/30 rounded text-[12px] font-semibold text-[#1E7A31] flex items-center gap-2">
              <CheckCircle size={14} />
              {feedback}
            </div>
          )}

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5 text-[11px]">
              <span className="text-muted-foreground">Case progress</span>
              <span className="font-semibold text-foreground">{currentCase.progress}%</span>
            </div>
            <ProgressBar pct={currentCase.progress} />
          </div>

          {/* Tabs */}
          <div className="flex gap-0 -mb-px overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-[12px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  tab === t
                    ? "border-[#2855A6] text-[#2855A6]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "Overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Channel", currentCase.channel],
                  ["Responsible owner", currentCase.owner],
                  ["Created date", currentCase.created + " Jul 2026"],
                  ["Due date", currentCase.due + " Jul 2026"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[#F5F5F5] rounded-lg p-3">
                    <div className="text-[11px] text-muted-foreground mb-0.5">{k}</div>
                    <div className="text-[13px] font-medium text-foreground">{v}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-3">Onboarding stages</h3>
                <div className="space-y-2">
                  {[
                    { label: "Identity and contact — via Entiq KYC", done: true },
                    { label: "Entity information", done: currentCase.progress > 40 },
                    { label: "Documents and verification", done: currentCase.progress > 60 },
                    { label: "Service selection", done: currentCase.progress > 70 },
                    { label: "Proposal and signing — via eSign", done: currentCase.progress > 85 },
                    { label: "Internal acceptance", done: currentCase.progress === 100 },
                  ].map((stage) => (
                    <div key={stage.label} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      {stage.done ? (
                        <CheckCircle size={14} className="text-[#2EA843] shrink-0" />
                      ) : (
                        <Clock size={14} className="text-[#F5A623] shrink-0" />
                      )}
                      <span className={`text-[13px] ${stage.done ? "text-foreground" : "text-muted-foreground"}`}>
                        {stage.label}
                      </span>
                      {stage.done && (
                        <span className="ml-auto text-[11px] text-[#2EA843] font-semibold">Completed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "Parties" && (
            <div className="space-y-4">
              <div className="bg-[#F5F5F5] rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#2855A6] flex items-center justify-center text-white text-[12px] font-semibold">
                    {currentCase.client.split(",")[0]?.charAt(0) ?? "C"}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">{currentCase.client}</div>
                    <div className="text-[11px] text-muted-foreground">Primary Contact · {currentCase.entity}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="px-2 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31] text-[11px] font-semibold">Contact verified</span>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="text-[12px] font-semibold text-foreground">ASIC &amp; Registry Verification</div>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div><span className="text-muted-foreground">Entity Status:</span> <strong className="text-[#1E7A31]">Registered / Active</strong></div>
                  <div><span className="text-muted-foreground">ABN Match:</span> <strong>Verified</strong></div>
                  <div><span className="text-muted-foreground">Registered Office:</span> <span>Level 4, 120 Collins St, Melbourne VIC 3000</span></div>
                  <div><span className="text-muted-foreground">Authorized Signatory:</span> <span>{currentCase.client}</span></div>
                </div>
              </div>
            </div>
          )}

          {tab === "Information" && (
            <div className="space-y-4">
              {[
                { title: "Personal & Contact Details", items: [["Full Legal Name", currentCase.client], ["Date of Birth", "14/05/1982"], ["Email", "client@example.com"], ["Mobile", "+61 412 345 678"]] },
                { title: "Residency and Australian Tax Status", items: [["Residency for Tax Purposes", "Australian Resident"], ["TFN Provided", "Yes (Stored in Encrypted Vault)"], ["GST Registered", "Yes"]] },
                { title: "Declarations & Consents", items: [["Privacy Policy Accepted", "Yes · 22 Jul 2026"], ["Biometric KYC Consent", "Yes · 22 Jul 2026"], ["Electronic Signing Consent", "Yes · 22 Jul 2026"]] },
              ].map((section) => (
                <div key={section.title} className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFA] border-b border-border">
                    <span className="text-[12px] font-semibold text-foreground">{section.title}</span>
                    <CheckCircle size={14} className="text-[#2EA843]" />
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3 text-[12px]">
                    {section.items.map(([k, v]) => (
                      <div key={k}>
                        <div className="text-[11px] text-muted-foreground">{k}</div>
                        <div className="font-medium text-foreground mt-0.5">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Documents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-foreground">Verified Case Documents ({uploadedDocs.length})</span>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF2FA] text-[#2855A6] text-[12px] font-semibold rounded hover:bg-[#2855A6]/15 transition-colors cursor-pointer">
                  <Upload size={13} />
                  Upload document
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        setUploadedDocs((prev) => [...prev, { name: file.name, verified: true, source: "User Upload", date: "Just now" }]);
                        showToast(`Uploaded ${file.name}`);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                {uploadedDocs.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#EEF2FA] flex items-center justify-center text-[#2855A6]">
                        <FileText size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-foreground">{doc.name}</div>
                        <div className="text-[11px] text-muted-foreground">{doc.source} · {doc.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold text-[#1E7A31] bg-[#E8F7EB] px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle size={11} /> Verified
                      </span>
                      <button
                        onClick={() => showToast(`Downloading ${doc.name}...`)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Proposal" && (
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-semibold text-foreground">Letter of Engagement &amp; Fee Proposal</h4>
                  <span className="px-2 py-0.5 rounded bg-[#EEF2FA] text-[#2855A6] text-[11px] font-semibold">eSign Ready</span>
                </div>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">{currentCase.service} (Annual standard scope)</span>
                    <span className="font-semibold">$4,500.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">GST (10%)</span>
                    <span>$450.00</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-[13px]">
                    <span>Total Quoted Amount</span>
                    <span className="text-[#2855A6]">$4,950.00 pa</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-2 text-[12px]">
                <div className="font-semibold text-foreground">Billing Schedule</div>
                <div className="text-muted-foreground">Square recurring direct debit, invoiced monthly ($412.50 / mo incl. GST).</div>
              </div>
            </div>
          )}

          {tab === "Acceptance" && (
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4 space-y-3">
                <h4 className="text-[13px] font-semibold text-foreground">Partner Risk &amp; Compliance Sign-off</h4>
                <p className="text-[12px] text-muted-foreground">Confirm all mandatory practice requirements prior to formal case acceptance.</p>

                <div className="space-y-2.5 pt-2">
                  {[
                    { key: "identity", label: "Client identity verified via Entiq KYC biometric checks" },
                    { key: "aml", label: "AML/CTF and Sanctions screening cleared with no high risk flags" },
                    { key: "conflicts", label: "Conflict of interest search completed against firm database" },
                    { key: "margin", label: "Agreed fee conforms to practice margin and fee schedule" },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card cursor-pointer hover:border-[#2855A6]/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={checklist[item.key as keyof typeof checklist]}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                        className="accent-[#2855A6] w-4 h-4"
                      />
                      <span className="text-[12px] font-medium text-foreground">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleStatusChange("Accepted")}
                  className="flex-1 py-2.5 bg-[#1E7A31] text-white text-[13px] font-semibold rounded hover:bg-[#186227] transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={15} /> Accept Engagement
                </button>
                <button
                  onClick={() => handleStatusChange("Conditional")}
                  className="px-4 py-2.5 border border-[#F5A623] text-[#B87A1A] text-[13px] font-semibold rounded hover:bg-[#FEF6E9] transition-colors"
                >
                  Conditional Accept
                </button>
                <button
                  onClick={() => handleStatusChange("Rejected")}
                  className="px-4 py-2.5 border border-[#D0021B] text-[#D0021B] text-[13px] font-semibold rounded hover:bg-[#FCE8EB] transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {tab === "Activity" && (
            <div className="space-y-3">
              {[
                { time: "Today, 11:42 am", actor: currentCase.owner, action: `Viewed case ${currentCase.id}` },
                { time: "22 Jul, 10:15 am", actor: "System", action: "Identity verification completed via Entiq KYC" },
                { time: "20 Jul, 2:30 pm", actor: "Client", action: "Completed onboarding questionnaire" },
                { time: "18 Jul, 9:00 am", actor: currentCase.owner, action: `Case initialized via ${currentCase.channel}` },
              ].map((ev, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card text-[12px]">
                  <div className="w-2 h-2 rounded-full bg-[#2855A6] mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{ev.action}</div>
                    <div className="text-[11px] text-muted-foreground">by {ev.actor}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground whitespace-nowrap">{ev.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer actions */}
        <div className="border-t border-border px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors"
          >
            {isExpanded ? "Standard view" : "Open full case"}
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 border border-border text-[13px] font-semibold rounded hover:bg-muted transition-colors"
          >
            Assign
          </button>
          <button
            onClick={() => setShowInfoRequestModal(true)}
            className="px-4 py-2 border border-border text-[13px] font-semibold rounded hover:bg-muted transition-colors"
          >
            Request information
          </button>
          <div className="flex-1" />
          {currentCase.status !== "Accepted" && (
            <button
              onClick={() => handleStatusChange("Accepted")}
              className="px-4 py-2 bg-[#1E7A31] text-white text-[13px] font-semibold rounded hover:bg-[#186227] transition-colors"
            >
              Accept
            </button>
          )}
          {currentCase.status !== "Rejected" && (
            <button
              onClick={() => handleStatusChange("Rejected")}
              className="px-4 py-2 border border-[#D0021B] text-[#D0021B] text-[13px] font-semibold rounded hover:bg-[#FCE8EB] transition-colors"
            >
              Reject
            </button>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="bg-card w-[380px] rounded-xl p-5 shadow-2xl border border-border space-y-4">
            <h3 className="text-[15px] font-semibold text-foreground">Reassign Case</h3>
            <p className="text-[12px] text-muted-foreground">Choose a responsible adviser for this onboarding case:</p>
            <div className="space-y-2">
              {["J. Okafor", "A. Brennan", "S. Patel"].map((adv) => (
                <button
                  key={adv}
                  onClick={() => handleAssign(adv)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-[13px] font-medium transition-colors ${currentCase.owner === adv ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border hover:bg-muted"}`}
                >
                  {adv}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setShowAssignModal(false)} className="px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Information Request Modal */}
      {showInfoRequestModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="bg-card w-[480px] rounded-xl p-5 shadow-2xl border border-border space-y-4">
            <h3 className="text-[15px] font-semibold text-foreground">Request Information from Client</h3>
            <p className="text-[12px] text-muted-foreground">The client will receive an email/SMS notification requesting clarification or missing files.</p>
            <textarea
              value={infoRequestText}
              onChange={(e) => setInfoRequestText(e.target.value)}
              placeholder="e.g. Please provide an updated Trust Deed with execution stamps..."
              rows={4}
              className="w-full p-3 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowInfoRequestModal(false)} className="px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground">Cancel</button>
              <button
                disabled={!infoRequestText.trim()}
                onClick={handleSendInfoRequest}
                className="px-4 py-1.5 bg-[#2855A6] text-white text-[12px] font-semibold rounded hover:bg-[#1F4491] disabled:opacity-40 transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── New Invitation Modal ─────────────────────────────────────────────────────

function NewInvitationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [clientSearch, setClientSearch] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [clientType, setClientType] = useState("Individual");
  const [service, setService] = useState("Individual Tax");
  const [channel, setChannel] = useState<"Email" | "SMS + Email" | "QR code">("Email");
  const [dueDate, setDueDate] = useState("2026-08-15");
  const [assignTo, setAssignTo] = useState("J. Okafor");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientName = clientSearch || `${givenName} ${familyName}`.trim();

  const handleSend = async () => {
    setIsSubmitting(true);
    try {
      await invitationsApi.create({
        clientName: clientName || "New Client",
        clientType,
        service,
        channel,
        email: email || "client@example.com",
        mobile,
        dueDate,
        assignTo,
      });
      await activityApi.log({
        time: "Just now",
        actor: assignTo,
        action: "Sent invitation",
        target: `${clientName || "New Client"} — ${service}`,
        type: "invite",
      });
      if (onCreated) onCreated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card w-[560px] rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">New client invitation</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
            <XCircle size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 flex items-center gap-3">
          {["Client", "Service", "Delivery"].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i + 1 <= step ? "bg-[#2855A6] text-white" : "bg-[#F0F0F0] text-muted-foreground"}`}>
                {i + 1 < step ? <CheckCircle size={12} /> : i + 1}
              </div>
              <span className={`text-[12px] font-medium ${i + 1 <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {i < 2 && <div className={`flex-1 h-px ${i + 1 < step ? "bg-[#2855A6]" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1.5">Search existing clients</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Name, email or entity…"
                    className="w-full pl-8 pr-4 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1.5">Or invite a new client</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    placeholder="Given name"
                    className="px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                  />
                  <input
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="Family name"
                    className="px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="col-span-2 px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                  />
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Mobile (optional)"
                    className="col-span-2 px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1.5">Client type</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Individual", "Company", "Trust", "Partnership", "SMSF", "Other"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setClientType(t)}
                      className={`py-2 px-3 rounded border text-[12px] font-medium transition-colors ${clientType === t ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-foreground hover:border-[#2855A6]/40 hover:bg-[#EEF2FA]/40"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1.5">Service</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                >
                  <option value="Individual Tax">Individual Tax</option>
                  <option value="Company Tax + BAS">Company Tax + BAS</option>
                  <option value="Trust Tax">Trust Tax</option>
                  <option value="SMSF Administration">SMSF Administration</option>
                  <option value="Business Advisory">Business Advisory</option>
                </select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1.5">Delivery channel</label>
                <div className="space-y-2">
                  {[
                    { id: "Email" as const, label: "Email invitation", desc: "Send a secure link via email" },
                    { id: "SMS + Email" as const, label: "Email and SMS", desc: "Include a backup SMS notification" },
                    { id: "QR code" as const, label: "QR code", desc: "Generate a scannable code for in-person use" },
                  ].map((ch) => (
                    <label key={ch.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${channel === ch.id ? "border-[#2855A6] bg-[#EEF2FA]/50" : "border-border hover:border-[#2855A6]/30"}`}>
                      <input
                        type="radio"
                        name="channel"
                        checked={channel === ch.id}
                        onChange={() => setChannel(ch.id)}
                        className="mt-0.5 accent-[#2855A6]"
                      />
                      <div>
                        <div className="text-[13px] font-semibold text-foreground">{ch.label}</div>
                        <div className="text-[11px] text-muted-foreground">{ch.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1.5">Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1.5">Assign to</label>
                <select
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                >
                  <option value="J. Okafor">J. Okafor</option>
                  <option value="A. Brennan">A. Brennan</option>
                  <option value="S. Patel">S. Patel</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleSend()}
            disabled={isSubmitting || (step === 1 && !clientName && !email)}
            className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors disabled:opacity-40"
          >
            {step === 3 ? (isSubmitting ? "Sending…" : "Send invitation") : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard view ───────────────────────────────────────────────────────────

function Dashboard() {
  const [statusFilter, setStatusFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"All cases" | "My cases" | "Exceptions">("All cases");
  const [selectedCase, setSelectedCase] = useState<OnboardingCase | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: casesPage, loading: casesLoading, error: casesError, refetch: refetchCases } = useApiData(
    () => casesApi.list({ status: statusFilter || undefined, search: search || undefined }),
    [statusFilter, search]
  );
  const { data: alertsData, loading: alertsLoading, refetch: refetchAlerts } = useApiData(() => alertsApi.list());

  const casesArr = casesPage?.items ?? CASES;
  const alertsArr = alertsData ?? ALERTS;

  const filteredCases = casesArr.filter((c) => {
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchOwner = !ownerFilter || c.owner === ownerFilter;
    const matchChannel = !channelFilter || c.channel === channelFilter;
    const matchSearch = !search || c.client.toLowerCase().includes(search.toLowerCase()) || c.entity.toLowerCase().includes(search.toLowerCase());
    const matchView =
      viewMode === "All cases"
        ? true
        : viewMode === "My cases"
        ? c.owner === "J. Okafor"
        : alertsArr.some((a) => a.case === c.id);
    return matchStatus && matchOwner && matchChannel && matchSearch && matchView;
  });

  const stats = {
    active: casesArr.filter((c) => ["In progress", "Awaiting others", "Internal review", "Proposal issued", "Acceptance review"].includes(c.status)).length,
    overdue: casesArr.filter((c) => c.status !== "Accepted" && c.status !== "Rejected").filter((_, i) => i < 2).length,
    accepted: casesArr.filter((c) => c.status === "Accepted").length,
    exceptions: alertsArr.filter((a) => a.severity === "error").length,
  };

  const handleExport = () => {
    exportToCsv("start_dashboard_cases.csv", filteredCases as unknown as Record<string, unknown>[]);
  };

  return (
    <>
      {showModal && <NewEngagementModal onClose={() => setShowModal(false)} onCreated={() => { refetchCases(); }} />}
      {selectedCase && (
        <CaseDetailDrawer
          c={selectedCase}
          onClose={() => setSelectedCase(null)}
          onUpdateCase={(updated) => {
            refetchCases();
            setSelectedCase(updated);
          }}
        />
      )}

      <div className="flex flex-col h-full overflow-hidden">
        <Header onNewInvitation={() => setShowModal(true)} />

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5 max-w-[1400px]">
            {/* Page title */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-bold text-foreground leading-tight">Start Dashboard</h1>
                <p className="text-[13px] text-muted-foreground mt-0.5">29 July 2026 · Grow Advisory Group</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground">View:</span>
                {(["All cases", "My cases", "Exceptions"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    className={`px-3 py-1.5 text-[12px] font-medium rounded border transition-colors ${viewMode === v ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              <SummaryCard
                label="Active cases"
                value={stats.active}
                sub="this month"
                icon={<Layers size={16} className="text-[#2855A6]" />}
                accent="bg-[#EEF2FA]"
              />
              <SummaryCard
                label="Overdue"
                value={stats.overdue}
                sub="need attention"
                icon={<AlertTriangle size={16} className="text-[#F5A623]" />}
                accent="bg-[#FEF6E9]"
              />
              <SummaryCard
                label="Accepted this month"
                value={stats.accepted}
                sub="engagements"
                icon={<CheckCircle size={16} className="text-[#2EA843]" />}
                accent="bg-[#E8F7EB]"
              />
              <SummaryCard
                label="Open exceptions"
                value={stats.exceptions}
                sub="require review"
                icon={<Shield size={16} className="text-[#D0021B]" />}
                accent="bg-[#FCE8EB]"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Funnel bar chart */}
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-[13px] font-semibold text-foreground mb-4">Conversion funnel — July 2026</h3>
                <div className="flex items-end gap-2 h-[120px]">
                  {conversionData.map((d) => {
                    const pct = Math.round((d.count / conversionData[0].count) * 100);
                    return (
                      <div key={d.stage} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-semibold">{d.count}</span>
                        <div
                          className="w-full rounded-t-[3px] bg-[#2855A6] transition-all"
                          style={{ height: `${pct}%`, minHeight: 4 }}
                        />
                        <span className="text-[9px] text-muted-foreground text-center leading-tight whitespace-nowrap overflow-hidden">{d.stage}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trend line chart */}
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-[13px] font-semibold text-foreground mb-1">Median completion time (minutes)</h3>
                <p className="text-[11px] text-muted-foreground mb-3">Individual cases — last 6 weeks</p>
                <svg width="100%" height="110" viewBox="0 0 320 110" preserveAspectRatio="none">
                  {[0, 1, 2, 3].map((i) => (
                    <line key={i} x1="0" y1={i * 28} x2="320" y2={i * 28} stroke="#D1D1D1" strokeWidth="0.5" />
                  ))}
                  <path
                    d={`M ${completionTrend.map((d, i) => {
                      const x = (i / (completionTrend.length - 1)) * 300 + 10;
                      const y = 90 - ((d.time - 8) / (22 - 8)) * 80;
                      return `${x},${y}`;
                    }).join(" L ")} L 310,90 L 10,90 Z`}
                    fill="#20BCA4"
                    fillOpacity="0.1"
                  />
                  <polyline
                    points={completionTrend.map((d, i) => {
                      const x = (i / (completionTrend.length - 1)) * 300 + 10;
                      const y = 90 - ((d.time - 8) / (22 - 8)) * 80;
                      return `${x},${y}`;
                    }).join(" ")}
                    fill="none"
                    stroke="#20BCA4"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {completionTrend.map((d, i) => {
                    const x = (i / (completionTrend.length - 1)) * 300 + 10;
                    const y = 90 - ((d.time - 8) / (22 - 8)) * 80;
                    return (
                      <g key={d.week}>
                        <circle cx={x} cy={y} r="3.5" fill="#20BCA4" />
                        <text x={x} y="108" textAnchor="middle" fontSize="9" fill="#6F6F6F">{d.week}</text>
                        <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="#2E2E2E" fontWeight="600">{d.time}m</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Main content: table + alert rail */}
            <div className="flex gap-5 items-start">
              <div className="flex-1 min-w-0 space-y-3">
                <FilterBar
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  ownerFilter={ownerFilter}
                  setOwnerFilter={setOwnerFilter}
                  channelFilter={channelFilter}
                  setChannelFilter={setChannelFilter}
                  search={search}
                  setSearch={setSearch}
                  onExport={handleExport}
                />
                {casesError && <ApiErrorBanner message={casesError} onRetry={refetchCases} />}
                {casesLoading ? (
                  <TableSkeleton rows={6} cols={8} />
                ) : (
                  <CasesTable cases={filteredCases} onSelect={setSelectedCase} />
                )}
              </div>

              <div className="w-[280px] min-w-[280px]">
                <ReviewAlertRail
                  alerts={alertsArr}
                  onSelectCase={(caseId) => {
                    const target = casesArr.find((c) => c.id === caseId);
                    if (target) setSelectedCase(target);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Shared page wrapper ─────────────────────────────────────────────────────

function PageShell({
  title,
  subtitle,
  breadcrumb,
  actions,
  children,
  onNewInvitation,
}: {
  title: string;
  subtitle?: string;
  breadcrumb: string[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  onNewInvitation?: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="h-[52px] min-h-[52px] bg-card border-b border-border flex items-center px-6 gap-4">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          {breadcrumb.map((b, i) => (
            <span key={b} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={12} />}
              <span className={i === breadcrumb.length - 1 ? "text-foreground font-medium" : ""}>{b}</span>
            </span>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search…" className="w-[240px] pl-8 pr-4 py-1.5 text-[13px] bg-[#F5F5F5] border border-border rounded placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2855A6]/30 focus:border-[#2855A6] transition-all" />
        </div>
        <button className="relative p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"><Bell size={16} /><span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#D0021B] rounded-full" /></button>
        {onNewInvitation && (
          <button onClick={onNewInvitation} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors">
            <Plus size={14} />New invitation
          </button>
        )}
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1400px] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-foreground leading-tight">{title}</h1>
              {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Cases screen ──────────────────────────────────────────────────

function CasesScreen() {
  const [statusFilter, setStatusFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [search, setSearch] = useState("");
  const [viewTab, setViewTab] = useState<"All" | "Active" | "Awaiting action" | "Completed">("All");
  const [selectedCase, setSelectedCase] = useState<OnboardingCase | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: page, loading, error, refetch } = useApiData(
    () => casesApi.list({ status: statusFilter || undefined, search: search || undefined }),
    [statusFilter, search]
  );
  const allCases = page?.items ?? CASES;

  const filtered = allCases.filter((c) => {
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchOwner = !ownerFilter || c.owner === ownerFilter;
    const matchChannel = !channelFilter || c.channel === channelFilter;
    const matchSearch = !search || c.client.toLowerCase().includes(search.toLowerCase()) || c.entity.toLowerCase().includes(search.toLowerCase());
    const matchViewTab =
      viewTab === "All"
        ? true
        : viewTab === "Active"
        ? ["In progress", "Awaiting others", "Invited"].includes(c.status)
        : viewTab === "Awaiting action"
        ? ["Internal review", "Acceptance review", "Submitted", "Proposal issued"].includes(c.status)
        : ["Accepted", "Rejected", "Signed"].includes(c.status);
    return matchStatus && matchOwner && matchChannel && matchSearch && matchViewTab;
  });

  const handleExport = () => {
    exportToCsv("onboarding_cases.csv", filtered as unknown as Record<string, unknown>[]);
  };

  return (
    <>
      {showModal && <NewInvitationModal onClose={() => setShowModal(false)} onCreated={() => { refetch(); }} />}
      {selectedCase && (
        <CaseDetailDrawer
          c={selectedCase}
          onClose={() => setSelectedCase(null)}
          onUpdateCase={(updated) => {
            refetch();
            setSelectedCase(updated);
          }}
        />
      )}
      <PageShell
        title="Onboarding Cases"
        subtitle="All active and completed cases · Grow Advisory Group"
        breadcrumb={["EnTIQ", "Start", "Onboarding Cases"]}
        onNewInvitation={() => setShowModal(true)}
        actions={
          <div className="flex gap-2">
            {(["All", "Active", "Awaiting action", "Completed"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewTab(v)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded border transition-colors ${viewTab === v ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {v}
              </button>
            ))}
          </div>
        }
      >
        {/* Stats strip */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total cases", value: loading ? "—" : allCases.length, color: "text-foreground" },
            { label: "In progress", value: loading ? "—" : allCases.filter(c => ["In progress","Awaiting others"].includes(c.status)).length, color: "text-[#2855A6]" },
            { label: "Awaiting review", value: loading ? "—" : allCases.filter(c => ["Internal review","Acceptance review","Submitted"].includes(c.status)).length, color: "text-[#F5A623]" },
            { label: "Accepted", value: loading ? "—" : allCases.filter(c => c.status === "Accepted").length, color: "text-[#2EA843]" },
            { label: "Rejected", value: loading ? "—" : allCases.filter(c => c.status === "Rejected").length, color: "text-[#D0021B]" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="text-[11px] text-muted-foreground mb-1">{s.label}</div>
              <div className={`text-[24px] font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <FilterBar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          ownerFilter={ownerFilter}
          setOwnerFilter={setOwnerFilter}
          channelFilter={channelFilter}
          setChannelFilter={setChannelFilter}
          search={search}
          setSearch={setSearch}
          onExport={handleExport}
        />
        {error && <ApiErrorBanner message={error} onRetry={refetch} />}
        {loading ? <TableSkeleton rows={8} cols={9} /> : <CasesTable cases={filtered} onSelect={setSelectedCase} />}
      </PageShell>
    </>
  );
}

// ─── Invitations screen ───────────────────────────────────────────────────────

const INVITATIONS = [
  { id: "INV-2024-0120", client: "Manoj Kumar", email: "manoj@manojtech.com.au", service: "Company Tax + Advisory", channel: "Email", status: "Sent", sent: "Today", expires: "18 Sept", owner: "J. Okafor" },
  { id: "INV-2024-0112", client: "Nguyen, Thanh", email: "thanh.nguyen@email.com", service: "Individual Tax", channel: "Email", status: "Sent", sent: "28 Jul", expires: "11 Aug", owner: "S. Patel" },
  { id: "INV-2024-0111", client: "Riverside Developments Pty Ltd", email: "admin@riverside.com.au", service: "Company Tax + BAS", channel: "Email", status: "Opened", sent: "26 Jul", expires: "9 Aug", owner: "A. Brennan" },
  { id: "INV-2024-0110", client: "Morrison, Claire", email: "claire.m@outlook.com", service: "Individual Tax", channel: "SMS + Email", status: "Started", sent: "24 Jul", expires: "7 Aug", owner: "J. Okafor" },
  { id: "INV-2024-0109", client: "Sunfield Unit Trust", email: "trustee@sunfield.com.au", service: "Trust Tax", channel: "QR code", status: "Expired", sent: "10 Jul", expires: "24 Jul", owner: "S. Patel" },
  { id: "INV-2024-0108", client: "Park, Ji-Woo", email: "jwpark@gmail.com", service: "Individual Tax", channel: "Email", status: "Sent", sent: "28 Jul", expires: "11 Aug", owner: "A. Brennan" },
  { id: "INV-2024-0107", client: "Ashworth & Partners", email: "info@ashworth.net.au", service: "Partnership Tax", channel: "Email", status: "Completed", sent: "18 Jul", expires: "1 Aug", owner: "J. Okafor" },
];

function invStatusColor(s: string) {
  const m: Record<string, string> = {
    Sent: "bg-[#EEF2FA] text-[#2855A6]",
    Opened: "bg-[#FEF6E9] text-[#B87A1A]",
    Started: "bg-[#E3F0FB] text-[#1A5DA6]",
    Expired: "bg-[#F0F0F0] text-[#6F6F6F]",
    Completed: "bg-[#E8F7EB] text-[#1E7A31]",
    Cancelled: "bg-[#FCE8EB] text-[#A80016]",
  };
  return m[s] ?? "bg-[#F0F0F0] text-[#6F6F6F]";
}

type InvitationRow = typeof INVITATIONS[0];

function InvitationDetailDrawer({
  inv,
  onClose,
  onUpdated,
}: {
  inv: InvitationRow;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [tab, setTab] = useState("Overview");
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const tabs = ["Overview", "Activity"];

  const canResend = inv.status === "Sent" || inv.status === "Opened" || inv.status === "Expired";
  const canCancel = inv.status === "Sent" || inv.status === "Opened" || inv.status === "Started";

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyLink = () => {
    const link = `https://start.entiq.com/invite/${inv.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopied(true);
    showToast("Invitation link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResend = async () => {
    await invitationsApi.resend(inv.id);
    await activityApi.log({
      time: "Just now",
      actor: "J. Okafor",
      action: "Resent invitation",
      target: `${inv.id} · ${inv.client}`,
      type: "invite",
    });
    showToast("Fresh invitation link sent to " + inv.email);
    if (onUpdated) onUpdated();
  };

  const handleCancel = async () => {
    await invitationsApi.cancel(inv.id);
    await activityApi.log({
      time: "Just now",
      actor: "J. Okafor",
      action: "Cancelled invitation",
      target: `${inv.id} · ${inv.client}`,
      type: "invite",
    });
    showToast("Invitation cancelled");
    if (onUpdated) onUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[600px] bg-card h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-0 border-b border-border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[12px] text-[#2855A6] bg-[#EEF2FA] px-2 py-0.5 rounded">{inv.id}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${invStatusColor(inv.status)}`}>{inv.status}</span>
              </div>
              <h2 className="text-[18px] font-semibold text-foreground leading-tight">{inv.client}</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">{inv.service} · {inv.channel}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground">
              <XCircle size={18} />
            </button>
          </div>

          {toastMsg && (
            <div className="mb-3 px-3 py-2 bg-[#E8F7EB] border border-[#2EA843]/30 rounded text-[12px] font-semibold text-[#1E7A31] flex items-center gap-2">
              <CheckCircle size={14} />
              {toastMsg}
            </div>
          )}

          <div className="flex gap-0 -mb-px">
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-[12px] font-semibold border-b-2 transition-colors whitespace-nowrap ${tab === t ? "border-[#2855A6] text-[#2855A6]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "Overview" && (
            <div className="space-y-5">
              {inv.status === "Expired" && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[#FCE8EB] border border-[#D0021B]/20">
                  <AlertTriangle size={14} className="text-[#D0021B] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold text-[#A80016]">Invitation expired</div>
                    <div className="text-[11px] text-[#A80016] mt-0.5">This invitation expired on {inv.expires}. Resend to issue a fresh link.</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Email address", inv.email],
                  ["Responsible owner", inv.owner],
                  ["Date sent", inv.sent + " Jul 2026"],
                  ["Expiry date", inv.expires + " Aug 2026"],
                  ["Channel", inv.channel],
                  ["Proposed service", inv.service],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[#F5F5F5] rounded-lg p-3">
                    <div className="text-[11px] text-muted-foreground mb-0.5">{k}</div>
                    <div className="text-[13px] font-medium text-foreground">{v}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-3">Invitation progress</h3>
                <div className="space-y-0 divide-y divide-border border border-border rounded-lg overflow-hidden">
                  {[
                    { label: "Invitation sent", done: true },
                    { label: "Link opened by client", done: ["Opened", "Started", "Completed"].includes(inv.status) },
                    { label: "Questionnaire started", done: ["Started", "Completed"].includes(inv.status) },
                    { label: "Onboarding completed", done: inv.status === "Completed" },
                  ].map(step => (
                    <div key={step.label} className="flex items-center gap-3 px-4 py-3 bg-card">
                      {step.done
                        ? <CheckCircle size={14} className="text-[#2EA843] shrink-0" />
                        : <div className="w-3.5 h-3.5 rounded-full border-2 border-border shrink-0" />}
                      <span className={`text-[12px] ${step.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                      {step.done && <span className="ml-auto text-[11px] text-[#2EA843] font-semibold">Done</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "Activity" && (
            <div className="space-y-0 divide-y divide-border border border-border rounded-lg overflow-hidden">
              {[
                { time: inv.sent + " Jul 2026", actor: inv.owner, action: "Invitation sent via " + inv.channel },
                ...(["Opened","Started","Completed"].includes(inv.status) ? [{ time: inv.sent + " Jul 2026, later", actor: "Client", action: "Invitation link opened" }] : []),
                ...(["Started","Completed"].includes(inv.status) ? [{ time: inv.sent + " Jul 2026, later", actor: "Client", action: "Questionnaire started" }] : []),
                ...(inv.status === "Completed" ? [{ time: inv.expires, actor: "Client", action: "Onboarding completed — case created" }] : []),
              ].map((ev, i) => (
                <div key={i} className="flex items-start gap-4 px-4 py-3 bg-card">
                  <div className="w-6 h-6 rounded-full bg-[#EEF2FA] flex items-center justify-center text-[10px] font-bold text-[#2855A6] shrink-0">{ev.actor.charAt(0)}</div>
                  <div className="flex-1">
                    <span className="text-[12px] font-semibold text-foreground">{ev.actor}</span>
                    <span className="text-[12px] text-muted-foreground"> · {ev.action}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">{ev.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center gap-3">
          {canResend && (
            <button
              onClick={handleResend}
              className="px-4 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors"
            >
              Resend invitation
            </button>
          )}
          {inv.status === "Completed" && (
            <button
              onClick={() => showToast("Navigating to onboarding case...")}
              className="px-4 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors"
            >
              View onboarding case
            </button>
          )}
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 border border-border text-[13px] font-semibold rounded hover:bg-muted transition-colors"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          <div className="flex-1" />
          {canCancel && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-[#D0021B] text-[#D0021B] text-[13px] font-semibold rounded hover:bg-[#FCE8EB] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InvitationsScreen() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedInvitation, setSelectedInvitation] = useState<InvitationRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: page, loading, error, refetch } = useApiData(
    () => invitationsApi.list({ search: search || undefined, status: statusFilter === "All" ? undefined : statusFilter }),
    [search, statusFilter]
  );
  const { data: stats } = useApiData(() => invitationsApi.stats());

  const allInvitations = page?.items ?? INVITATIONS;
  const filtered = allInvitations.filter(i => {
    const matchSearch = !search || i.client.toLowerCase().includes(search.toLowerCase()) || i.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayedInvitations = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const sentCount = stats?.sentThisMonth ?? 24;
  const openedCount = stats?.opened ?? 18;
  const startedCount = stats?.started ?? 14;
  const expiringCount = stats?.expiringIn3Days ?? 3;

  const handleExport = () => {
    exportToCsv("invitations.csv", filtered as unknown as Record<string, unknown>[]);
  };

  return (
    <>
      {showModal && <NewInvitationModal onClose={() => setShowModal(false)} onCreated={() => { refetch(); }} />}
      {selectedInvitation && (
        <InvitationDetailDrawer
          inv={selectedInvitation}
          onClose={() => setSelectedInvitation(null)}
          onUpdated={() => { refetch(); setSelectedInvitation(null); }}
        />
      )}
      <PageShell
        title="Invitations"
        subtitle="Manage outgoing invitations and entry channels"
        breadcrumb={["EnTIQ", "Start", "Invitations"]}
        onNewInvitation={() => setShowModal(true)}
        actions={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors">
            <Plus size={14} />New invitation
          </button>
        }
      >
        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Sent this month", value: sentCount, icon: <Inbox size={15} className="text-[#2855A6]" />, bg: "bg-[#EEF2FA]" },
            { label: "Opened", value: openedCount, icon: <Eye size={15} className="text-[#F5A623]" />, bg: "bg-[#FEF6E9]" },
            { label: "Started", value: startedCount, icon: <Clock size={15} className="text-[#2855A6]" />, bg: "bg-[#E3F0FB]" },
            { label: "Expiring in 3 days", value: expiringCount, icon: <AlertTriangle size={15} className="text-[#D0021B]" />, bg: "bg-[#FCE8EB]" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>{s.icon}</div>
              <div>
                <div className="text-[22px] font-bold text-foreground">{s.value}</div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search client or email…"
              className="pl-7 pr-3 py-1.5 text-[12px] bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] w-[220px] transition-all"
            />
          </div>
          {["All", "Sent", "Opened", "Started", "Expired", "Completed"].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-[12px] border rounded transition-colors ${statusFilter === s ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6] font-semibold" : "border-border text-muted-foreground hover:border-[#2855A6]/40 hover:text-[#2855A6]"}`}
            >
              {s}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
          >
            <Download size={12} />Export
          </button>
        </div>

        {error && <ApiErrorBanner message={error} onRetry={refetch} />}

        {/* Table */}
        {loading ? <TableSkeleton rows={6} cols={10} /> : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-[#FAFAFA]">
                {["Invitation ID", "Client", "Email", "Service", "Channel", "Status", "Sent", "Expires", "Owner", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedInvitations.map((inv, i) => (
                <tr key={inv.id} onClick={() => setSelectedInvitation(inv)} className={`border-b border-border last:border-0 hover:bg-[#F8FAFF] cursor-pointer transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}>
                  <td className="px-4 py-3"><span className="font-mono text-[11px] text-[#2855A6]">{inv.id}</span></td>
                  <td className="px-4 py-3 font-medium text-foreground">{inv.client}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.service}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.channel}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${invStatusColor(inv.status)}`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.sent}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.expires}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.owner}</td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); setSelectedInvitation(inv); }} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><MoreHorizontal size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-[13px] text-muted-foreground">
              No invitations match your filters.
            </div>
          )}

          <div className="px-4 py-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{filtered.length} invitation{filtered.length !== 1 ? "s" : ""} shown</span>
            <div className="flex items-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="hover:text-foreground disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 py-0.5 bg-[#EEF2FA] text-[#2855A6] rounded font-semibold">{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="hover:text-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        )}
      </PageShell>
    </>
  );
}

// ─── Clients & Entities screen ────────────────────────────────────────────────

const CLIENTS_DATA = [
  { id: "E-00890", name: "Manoj Tech Solutions Pty Ltd", type: "Company", abn: "88 923 104 551", acn: "923 104 551", status: "Active", verified: "Document", cases: 1, engagements: 1, added: "Aug 2026" },
  { id: "P-00450", name: "Manoj Kumar", type: "Individual", abn: "", acn: "", status: "Active", verified: "Biometric (KYC)", cases: 1, engagements: 1, added: "Aug 2026" },
  { id: "P-00441", name: "Harrington, Sophie", type: "Individual", abn: "", acn: "", status: "Active", verified: "Biometric (KYC)", cases: 1, engagements: 2, added: "Mar 2023" },
  { id: "E-00882", name: "Northfield Holdings Pty Ltd", type: "Company", abn: "62 481 203 991", acn: "481 203 991", status: "Active", verified: "Document", cases: 1, engagements: 1, added: "Jan 2024" },
  { id: "E-00881", name: "The Marcelline Family Trust", type: "Trust", abn: "51 204 771 003", acn: "", status: "Active", verified: "Manual", cases: 1, engagements: 1, added: "Jun 2023" },
  { id: "P-00440", name: "Chen, David", type: "Individual", abn: "", acn: "", status: "Active", verified: "Document", cases: 1, engagements: 1, added: "Feb 2024" },
  { id: "P-00439", name: "Liu, Wei", type: "Individual", abn: "", acn: "", status: "Active", verified: "Contact", cases: 1, engagements: 0, added: "Feb 2024" },
  { id: "E-00880", name: "Apex Ventures Pty Ltd", type: "Company", abn: "77 340 918 200", acn: "340 918 200", status: "Active", verified: "Document", cases: 1, engagements: 0, added: "Jul 2024" },
  { id: "E-00879", name: "Caldwell SMSF", type: "SMSF", abn: "39 204 881 772", acn: "", status: "Active", verified: "Document", cases: 1, engagements: 1, added: "Apr 2022" },
  { id: "E-00878", name: "Greenbrook Unit Trust", type: "Trust", abn: "20 781 003 441", acn: "", status: "Active", verified: "Document", cases: 1, engagements: 1, added: "Nov 2021" },
];

function verifiedBadge(v: string) {
  const m: Record<string, string> = {
    "Biometric (KYC)": "bg-[#E3F8F5] text-[#20BCA4]",
    Biometric: "bg-[#E3F8F5] text-[#20BCA4]",
    Document: "bg-[#E8F7EB] text-[#1E7A31]",
    Manual: "bg-[#FEF6E9] text-[#B87A1A]",
    Contact: "bg-[#F0F0F0] text-[#6F6F6F]",
  };
  return m[v] ?? "bg-[#F0F0F0] text-[#6F6F6F]";
}

function AddEntityModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Individual");
  const [abn, setAbn] = useState("");
  const [acn, setAcn] = useState("");
  const [verified, setVerified] = useState("Document");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const newId = `${type === "Individual" ? "P" : "E"}-${Math.floor(Math.random() * 90000 + 10000)}`;
      await clientsApi.create({
        id: newId,
        name,
        type,
        abn,
        acn,
        verified,
        cases: 0,
        engagements: 0,
        added: "Today",
      });
      await activityApi.log({
        time: "Just now",
        actor: "J. Okafor",
        action: "Created entity record",
        target: `${name} (${type})`,
        type: "client",
      });
      onCreated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card w-[480px] rounded-xl p-6 shadow-2xl border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-foreground">Add New Client or Entity</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><XCircle size={18} /></button>
        </div>

        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block font-medium text-foreground mb-1">Legal Entity / Person Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Apex Holdings Pty Ltd or John Smith"
              className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Entity Structure</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
            >
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
              <option value="Trust">Trust</option>
              <option value="SMSF">SMSF</option>
              <option value="Partnership">Partnership</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">ABN (Optional)</label>
              <input
                value={abn}
                onChange={e => setAbn(e.target.value)}
                placeholder="11-digit ABN"
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">ACN (Optional)</label>
              <input
                value={acn}
                onChange={e => setAcn(e.target.value)}
                placeholder="9-digit ACN"
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Verification Level</label>
            <select
              value={verified}
              onChange={e => setVerified(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
            >
              <option value="Biometric (KYC)">Biometric (KYC)</option>
              <option value="Document">Document Verified</option>
              <option value="Manual">Manual Review</option>
              <option value="Contact">Contact Only</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
          <button
            disabled={isSubmitting || !name.trim()}
            onClick={handleSave}
            className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] disabled:opacity-40 transition-colors"
          >
            {isSubmitting ? "Creating…" : "Create Entity"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientsScreen() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: page, loading, error, refetch } = useApiData(
    () => clientsApi.list({ search: search || undefined, type: typeFilter || undefined }),
    [search, typeFilter]
  );
  const allClients = page?.items ?? CLIENTS_DATA;

  const filtered = allClients.filter(c => {
    const ms = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.abn && c.abn.includes(search)) || (c.acn && c.acn.includes(search));
    const mt = !typeFilter || c.type === typeFilter;
    const mv = !verificationFilter || c.verified.toLowerCase().includes(verificationFilter.toLowerCase());
    return ms && mt && mv;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayedClients = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExport = () => {
    exportToCsv("clients_entities.csv", filtered as unknown as Record<string, unknown>[]);
  };

  return (
    <>
      {showAddModal && <AddEntityModal onClose={() => setShowAddModal(false)} onCreated={() => { refetch(); }} />}
      <PageShell
        title="Clients & Entities"
        subtitle="All persons, companies, trusts and other entities"
        breadcrumb={["EnTIQ", "Start", "Clients & Entities"]}
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors"
          >
            <Plus size={14} />Add entity
          </button>
        }
      >
        {/* Type tabs */}
        <div className="flex gap-1 p-1 bg-card border border-border rounded-lg w-fit">
          {["All types", "Individual", "Company", "Trust", "SMSF", "Partnership"].map(t => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t === "All types" ? "" : t); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-[12px] font-medium rounded transition-colors ${(t === "All types" && !typeFilter) || typeFilter === t ? "bg-[#2855A6] text-white" : "text-muted-foreground hover:text-foreground"}`}
            >{t}</button>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search name, ABN or ACN…"
              className="pl-7 pr-3 py-1.5 text-[12px] bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] w-[240px] transition-all"
            />
          </div>
          <select
            value={verificationFilter}
            onChange={e => { setVerificationFilter(e.target.value); setCurrentPage(1); }}
            className="text-[12px] border border-border rounded px-2.5 py-1.5 bg-card focus:outline-none appearance-none pr-7 cursor-pointer"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236F6F6F' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
          >
            <option value="">All verification levels</option>
            <option value="Biometric">Biometric</option>
            <option value="Document">Document</option>
            <option value="Manual">Manual</option>
            <option value="Contact">Contact</option>
          </select>
          <div className="flex-1" />
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
          >
            <Download size={12} />Export
          </button>
        </div>

        {error && <ApiErrorBanner message={error} onRetry={refetch} />}

        {/* Table */}
        {loading ? <TableSkeleton rows={8} cols={9} /> : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-[#FAFAFA]">
                {["ID", "Name", "Type", "ABN / ACN", "Verification", "Active cases", "Engagements", "Added", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedClients.map((c, i) => (
                <tr key={c.id} className={`border-b border-border last:border-0 hover:bg-[#F8FAFF] cursor-pointer transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}>
                  <td className="px-4 py-3"><span className="font-mono text-[11px] text-[#2855A6]">{c.id}</span></td>
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.type}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">{c.abn || c.acn || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${verifiedBadge(c.verified)}`}>{c.verified}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{c.cases}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{c.engagements}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.added}</td>
                  <td className="px-4 py-3"><button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><MoreHorizontal size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-[13px] text-muted-foreground">
              No clients match your filter criteria.
            </div>
          )}

          <div className="px-4 py-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{filtered.length} records shown</span>
            <div className="flex items-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="hover:text-foreground disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 py-0.5 bg-[#EEF2FA] text-[#2855A6] rounded font-semibold">{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="hover:text-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        )}
      </PageShell>
    </>
  );
}

// ─── New Engagement Modal ─────────────────────────────────────────────────────

const SERVICE_CATALOGUE = [
  { name: "Individual Tax Return", entity: "Individual" },
  { name: "Company Tax Return", entity: "Company" },
  { name: "Trust Tax Return", entity: "Trust" },
  { name: "SMSF Administration", entity: "SMSF" },
  { name: "BAS Preparation", entity: "Company/Partnership/Trust" },
  { name: "Business Advisory", entity: "Company/Partnership" },
  { name: "Partnership Tax Return", entity: "Partnership" },
];

function fmtFee(amount: number, freq: string) {
  const f = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(amount);
  const freqLabel: Record<string, string> = { Annual: "pa", Monthly: "pm", Quarterly: "per quarter", "Per event": "per event", "One-off": "" };
  return `${f} ${freqLabel[freq] ?? freq}`.trim();
}

type EngagementDraft = {
  clientId: string;
  clientName: string;
  clientType: string;
  adviserId: string;
  adviserName: string;
  services: { name: string; fee: number; freq: string; gst: boolean; scope: string; feeOverride: string }[];
  startDate: string;
  renewalDate: string;
  deliveryMethod: "esign" | "manual";
  notes: string;
};

type BillingFreq = "Monthly" | "Quarterly" | "Annual" | "Job-based" | "On completion" | "Weekly" | "Fortnightly";

const BILLING_FREQ_OPTIONS: { id: BillingFreq; label: string; desc: string }[] = [
  { id: "Monthly",       label: "Monthly",        desc: "Fixed amount billed each month — retainers, advisory, bookkeeping" },
  { id: "Quarterly",     label: "Quarterly",       desc: "Every quarter — BAS preparation, management reports" },
  { id: "Annual",        label: "Annual",          desc: "Once per year — tax returns, SMSF audit" },
  { id: "Weekly",        label: "Weekly",          desc: "Billed each week based on time or fixed retainer" },
  { id: "Fortnightly",   label: "Fortnightly",     desc: "Fixed or timesheet billing every two weeks" },
  { id: "Job-based",     label: "Job-based",       desc: "Single fixed fee invoiced when the job is created" },
  { id: "On completion", label: "On completion",   desc: "Invoice raised automatically when the job is marked complete" },
];

function NewEngagementModal({ onClose, onCreated }: { onClose: () => void; onCreated: (eng: typeof ENGAGEMENTS_DATA[0]) => void }) {
  const [step, setStep] = useState(1);
  const STEPS = ["Client", "Services & Fees", "Billing & Payment", "Engagement Letter", "Issue"];

  const [clientSearch, setClientSearch] = useState("");
  const [draft, setDraft] = useState<EngagementDraft>({
    clientId: "",
    clientName: "",
    clientType: "",
    adviserId: "STF-001",
    adviserName: "J. Okafor",
    services: [],
    startDate: "2024-08-01",
    renewalDate: "2025-06-30",
    deliveryMethod: "esign",
    notes: "",
  });

  // Billing state (separate from EngagementDraft to keep type clean)
  const [billingFreq, setBillingFreq] = useState<BillingFreq>("Monthly");
  const [billingPayMethod, setBillingPayMethod] = useState<"square-signing" | "square-link" | "manual">("square-signing");
  const [billingAutoSchedule, setBillingAutoSchedule] = useState(true);
  const [billingFirstDate, setBillingFirstDate] = useState(draft.startDate);

  const { data: clientsData } = useApiData(() => clientsApi.list(), []);
  const allClients = clientsData?.items ?? CLIENTS_DATA;

  const filteredClients = allClients.filter(c =>
    !clientSearch ||
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.id.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.abn && c.abn.includes(clientSearch)) ||
    (c.acn && c.acn.includes(clientSearch))
  );

  const selectClient = (c: typeof CLIENTS_DATA[0]) => {
    const clientId = c.id || `${c.type === "Individual" ? "P" : "E"}-${Math.floor(Math.random() * 90000 + 10000)}`;
    // Auto-add relevant services for client type
    const relevantFees = INITIAL_FEES.filter(f => {
      const svc = SERVICE_CATALOGUE.find(s => s.name === f.service);
      if (!svc) return false;
      if (c.type === "Individual") return f.service === "Individual Tax Return";
      if (c.type === "Company") return f.service === "Company Tax Return";
      if (c.type === "Trust") return f.service === "Trust Tax Return";
      if (c.type === "SMSF") return f.service === "SMSF Administration";
      if (c.type === "Partnership") return f.service === "Partnership Tax Return";
      return false;
    });
    setDraft(d => ({
      ...d,
      clientId,
      clientName: c.name,
      clientType: c.type,
      services: relevantFees.map(f => ({
        name: f.service,
        fee: f.amount,
        freq: f.frequency,
        gst: f.gst,
        scope: "",
        feeOverride: "",
      })),
    }));
  };

  const toggleService = (svcName: string) => {
    setDraft(d => {
      const exists = d.services.find(s => s.name === svcName);
      if (exists) return { ...d, services: d.services.filter(s => s.name !== svcName) };
      const fee = INITIAL_FEES.find(f => f.service === svcName);
      return {
        ...d,
        services: [
          ...d.services,
          { name: svcName, fee: fee?.amount ?? 0, freq: fee?.frequency ?? "Annual", gst: fee?.gst ?? true, scope: fee?.notes ?? "", feeOverride: "" },
        ],
      };
    });
  };

  const totalFeeNote = () => {
    const annualised = draft.services.reduce((sum, s) => {
      const amt = parseFloat(s.feeOverride) || s.fee;
      if (s.freq === "Annual") return sum + amt;
      if (s.freq === "Monthly") return sum + amt * 12;
      if (s.freq === "Quarterly") return sum + amt * 4;
      return sum + amt;
    }, 0);
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(annualised) + " pa (excl. GST)";
  };

  const issueDate = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  const handleIssue = async () => {
    const serviceLabel = draft.services.map(s => s.name).join(" + ");
    const totalAnnual = draft.services.reduce((sum, s) => {
      const amt = parseFloat(s.feeOverride) || s.fee;
      if (s.freq === "Annual") return sum + amt;
      if (s.freq === "Monthly") return sum + amt * 12;
      if (s.freq === "Quarterly") return sum + amt * 4;
      return sum + amt;
    }, 0);
    const feeStr = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(totalAnnual) + " pa";
    const newEng = {
      id: `ENG-2024-0${Math.floor(Math.random() * 900 + 100)}`,
      client: draft.clientName,
      service: serviceLabel || "—",
      signed: draft.deliveryMethod === "manual" ? issueDate : "",
      renewalDue: draft.renewalDate ? new Date(draft.renewalDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "30 Jun 2026",
      fee: feeStr,
      status: (draft.deliveryMethod === "esign" ? "Proposal issued" : "Active") as CaseStatus,
      adviser: draft.adviserName.split(" ").map((p, i) => i === 0 ? p[0] + "." : p).join(" "),
    };
    await engagementsApi.create(newEng);
    onCreated(newEng);
    onClose();
  };

  const canProceed =
    (step === 1 && !!(draft.clientId || draft.clientName)) ||
    (step === 2 && draft.services.length > 0) ||
    step === 3 || step === 4 || step === 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card w-[680px] max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">New engagement</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Step {step} of {STEPS.length} — {STEPS[step - 1]}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground mt-0.5"><X size={16} /></button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-0 flex items-center gap-0 shrink-0">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i + 1 < step ? "bg-[#2855A6] text-white" : i + 1 === step ? "bg-[#2855A6] text-white" : "bg-[#F0F0F0] text-muted-foreground"}`}>
                  {i + 1 < step ? <CheckCircle size={11} /> : i + 1}
                </div>
                <span className={`text-[11px] font-medium whitespace-nowrap ${i + 1 <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-px mx-2 ${i + 1 < step ? "bg-[#2855A6]" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── Step 1: Client ── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1.5">Search client or entity</label>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    placeholder="Name, entity or ID…"
                    autoFocus
                    className="w-full pl-7 pr-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                {filteredClients.map((c, i) => {
                  const isSelected = !!(draft.clientName === c.name || (draft.clientId && draft.clientId === c.id));
                  return (
                    <button
                      key={c.id || `cli-${i}`}
                      onClick={() => selectClient(c)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${isSelected ? "border-[#2855A6] bg-[#EEF2FA]" : "border-border hover:border-[#2855A6]/30 hover:bg-[#F8FAFF]"}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 ${isSelected ? "bg-[#2855A6] text-white" : "bg-[#E8E8E8] text-[#6F6F6F]"}`}>
                        {c.name.split(",")[0]?.charAt(0) ?? c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-foreground truncate">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.type}{c.id ? ` · ${c.id}` : ""}{c.abn ? ` · ABN ${c.abn}` : ""}</div>
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.verified.includes("Biometric") ? "bg-[#E3F8F5] text-[#20BCA4]" : "bg-[#F0F0F0] text-[#6F6F6F]"}`}>{c.verified}</span>
                    </button>
                  );
                })}
                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-[13px] text-muted-foreground">No clients match "{clientSearch}"</div>
                )}
              </div>
            </>
          )}

          {/* ── Step 2: Services & Fees ── */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#EEF2FA] border border-[#2855A6]/20 text-[12px] text-[#2855A6]">
                <Building2 size={13} />
                <span className="font-semibold">{draft.clientName}</span>
                <span className="text-[#6B8FCC]">· {draft.clientType}</span>
              </div>
              <div>
                <div className="text-[12px] font-semibold text-foreground mb-2">Select services from your practice catalogue</div>
                <div className="space-y-2">
                  {INITIAL_FEES.map(fee => {
                    const selected = draft.services.find(s => s.name === fee.service);
                    return (
                      <div key={fee.id} className={`border rounded-lg transition-colors ${selected ? "border-[#2855A6] bg-[#EEF2FA]/40" : "border-border bg-card"}`}>
                        <div className="flex items-start gap-3 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => toggleService(fee.service)}
                            className="mt-0.5 accent-[#2855A6]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-foreground">{fee.service}</span>
                              <span className="text-[11px] font-semibold text-[#2855A6]">{fmtFee(fee.amount, fee.frequency)}</span>
                              {fee.gst && <span className="text-[10px] text-muted-foreground">+ GST</span>}
                            </div>
                            {fee.notes && <div className="text-[11px] text-muted-foreground mt-0.5">{fee.notes}</div>}
                          </div>
                        </div>
                        {selected && (
                          <div className="px-4 pb-3 pt-0 border-t border-[#2855A6]/10 space-y-2 mt-0">
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <div>
                                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Fee override (blank = standard)</label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">$</span>
                                  <input
                                    type="number"
                                    value={selected.feeOverride}
                                    onChange={e => setDraft(d => ({ ...d, services: d.services.map(s => s.name === fee.service ? { ...s, feeOverride: e.target.value } : s) }))}
                                    placeholder={fee.amount.toString()}
                                    className="w-full pl-6 pr-3 py-1.5 text-[12px] bg-white border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]/30 focus:border-[#2855A6]"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Scope note (optional)</label>
                                <input
                                  type="text"
                                  value={selected.scope}
                                  onChange={e => setDraft(d => ({ ...d, services: d.services.map(s => s.name === fee.service ? { ...s, scope: e.target.value } : s) }))}
                                  placeholder="e.g. includes 1 rental property"
                                  className="w-full px-3 py-1.5 text-[12px] bg-white border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]/30 focus:border-[#2855A6]"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {draft.services.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-[#F5F5F5] rounded-lg border border-border text-[13px]">
                  <span className="text-muted-foreground font-medium">Total estimated fees</span>
                  <span className="font-bold text-foreground">{totalFeeNote()}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1.5">Responsible adviser</label>
                  <select
                    value={draft.adviserId}
                    onChange={e => {
                      const s = INITIAL_STAFF.find(st => st.id === e.target.value);
                      setDraft(d => ({ ...d, adviserId: e.target.value, adviserName: s?.name ?? "" }));
                    }}
                    className="w-full px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                  >
                    {INITIAL_STAFF.filter(s => ["Partner", "Director", "Senior Manager", "Manager"].includes(s.role)).map(s => (
                      <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1.5">Engagement start date</label>
                  <input
                    type="date"
                    value={draft.startDate}
                    onChange={e => setDraft(d => ({ ...d, startDate: e.target.value }))}
                    className="w-full px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1.5">Annual renewal date</label>
                  <input
                    type="date"
                    value={draft.renewalDate}
                    onChange={e => setDraft(d => ({ ...d, renewalDate: e.target.value }))}
                    className="w-full px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1.5">Additional notes</label>
                  <input
                    type="text"
                    value={draft.notes}
                    onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                    placeholder="Any special terms or conditions…"
                    className="w-full px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: Billing & Payment Setup ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#EEF2FA] border border-[#2855A6]/20 text-[12px] text-[#2855A6]">
                <Building2 size={13} />
                <span className="font-semibold">{draft.clientName}</span>
                <span className="text-[#6B8FCC]">· {draft.services.map(s => s.name).join(", ")}</span>
              </div>

              {/* Billing frequency */}
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-2">Billing frequency</label>
                <div className="space-y-1.5">
                  {BILLING_FREQ_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setBillingFreq(opt.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${billingFreq === opt.id ? "border-[#2855A6] bg-[#EEF2FA]/50" : "border-border hover:border-[#2855A6]/30"}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${billingFreq === opt.id ? "border-[#2855A6] bg-[#2855A6]" : "border-border"}`}>
                        {billingFreq === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-foreground">{opt.label}</div>
                        <div className="text-[11px] text-muted-foreground">{opt.desc}</div>
                      </div>
                      {billingFreq === opt.id && draft.services.length > 0 && (
                        <span className="ml-auto text-[11px] font-semibold text-[#2855A6] whitespace-nowrap">
                          {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(
                            (() => {
                              const total = draft.services.reduce((s, svc) => s + (parseFloat(svc.feeOverride) || svc.fee), 0);
                              if (opt.id === "Monthly") return total / 12;
                              if (opt.id === "Quarterly") return total / 4;
                              if (opt.id === "Weekly") return total / 52;
                              if (opt.id === "Fortnightly") return total / 26;
                              return total;
                            })()
                          )} {opt.id === "Monthly" ? "/ mo" : opt.id === "Quarterly" ? "/ qtr" : opt.id === "Weekly" ? "/ wk" : opt.id === "Fortnightly" ? "/ fn" : ""}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment collection method */}
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-2">Payment collection — how does the client pay?</label>
                <div className="space-y-2">
                  {[
                    {
                      id: "square-signing" as const,
                      icon: <div className="w-7 h-7 rounded bg-black flex items-center justify-center shrink-0"><span className="text-white text-[9px] font-bold">SQ</span></div>,
                      label: "Card saved during signing (recommended)",
                      desc: "Client enters card details via Square when they sign the engagement. Billing activates automatically on signing — fully set and forget.",
                      badge: "Set & forget",
                    },
                    {
                      id: "square-link" as const,
                      icon: <div className="w-7 h-7 rounded bg-black flex items-center justify-center shrink-0"><span className="text-white text-[9px] font-bold">SQ</span></div>,
                      label: "Square payment link per invoice",
                      desc: "A Square-hosted payment link is emailed to the client each billing cycle. No card stored upfront.",
                      badge: null,
                    },
                    {
                      id: "manual" as const,
                      icon: <div className="w-7 h-7 rounded bg-[#F0F0F0] flex items-center justify-center shrink-0"><CreditCard size={13} className="text-[#6F6F6F]" /></div>,
                      label: "Manual / EFT",
                      desc: "Invoice raised automatically but payment collected outside Square. Mark as paid manually or via bank feed.",
                      badge: null,
                    },
                  ].map(opt => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${billingPayMethod === opt.id ? "border-[#2855A6] bg-[#EEF2FA]/40" : "border-border hover:border-[#2855A6]/30"}`}
                    >
                      <input type="radio" name="billingPay" checked={billingPayMethod === opt.id} onChange={() => setBillingPayMethod(opt.id)} className="mt-1 accent-[#2855A6]" />
                      {opt.icon}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-foreground">{opt.label}</span>
                          {opt.badge && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31]">{opt.badge}</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Auto-schedule toggle + first date */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`flex items-start gap-3 p-3 rounded-lg border col-span-2 ${billingAutoSchedule ? "border-[#2855A6]/30 bg-[#EEF2FA]/30" : "border-border"}`}>
                  <input type="checkbox" checked={billingAutoSchedule} onChange={e => setBillingAutoSchedule(e.target.checked)} className="mt-0.5 accent-[#2855A6] w-4 h-4" />
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">Auto-create billing schedule on signing</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">A billing schedule is created in Billing & Payments automatically when the client signs. Invoices and Xero entries are raised each cycle without any manual action.</div>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1.5">First billing date</label>
                  <input type="date" value={billingFirstDate} onChange={e => setBillingFirstDate(e.target.value)} className="w-full px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all" />
                </div>
                <div className="flex items-end">
                  <div className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded text-[12px]">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Xero invoice</div>
                    <div className="text-foreground font-medium">Auto-raised {billingFreq === "Monthly" ? "monthly" : billingFreq === "Quarterly" ? "quarterly" : billingFreq === "Annual" ? "annually" : billingFreq === "Weekly" ? "weekly" : billingFreq === "Fortnightly" ? "fortnightly" : "on job event"}</div>
                  </div>
                </div>
              </div>

              {/* Summary callout */}
              {billingAutoSchedule && (
                <div className="px-4 py-3 bg-[#E8F7EB] border border-[#2EA843]/20 rounded-lg text-[12px] text-[#1E7A31] flex items-start gap-2">
                  <CheckCircle size={13} className="shrink-0 mt-0.5" />
                  <span>
                    Once signed, <strong>{draft.clientName || "the client"}</strong> will be billed{" "}
                    <strong>{billingFreq === "Monthly" ? "every month" : billingFreq === "Quarterly" ? "every quarter" : billingFreq === "Annual" ? "annually" : billingFreq === "Weekly" ? "weekly" : billingFreq === "Fortnightly" ? "fortnightly" : "on job completion"}</strong>
                    {billingPayMethod === "square-signing" ? " via their saved Square card" : billingPayMethod === "square-link" ? " via Square payment link" : " — invoice sent for manual payment"}.
                    {" "}Invoices are created in Xero automatically. No manual action required.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Engagement Letter preview ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground bg-[#FEF6E9] border border-[#F5A623]/30 rounded-lg px-3 py-2.5">
                <AlertTriangle size={13} className="text-[#F5A623] shrink-0" />
                <span>Preview only — the final letter will be generated from your practice template. Review and confirm the terms below before issuing.</span>
              </div>

              {/* Letter */}
              <div className="bg-white border border-border rounded-lg overflow-hidden">
                {/* Letterhead */}
                <div className="px-8 pt-7 pb-5 border-b border-border bg-[#FAFAFA] flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded bg-[#2855A6] flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold">EN</span>
                      </div>
                      <span className="text-[14px] font-bold text-foreground">Grow Advisory Group</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">Level 12, 101 Collins Street, Melbourne VIC 3000</div>
                    <div className="text-[11px] text-muted-foreground">ABN 44 123 456 789 · (03) 9000 1234 · admin@growadvisory.com.au</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-muted-foreground">{issueDate}</div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">Ref: {draft.clientId || "—"}</div>
                  </div>
                </div>

                <div className="px-8 py-6 space-y-4 text-[13px] text-foreground leading-relaxed">
                  {/* Addressee */}
                  <div>
                    <div className="font-semibold">{draft.clientName || "—"}</div>
                    {draft.clientType && <div className="text-muted-foreground text-[12px]">{draft.clientType}</div>}
                  </div>

                  <div className="font-semibold text-[14px] mt-2">Letter of Engagement</div>

                  <p>
                    Dear {draft.clientName ? draft.clientName.split(",")[0] : "Client"},
                  </p>

                  <p>
                    We are pleased to confirm our engagement to provide the following professional services to you on the terms set out in this letter. This letter, together with our <span className="font-medium">Standard Terms and Conditions</span>, forms the basis of our engagement.
                  </p>

                  {/* Services table */}
                  <div>
                    <div className="font-semibold text-[12px] uppercase tracking-wide text-muted-foreground mb-2">Services &amp; Fees</div>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="bg-[#FAFAFA] border-b border-border">
                            <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Service</th>
                            <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Scope</th>
                            <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Fee (excl. GST)</th>
                            <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Frequency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {draft.services.map(s => (
                            <tr key={s.name} className="border-b border-border last:border-0">
                              <td className="px-4 py-2.5 font-medium">{s.name}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">{s.scope || INITIAL_FEES.find(f => f.service === s.name)?.notes || "Standard scope"}</td>
                              <td className="px-4 py-2.5 text-right font-semibold">
                                {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(parseFloat(s.feeOverride) || s.fee)}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground">{s.freq}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#FAFAFA] border-t border-border">
                            <td colSpan={2} className="px-4 py-2 font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">Total (annualised, excl. GST)</td>
                            <td className="px-4 py-2 text-right font-bold text-foreground">{totalFeeNote().replace(" pa (excl. GST)", "")}</td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">All fees are quoted in Australian dollars and exclude GST. GST will be added to invoices where applicable.</p>
                  </div>

                  {/* Billing & Payment terms */}
                  <div className="space-y-2 text-[12px]">
                    <div className="font-semibold text-[12px] uppercase tracking-wide text-muted-foreground">Billing &amp; Payment Authority</div>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-2 divide-x divide-border bg-[#FAFAFA] border-b border-border">
                        <div className="px-4 py-2">
                          <div className="text-[10px] text-muted-foreground">Billing frequency</div>
                          <div className="text-[13px] font-semibold text-foreground">{billingFreq}</div>
                        </div>
                        <div className="px-4 py-2">
                          <div className="text-[10px] text-muted-foreground">First billing date</div>
                          <div className="text-[13px] font-semibold text-foreground">{billingFirstDate ? new Date(billingFirstDate).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—"}</div>
                        </div>
                      </div>
                      <div className="px-4 py-3 text-[12px] text-foreground">
                        {billingPayMethod === "square-signing" && (
                          <p>By signing this engagement letter, you authorise Grow Advisory Group to charge your nominated payment card via <strong>Square</strong> on a <strong>{billingFreq.toLowerCase()}</strong> basis for the fees set out above. Your card details will be collected securely during the signing process and stored by Square. You may update or revoke this authority by contacting us in writing with 14 days notice.</p>
                        )}
                        {billingPayMethod === "square-link" && (
                          <p>Invoices will be issued on a <strong>{billingFreq.toLowerCase()}</strong> basis. A secure Square payment link will be emailed to you with each invoice. Payment is due within 14 days of the invoice date.</p>
                        )}
                        {billingPayMethod === "manual" && (
                          <p>Invoices will be issued on a <strong>{billingFreq.toLowerCase()}</strong> basis and are payable within 14 days by EFT to the account details shown on each invoice.</p>
                        )}
                      </div>
                      {billingPayMethod === "square-signing" && (
                        <div className="border-t border-border px-4 py-3 bg-[#FAFAFA]">
                          <div className="text-[11px] text-muted-foreground mb-2 font-semibold">Payment authority — to be completed during signing</div>
                          <div className="grid grid-cols-2 gap-2">
                            {["Cardholder name", "Card number", "Expiry", "CVV"].map(f => (
                              <div key={f} className={`border border-dashed border-border rounded px-3 py-2 ${f === "Card number" ? "col-span-2" : ""}`}>
                                <div className="text-[10px] text-muted-foreground">{f}</div>
                                <div className="text-[11px] text-[#D1D1D1] italic mt-0.5">Collected securely via Square</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="space-y-2 text-[12px]">
                    <div className="font-semibold text-[12px] uppercase tracking-wide text-muted-foreground">Terms &amp; Conditions</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["Engagement commencement", draft.startDate ? new Date(draft.startDate).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—"],
                        ["Annual renewal date", draft.renewalDate ? new Date(draft.renewalDate).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—"],
                        ["Responsible adviser", draft.adviserName],
                        ["Invoicing", `${billingFreq} in ${["Monthly","Weekly","Fortnightly"].includes(billingFreq) ? "advance" : "arrears"}`],
                        ["Payment terms", billingPayMethod === "manual" ? "14 days from invoice date (EFT)" : "Automatic via Square"],
                        ["Governing law", "State of Victoria, Australia"],
                      ].map(([k, v]) => (
                        <div key={k} className="bg-[#FAFAFA] rounded px-3 py-2">
                          <div className="text-[10px] text-muted-foreground">{k}</div>
                          <div className="text-[12px] font-medium text-foreground">{v}</div>
                        </div>
                      ))}
                    </div>
                    {draft.notes && (
                      <div className="bg-[#FEF6E9] border border-[#F5A623]/20 rounded px-3 py-2 text-[12px]">
                        <span className="font-semibold">Additional terms: </span>{draft.notes}
                      </div>
                    )}
                  </div>

                  <p className="text-[12px]">
                    This engagement is subject to our <span className="text-[#2855A6] underline cursor-pointer">Standard Terms and Conditions</span> (available on our website and incorporated by reference), including our obligations under the Tax Practitioners Board Code of Professional Conduct and the <em>Tax Agent Services Act 2009</em>.
                  </p>

                  <p className="text-[12px]">
                    Please sign and return this letter to indicate your acceptance of these terms. If you have any questions, please contact {draft.adviserName} at admin@growadvisory.com.au.
                  </p>

                  <div className="pt-4 border-t border-border">
                    <div className="text-[12px] font-semibold mb-3">Authorised on behalf of Grow Advisory Group</div>
                    <div className="flex items-end gap-12">
                      <div>
                        <div className="w-40 h-px bg-border mb-1" />
                        <div className="text-[11px] text-muted-foreground">{draft.adviserName}</div>
                        <div className="text-[11px] text-muted-foreground">{INITIAL_STAFF.find(s => s.id === draft.adviserId)?.role ?? "Adviser"}</div>
                      </div>
                      <div>
                        <div className="w-40 h-px bg-border mb-1" />
                        <div className="text-[11px] text-muted-foreground">Client signature</div>
                        <div className="text-[11px] text-muted-foreground">{draft.clientName}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Issue ── */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-[12px] font-semibold text-foreground mb-2">How would you like to issue this engagement letter?</div>
                {[
                  {
                    id: "esign" as const,
                    icon: <Pen size={16} className="text-[#2855A6]" />,
                    label: "Send for e-signature via process builder",
                    desc: "Creates an onboarding case and routes the client through your engagement signing flow — including identity verification, consent, and eSign. Recommended.",
                    badge: "Recommended",
                  },
                  {
                    id: "manual" as const,
                    icon: <FileText size={16} className="text-[#6F6F6F]" />,
                    label: "Issue directly (mark as active)",
                    desc: "Record the engagement immediately without sending for e-signature. Use when the client has already signed manually.",
                    badge: null,
                  },
                ].map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${draft.deliveryMethod === opt.id ? "border-[#2855A6] bg-[#EEF2FA]/50" : "border-border hover:border-[#2855A6]/30"}`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      checked={draft.deliveryMethod === opt.id}
                      onChange={() => setDraft(d => ({ ...d, deliveryMethod: opt.id }))}
                      className="mt-0.5 accent-[#2855A6]"
                    />
                    <div className="p-1.5 rounded-lg bg-white border border-border shrink-0">{opt.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground">{opt.label}</span>
                        {opt.badge && <span className="px-1.5 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31] text-[10px] font-semibold">{opt.badge}</span>}
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {draft.deliveryMethod === "esign" && (
                <div className="px-4 py-3.5 bg-[#EEF2FA] border border-[#2855A6]/20 rounded-lg space-y-2">
                  <div className="text-[12px] font-semibold text-[#2855A6] flex items-center gap-1.5"><Workflow size={13} />Process builder — Engagement signing flow</div>
                  <div className="text-[11px] text-muted-foreground">The client will be guided through these steps:</div>
                  <div className="space-y-1.5">
                    {[
                      { label: "Welcome & authentication", color: "#2855A6", note: "" },
                      { label: "Consent centre", color: "#D97706", note: "" },
                      { label: "Proposal review — fee schedule attached", color: "#D97706", note: "" },
                      ...(billingPayMethod === "square-signing" ? [{ label: "Payment authority — card saved via Square", color: "#000000", note: "Set & forget" }] : []),
                      { label: "E-signature — letter of engagement", color: "#D97706", note: "" },
                      { label: "Internal review & acceptance decision", color: "#D0021B", note: "" },
                    ].map((s, i) => (
                      <div key={s.label} className="flex items-center gap-2 text-[11px]">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ background: s.color }}>{i + 1}</div>
                        <span className="text-foreground flex-1">{s.label}</span>
                        {s.note && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31]">{s.note}</span>}
                      </div>
                    ))}
                  </div>
                  {billingPayMethod === "square-signing" && (
                    <div className="mt-1 pt-2 border-t border-[#2855A6]/10 flex items-start gap-1.5 text-[11px] text-[#1A5DA6]">
                      <CheckCircle size={11} className="shrink-0 mt-0.5" />
                      <span>Once the client saves their card and signs, the <strong>{billingFreq.toLowerCase()}</strong> billing schedule activates automatically in Billing &amp; Payments — no further action needed.</span>
                    </div>
                  )}
                  <button className="flex items-center gap-1.5 text-[11px] text-[#2855A6] font-semibold hover:underline mt-1">
                    <Workflow size={11} />Customise in process builder
                  </button>
                </div>
              )}

              {/* Summary */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-[#FAFAFA] border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Engagement summary</div>
                <div className="divide-y divide-border">
                  {[
                    ["Client", draft.clientName],
                    ["Services", draft.services.map(s => s.name).join(", ") || "—"],
                    ["Total fees", totalFeeNote()],
                    ["Billing frequency", billingFreq],
                    ["Payment method", billingPayMethod === "square-signing" ? "Square — card saved during signing" : billingPayMethod === "square-link" ? "Square — payment link per invoice" : "Manual / EFT"],
                    ["Auto billing schedule", billingAutoSchedule ? "Yes — activates on signing" : "No"],
                    ["Adviser", draft.adviserName],
                    ["Start date", draft.startDate ? new Date(draft.startDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—"],
                    ["Renewal date", draft.renewalDate ? new Date(draft.renewalDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-4 px-4 py-2.5 text-[12px]">
                      <span className="text-muted-foreground w-36 shrink-0">{k}</span>
                      <span className="text-foreground font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <button
            onClick={() => step < STEPS.length ? setStep(step + 1) : handleIssue()}
            disabled={!canProceed}
            className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {step === STEPS.length
              ? draft.deliveryMethod === "esign"
                ? <><Pen size={13} />Issue &amp; send for signature</>
                : <><CheckCircle size={13} />Create engagement</>
              : step === 2 ? <>Set up billing <ChevronRight size={13} /></>
              : step === 3 ? <>Preview letter <ChevronRight size={13} /></>
              : <>Continue <ChevronRight size={13} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Engagements screen ───────────────────────────────────────────────────────

const ENGAGEMENTS_DATA = [
  { id: "ENG-2024-0450", client: "Manoj Tech Solutions Pty Ltd", service: "Company Tax Return (FY25) + R&D Tax Incentive", signed: "Today", renewalDue: "30 Jun 2027", fee: "$6,350 pa", status: "Active", adviser: "J. Okafor" },
  { id: "ENG-2024-0441", client: "Greenbrook Unit Trust", service: "Trust Tax + Advisory", signed: "18 Jul 2024", renewalDue: "30 Jun 2025", fee: "$8,800 pa", status: "Active", adviser: "J. Okafor" },
  { id: "ENG-2024-0440", client: "Caldwell SMSF", service: "SMSF Administration", signed: "14 Jul 2024", renewalDue: "30 Jun 2025", fee: "$3,300 pa", status: "Active", adviser: "S. Patel" },
  { id: "ENG-2024-0439", client: "Harrington, Sophie", service: "Individual Tax", signed: "2 Jun 2024", renewalDue: "31 May 2025", fee: "$1,650 pa", status: "Active", adviser: "J. Okafor" },
  { id: "ENG-2024-0438", client: "Harrington, Sophie", service: "Business Advisory", signed: "2 Jun 2024", renewalDue: "31 May 2025", fee: "$6,600 pa", status: "Active", adviser: "J. Okafor" },
  { id: "ENG-2024-0430", client: "Apex Ventures Pty Ltd", service: "Company Tax + BAS", signed: "", renewalDue: "", fee: "$4,950 pa", status: "Proposal issued", adviser: "A. Brennan" },
  { id: "ENG-2023-0391", client: "The Marcelline Family Trust", service: "Trust Tax", signed: "14 Aug 2023", renewalDue: "31 Jul 2024", fee: "$5,500 pa", status: "Renewal due", adviser: "J. Okafor" },
  { id: "ENG-2022-0310", client: "Blackwood & Associates", service: "Partnership Tax", signed: "10 Sep 2022", renewalDue: "31 Aug 2024", fee: "$3,850 pa", status: "Terminated", adviser: "A. Brennan" },
];

function engStatusColor(s: string) {
  const m: Record<string, string> = {
    Active: "bg-[#E8F7EB] text-[#1E7A31]",
    "Proposal issued": "bg-[#EEF2FA] text-[#2855A6]",
    "Renewal due": "bg-[#FEF6E9] text-[#B87A1A]",
    Terminated: "bg-[#F0F0F0] text-[#6F6F6F]",
    Conditional: "bg-[#FEF6E9] text-[#B87A1A]",
  };
  return m[s] ?? "bg-[#F0F0F0] text-[#6F6F6F]";
}

type EngagementRow = typeof ENGAGEMENTS_DATA[0];

function EngagementFullPage({
  eng,
  onBack,
  onUpdate,
}: {
  eng: EngagementRow;
  onBack: () => void;
  onUpdate?: (updated: EngagementRow) => void;
}) {
  const [tab, setTab] = useState("Overview");
  const [currentEng, setCurrentEng] = useState<EngagementRow>(eng);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [variations, setVariations] = useState<{ name: string; fee: string; date: string }[]>([]);
  const [showAddVariation, setShowAddVariation] = useState(false);
  const [varName, setVarName] = useState("");
  const [varFee, setVarFee] = useState("");
  const [docs, setDocs] = useState([
    { name: "Letter of Engagement", date: currentEng.signed || "Pending", type: "PDF", signed: !!currentEng.signed },
    { name: "Fee Disclosure Statement", date: currentEng.signed || "Pending", type: "PDF", signed: !!currentEng.signed },
  ]);

  const tabs = ["Overview", "Services", "Documents", "History", "Activity"];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleIssueRenewal = async () => {
    const updated = { ...currentEng, status: "Active", renewalDue: "30 Jun 2026" };
    setCurrentEng(updated);
    await engagementsApi.updateStatus(updated.id, "Active");
    await activityApi.log({
      time: "Just now",
      actor: "J. Okafor",
      action: "Issued renewal letter",
      target: `${updated.id} · ${updated.client}`,
      type: "accept",
    });
    if (onUpdate) onUpdate(updated);
    showToast("Renewal engagement letter issued successfully");
  };

  const handleSendReminder = async () => {
    await activityApi.log({
      time: "Just now",
      actor: "J. Okafor",
      action: "Sent engagement signing reminder",
      target: `${currentEng.id} · ${currentEng.client}`,
      type: "proposal",
    });
    showToast("Signing reminder sent to client");
  };

  const handleTerminate = async () => {
    const updated = { ...currentEng, status: "Terminated" };
    setCurrentEng(updated);
    await engagementsApi.updateStatus(updated.id, "Terminated");
    await activityApi.log({
      time: "Just now",
      actor: "J. Okafor",
      action: "Terminated engagement",
      target: `${updated.id} · ${updated.client}`,
      type: "reject",
    });
    if (onUpdate) onUpdate(updated);
    showToast("Engagement marked as Terminated");
  };

  const handleAddVariation = () => {
    if (!varName.trim()) return;
    setVariations(prev => [...prev, { name: varName, fee: `$${varFee || "500"}`, date: "Just now" }]);
    setShowAddVariation(false);
    setVarName("");
    setVarFee("");
    showToast("Variation added to engagement scope");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <header className="h-[52px] min-h-[52px] bg-card border-b border-border flex items-center px-6 gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={14} /> Back to Engagements
        </button>
        <div className="w-px h-4 bg-border" />
        <span className="font-mono text-[12px] text-[#2855A6]">{currentEng.id}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${engStatusColor(currentEng.status)}`}>{currentEng.status}</span>
        <div className="flex-1" />
        {currentEng.status === "Renewal due" && (
          <button
            onClick={handleIssueRenewal}
            className="px-3 py-1.5 border border-[#F5A623] text-[#B87A1A] text-[12px] font-semibold rounded hover:bg-[#FEF6E9] transition-colors"
          >
            Issue renewal
          </button>
        )}
        {currentEng.status === "Proposal issued" && (
          <button
            onClick={handleSendReminder}
            className="px-3 py-1.5 border border-border text-[12px] font-semibold rounded hover:bg-muted transition-colors"
          >
            Send reminder
          </button>
        )}
        {currentEng.status !== "Terminated" && (
          <button
            onClick={handleTerminate}
            className="px-3 py-1.5 border border-[#D0021B] text-[#D0021B] text-[12px] font-semibold rounded hover:bg-[#FCE8EB] transition-colors"
          >
            Terminate
          </button>
        )}
      </header>

      {/* Page header */}
      <div className="px-8 pt-6 pb-0 border-b border-border bg-card">
        {toastMsg && (
          <div className="mb-4 px-3 py-2 bg-[#E8F7EB] border border-[#2EA843]/30 rounded text-[12px] font-semibold text-[#1E7A31] flex items-center gap-2">
            <CheckCircle size={14} />
            {toastMsg}
          </div>
        )}
        <h1 className="text-[22px] font-bold text-foreground leading-tight">{currentEng.client}</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5 mb-4">{currentEng.service}</p>

        {/* Key metrics row */}
        <div className="flex items-center gap-6 mb-4">
          {[
            { label: "Annual fee", value: currentEng.fee },
            { label: "Adviser", value: currentEng.adviser },
            { label: "Signed", value: currentEng.signed || "Not yet signed" },
            { label: "Renewal due", value: currentEng.renewalDue || "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{label}</div>
              <div className="text-[13px] font-semibold text-foreground mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 -mb-px">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-[12px] font-semibold border-b-2 transition-colors whitespace-nowrap ${tab === t ? "border-[#2855A6] text-[#2855A6]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Tab body */}
      <div className="flex-1 overflow-y-auto p-8">
        {tab === "Overview" && (
          <div className="max-w-[760px] space-y-6">
            {currentEng.status === "Renewal due" && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[#FEF6E9] border border-[#F5A623]/30">
                <AlertTriangle size={14} className="text-[#F5A623] mt-0.5 shrink-0" />
                <div>
                  <div className="text-[12px] font-semibold text-[#B87A1A]">Renewal overdue</div>
                  <div className="text-[11px] text-[#B87A1A] mt-0.5">This engagement passed its renewal date. Issue a new letter of engagement to continue the client relationship.</div>
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-[#FAFAFA]">
                <span className="text-[12px] font-semibold text-foreground">Engagement terms</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: "Scope of services", value: currentEng.service, done: true },
                  { label: "Fee schedule", value: `${currentEng.fee} — invoiced annually`, done: true },
                  { label: "Client signature", value: currentEng.signed ? `Signed ${currentEng.signed}` : "Awaiting client signature", done: !!currentEng.signed },
                  { label: "Practice acceptance", value: currentEng.status === "Active" ? "Accepted" : "Pending", done: currentEng.status === "Active" },
                  { label: "Next renewal", value: currentEng.renewalDue || "Not set", done: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4 px-5 py-3">
                    {item.done
                      ? <CheckCircle size={14} className="text-[#2EA843] shrink-0" />
                      : <Clock size={14} className="text-[#F5A623] shrink-0" />}
                    <span className="text-[12px] font-semibold text-foreground w-[180px] shrink-0">{item.label}</span>
                    <span className="text-[12px] text-muted-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-[#FAFAFA] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-foreground">Linked onboarding case</span>
              </div>
              <div className="px-5 py-4 text-[12px] text-muted-foreground">
                This engagement was created from an onboarding case. Historical case records are preserved in the system vault.
              </div>
            </div>
          </div>
        )}

        {tab === "Services" && (
          <div className="max-w-[760px] space-y-6">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-[#FAFAFA] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-foreground">Included services</span>
                <span className="text-[11px] text-muted-foreground">Scope as agreed in letter of engagement</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { name: currentEng.service, fee: currentEng.fee, frequency: "Annual", status: "Active" },
                ].map((svc, i) => (
                  <div key={i} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#EEF2FA] flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-[#2855A6]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-foreground">{svc.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{svc.frequency} engagement · {svc.fee}</div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E8F7EB] text-[#1E7A31]">{svc.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-[#FAFAFA]">
                <span className="text-[12px] font-semibold text-foreground">Fee schedule</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: "Agreed annual fee", value: currentEng.fee },
                  { label: "Billing frequency", value: "Annual — invoiced on renewal" },
                  { label: "Payment method", value: "Direct debit via Square" },
                  { label: "GST", value: "Included" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center px-5 py-3">
                    <span className="text-[12px] text-muted-foreground w-[220px] shrink-0">{label}</span>
                    <span className="text-[12px] font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-[#FAFAFA] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-foreground">Out-of-scope work ({variations.length})</span>
                <button
                  onClick={() => setShowAddVariation(true)}
                  className="text-[11px] text-[#2855A6] font-semibold hover:underline"
                >
                  + Add variation
                </button>
              </div>
              {variations.length === 0 ? (
                <div className="px-5 py-6 text-center text-[12px] text-muted-foreground">
                  No out-of-scope variations recorded for this engagement.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {variations.map((v, i) => (
                    <div key={i} className="px-5 py-3 flex items-center justify-between text-[12px]">
                      <div>
                        <div className="font-semibold text-foreground">{v.name}</div>
                        <div className="text-[11px] text-muted-foreground">{v.date}</div>
                      </div>
                      <div className="font-bold text-[#2855A6]">{v.fee}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "Documents" && (
          <div className="max-w-[760px] space-y-4">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-[#FAFAFA] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-foreground">Engagement documents</span>
                <label className="flex items-center gap-1.5 text-[11px] text-[#2855A6] font-semibold hover:underline cursor-pointer">
                  <Upload size={11} /> Upload document
                  <input
                    type="file"
                    className="sr-only"
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        setDocs(prev => [...prev, { name: file.name, date: "Just now", type: "PDF", signed: true }]);
                        showToast(`Uploaded ${file.name}`);
                      }
                    }}
                  />
                </label>
              </div>
              <div className="divide-y divide-border">
                {docs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-8 h-8 rounded bg-[#FCE8EB] flex items-center justify-center shrink-0">
                      <FileText size={13} className="text-[#D0021B]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] font-semibold text-foreground">{doc.name}</div>
                      <div className="text-[11px] text-muted-foreground">{doc.type} · {doc.date}</div>
                    </div>
                    {doc.signed
                      ? <span className="text-[11px] font-semibold text-[#2EA843] flex items-center gap-1"><CheckCircle size={11} /> Signed</span>
                      : <span className="text-[11px] font-semibold text-[#F5A623]">Awaiting signature</span>}
                    <button
                      onClick={() => showToast(`Downloading ${doc.name}...`)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "History" && (
          <div className="max-w-[760px]">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-[#FAFAFA]">
                <span className="text-[12px] font-semibold text-foreground">Engagement history</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { date: currentEng.signed || "29 Jul 2026", event: "Engagement signed", detail: `${currentEng.service} · ${currentEng.fee}`, type: "sign" },
                  { date: "28 Jul 2026", event: "Onboarding case accepted", detail: "Client onboarding completed via EnTIQ Start", type: "accept" },
                  { date: "24 Jul 2026", event: "Proposal issued", detail: `Fee proposal for ${currentEng.service} sent to client`, type: "proposal" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.type === "sign" ? "bg-[#2EA843]" : item.type === "accept" ? "bg-[#2855A6]" : "bg-[#20BCA4]"}`} />
                    <div className="flex-1">
                      <div className="text-[12px] font-semibold text-foreground">{item.event}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</div>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "Activity" && (
          <div className="max-w-[760px]">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-[#FAFAFA]">
                <span className="text-[12px] font-semibold text-foreground">Recent activity</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { time: "Today, 11:42 am", actor: currentEng.adviser, action: `Viewed engagement ${currentEng.id}` },
                  { time: "22 Jul 2026", actor: currentEng.adviser, action: "Engagement accepted and activated" },
                  { time: "18 Jul 2026", actor: "Client", action: "Letter of engagement signed via eSign" },
                  { time: "15 Jul 2026", actor: currentEng.adviser, action: "Proposal issued to client" },
                ].map((ev, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-3">
                    <div className="w-6 h-6 rounded-full bg-[#EEF2FA] flex items-center justify-center text-[10px] font-bold text-[#2855A6] shrink-0">
                      {ev.actor.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <span className="text-[12px] font-semibold text-foreground">{ev.actor}</span>
                      <span className="text-[12px] text-muted-foreground"> · {ev.action}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{ev.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Variation Modal */}
      {showAddVariation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="bg-card w-[420px] rounded-xl p-5 shadow-2xl border border-border space-y-4">
            <h3 className="text-[15px] font-semibold text-foreground">Add Scope Variation</h3>
            <div className="space-y-3 text-[12px]">
              <div>
                <label className="block font-medium mb-1">Variation Description</label>
                <input
                  value={varName}
                  onChange={e => setVarName(e.target.value)}
                  placeholder="e.g. Capital Gains Tax calculation for property disposal"
                  className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Agreed Fee Amount ($ AUD)</label>
                <input
                  type="number"
                  value={varFee}
                  onChange={e => setVarFee(e.target.value)}
                  placeholder="750"
                  className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddVariation(false)} className="px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleAddVariation} className="px-4 py-1.5 bg-[#2855A6] text-white text-[12px] font-semibold rounded hover:bg-[#1F4491]">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EngagementDetailDrawer({
  eng,
  onClose,
  onOpenFull,
  onUpdate,
}: {
  eng: EngagementRow;
  onClose: () => void;
  onOpenFull: () => void;
  onUpdate?: (updated: EngagementRow) => void;
}) {
  const [tab, setTab] = useState("Overview");
  const [currentEng, setCurrentEng] = useState<EngagementRow>(eng);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const tabs = ["Overview", "Services", "Documents", "Activity"];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleIssueRenewal = async () => {
    const updated = { ...currentEng, status: "Active", renewalDue: "30 Jun 2026" };
    setCurrentEng(updated);
    await engagementsApi.updateStatus(updated.id, "Active");
    if (onUpdate) onUpdate(updated);
    showToast("Renewal issued");
  };

  const handleSendReminder = async () => {
    showToast("Signing reminder sent");
  };

  const handleTerminate = async () => {
    const updated = { ...currentEng, status: "Terminated" };
    setCurrentEng(updated);
    await engagementsApi.updateStatus(updated.id, "Terminated");
    if (onUpdate) onUpdate(updated);
    showToast("Engagement terminated");
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[680px] bg-card h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-0 border-b border-border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[12px] text-[#2855A6] bg-[#EEF2FA] px-2 py-0.5 rounded">{currentEng.id}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${engStatusColor(currentEng.status)}`}>{currentEng.status}</span>
              </div>
              <h2 className="text-[18px] font-semibold text-foreground leading-tight">{currentEng.client}</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">{currentEng.service}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground">
              <XCircle size={18} />
            </button>
          </div>

          {toastMsg && (
            <div className="mb-3 px-3 py-2 bg-[#E8F7EB] border border-[#2EA843]/30 rounded text-[12px] font-semibold text-[#1E7A31] flex items-center gap-2">
              <CheckCircle size={14} />
              {toastMsg}
            </div>
          )}

          <div className="flex gap-0 -mb-px">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-[12px] font-semibold border-b-2 transition-colors whitespace-nowrap ${tab === t ? "border-[#2855A6] text-[#2855A6]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "Overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Annual fee", currentEng.fee],
                  ["Adviser", currentEng.adviser],
                  ["Signed", currentEng.signed || "Not yet signed"],
                  ["Renewal due", currentEng.renewalDue || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[#F5F5F5] rounded-lg p-3">
                    <div className="text-[11px] text-muted-foreground mb-0.5">{k}</div>
                    <div className="text-[13px] font-medium text-foreground">{v}</div>
                  </div>
                ))}
              </div>

              {currentEng.status === "Renewal due" && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[#FEF6E9] border border-[#F5A623]/30">
                  <AlertTriangle size={14} className="text-[#F5A623] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold text-[#B87A1A]">Renewal overdue</div>
                    <div className="text-[11px] text-[#B87A1A] mt-0.5">This engagement passed its renewal date. Issue a new letter of engagement to continue.</div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-3">Engagement terms</h3>
                <div className="space-y-2">
                  {[
                    { label: "Scope of services", done: true },
                    { label: "Fee schedule", done: true },
                    { label: "Client signature", done: !!currentEng.signed },
                    { label: "Practice acceptance", done: currentEng.status === "Active" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      {item.done
                        ? <CheckCircle size={14} className="text-[#2EA843] shrink-0" />
                        : <Clock size={14} className="text-[#F5A623] shrink-0" />}
                      <span className={`text-[13px] ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                      {item.done && <span className="ml-auto text-[11px] text-[#2EA843] font-semibold">Completed</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "Services" && (
            <div className="space-y-3">
              <div className="bg-[#F5F5F5] rounded-lg p-4 text-[13px]">
                <div className="font-semibold text-foreground">{currentEng.service}</div>
                <div className="text-muted-foreground mt-1">{currentEng.fee} · Billed annually</div>
              </div>
            </div>
          )}

          {tab === "Documents" && (
            <div className="space-y-3">
              <div className="border border-border rounded-lg p-3 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#2855A6]" />
                  <span>Letter of Engagement ({currentEng.id}.pdf)</span>
                </div>
                <button onClick={() => showToast("Downloading document...")} className="text-[#2855A6] font-semibold hover:underline">Download</button>
              </div>
            </div>
          )}

          {tab === "Activity" && (
            <div className="space-y-3 text-[12px]">
              <div className="p-3 border border-border rounded-lg">
                <div className="font-semibold">Engagement active</div>
                <div className="text-[11px] text-muted-foreground">Managed by {currentEng.adviser}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border px-6 py-4 flex items-center gap-3">
          <button onClick={onOpenFull} className="px-4 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors">
            Open full engagement
          </button>
          {currentEng.status === "Renewal due" && (
            <button
              onClick={handleIssueRenewal}
              className="px-4 py-2 border border-[#F5A623] text-[#B87A1A] text-[13px] font-semibold rounded hover:bg-[#FEF6E9] transition-colors"
            >
              Issue renewal
            </button>
          )}
          {currentEng.status === "Proposal issued" && (
            <button
              onClick={handleSendReminder}
              className="px-4 py-2 border border-border text-[13px] font-semibold rounded hover:bg-muted transition-colors"
            >
              Send reminder
            </button>
          )}
          <div className="flex-1" />
          {currentEng.status !== "Terminated" && (
            <button
              onClick={handleTerminate}
              className="px-4 py-2 border border-[#D0021B] text-[#D0021B] text-[13px] font-semibold rounded hover:bg-[#FCE8EB] transition-colors"
            >
              Terminate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EngagementsScreen({
  fullPageEngagement,
  onOpenFull,
  onCloseFull,
}: {
  fullPageEngagement: EngagementRow | null;
  onOpenFull: (e: EngagementRow) => void;
  onCloseFull: () => void;
}) {
  const [search, setSearch] = useState("");
  const [showNewEngagement, setShowNewEngagement] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedEngagement, setSelectedEngagement] = useState<EngagementRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: page, loading, error, refetch } = useApiData(
    () => engagementsApi.list({ search: search || undefined }),
    [search]
  );
  const [localEngagements, setLocalEngagements] = useState<typeof ENGAGEMENTS_DATA>([]);

  if (fullPageEngagement) {
    return (
      <EngagementFullPage
        eng={fullPageEngagement}
        onBack={onCloseFull}
        onUpdate={() => {
          refetch();
        }}
      />
    );
  }
  const allEngagements = [...localEngagements, ...(page?.items ?? ENGAGEMENTS_DATA)];
  const filtered = allEngagements.filter(e => {
    const matchSearch = !search || e.client.toLowerCase().includes(search.toLowerCase()) || e.service.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayedEngagements = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExport = () => {
    exportToCsv("engagements.csv", filtered as unknown as Record<string, unknown>[]);
  };

  return (
    <>
      {showNewEngagement && (
        <NewEngagementModal
          onClose={() => setShowNewEngagement(false)}
          onCreated={eng => {
            setLocalEngagements(prev => [eng, ...prev]);
            refetch();
          }}
        />
      )}
      {selectedEngagement && (
        <EngagementDetailDrawer
          eng={selectedEngagement}
          onClose={() => setSelectedEngagement(null)}
          onOpenFull={() => { setSelectedEngagement(null); onOpenFull(selectedEngagement); }}
          onUpdate={() => { refetch(); }}
        />
      )}
    <PageShell
      title="Engagements"
      subtitle="Signed letters of engagement and active service terms"
      breadcrumb={["EnTIQ", "Start", "Engagements"]}
      actions={
        <div className="flex items-center gap-2">
          {["All", "Active", "Renewal due", "Proposal issued", "Terminated"].map(v => (
            <button
              key={v}
              onClick={() => { setStatusFilter(v); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-[12px] font-medium rounded border transition-colors ${statusFilter === v ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {v}
            </button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={() => setShowNewEngagement(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[12px] font-semibold rounded hover:bg-[#1F4491] transition-colors"
          >
            <Plus size={13} />
            New engagement
          </button>
        </div>
      }
    >
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active engagements", value: loading ? "—" : allEngagements.filter(e => e.status === "Active").length, color: "text-[#2EA843]" },
          { label: "Renewal due within 60d", value: allEngagements.filter(e => e.status === "Renewal due").length, color: "text-[#F5A623]" },
          { label: "Pending signature", value: allEngagements.filter(e => e.status === "Proposal issued").length, color: "text-[#2855A6]" },
          { label: "Annual fee (active)", value: "$26.1k", color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[11px] text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-[22px] font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search client or engagement…"
            className="pl-7 pr-3 py-1.5 text-[12px] bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] w-[240px] transition-all"
          />
        </div>
        <div className="flex-1" />
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
        >
          <Download size={12} />Export
        </button>
      </div>

      {error && <ApiErrorBanner message={error} onRetry={refetch} />}
      {loading ? <TableSkeleton rows={7} cols={9} /> : (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border bg-[#FAFAFA]">
              {["Engagement ID", "Client", "Service", "Annual fee", "Signed", "Renewal due", "Status", "Adviser", ""].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedEngagements.map((e, i) => (
              <tr key={e.id} onClick={() => setSelectedEngagement(e)} className={`border-b border-border last:border-0 hover:bg-[#F8FAFF] cursor-pointer transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}>
                <td className="px-4 py-3"><span className="font-mono text-[11px] text-[#2855A6]">{e.id}</span></td>
                <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate">{e.client}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate">{e.service}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{e.fee}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.signed || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.renewalDue || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${engStatusColor(e.status)}`}>{e.status}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{e.adviser}</td>
                <td className="px-4 py-3"><button onClick={ev => { ev.stopPropagation(); setSelectedEngagement(e); }} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><MoreHorizontal size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-[13px] text-muted-foreground">
            No engagements match your criteria.
          </div>
        )}

        <div className="px-4 py-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{filtered.length} engagement{filtered.length !== 1 ? "s" : ""} shown</span>
          <div className="flex items-center gap-3">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="hover:text-foreground disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 py-0.5 bg-[#EEF2FA] text-[#2855A6] rounded font-semibold">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="hover:text-foreground disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      )}
    </PageShell>
    </>
  );
}

// ─── Activity screen ──────────────────────────────────────────────────────────

const ACTIVITY_EVENTS = [
  { id: 1, time: "Today, 11:42 am", actor: "J. Okafor", action: "Accepted case", target: "C-2024-0885 · Greenbrook Unit Trust", type: "accept" },
  { id: 2, time: "Today, 10:15 am", actor: "System", action: "Identity verification completed", target: "C-2024-0891 · Harrington, Sophie — Biometric result received from Entiq KYC", type: "verify" },
  { id: 3, time: "Today, 9:03 am", actor: "S. Patel", action: "Sent invitation", target: "INV-2024-0112 · Nguyen, Thanh — Individual Tax", type: "invite" },
  { id: 4, time: "Yesterday, 4:51 pm", actor: "A. Brennan", action: "Issued proposal", target: "C-2024-0887 · Apex Ventures Pty Ltd — $4,950 pa", type: "proposal" },
  { id: 5, time: "Yesterday, 2:30 pm", actor: "A. Brennan", action: "Flagged pricing exception", target: "C-2024-0890 · Northfield Holdings — fee 18% below recommended", type: "exception" },
  { id: 6, time: "Yesterday, 11:08 am", actor: "Client", action: "Completed questionnaire", target: "C-2024-0886 · Caldwell SMSF — all sections submitted", type: "submit" },
  { id: 7, time: "28 Jul, 3:44 pm", actor: "J. Okafor", action: "Requested additional information", target: "C-2024-0889 · The Marcelline Family Trust — trust deed required", type: "request" },
  { id: 8, time: "28 Jul, 10:22 am", actor: "System", action: "Document rejected", target: "C-2024-0889 · Marcelline Trust — uploaded deed illegible, replacement needed", type: "reject" },
  { id: 9, time: "27 Jul, 2:10 pm", actor: "S. Patel", action: "Assigned case", target: "C-2024-0888 · Chen, David & Liu, Wei → S. Patel", type: "assign" },
  { id: 10, time: "26 Jul, 9:55 am", actor: "System", action: "Invitation opened", target: "INV-2024-0111 · Riverside Developments — link clicked, account creation started", type: "open" },
  { id: 11, time: "25 Jul, 4:00 pm", actor: "A. Brennan", action: "Rejected case", target: "C-2024-0883 · Blackwood & Associates — conflict of interest identified", type: "reject" },
  { id: 12, time: "24 Jul, 1:30 pm", actor: "Client", action: "Uploaded document", target: "C-2024-0886 · Caldwell SMSF — SMSF establishment deed uploaded", type: "upload" },
];

function activityDot(type: string) {
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

function ActivityScreen() {
  const [filter, setFilter] = useState("All");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const filters = ["All", "Cases", "Invitations", "Documents", "Identity", "Exceptions"];

  const { data: page, loading, error, refetch } = useApiData(
    () => activityApi.list({ filter }),
    [filter]
  );
  const rawEvents = page?.items ?? ACTIVITY_EVENTS;

  const events = rawEvents.filter(ev => {
    if (quickFilter === "Accepted this week") return ev.type === "accept";
    if (quickFilter === "Exceptions unresolved") return ev.type === "exception";
    if (quickFilter === "Proposals overdue") return ev.type === "proposal";
    if (quickFilter === "Identity failures") return ev.type === "reject" || ev.type === "verify";

    if (filter === "All") return true;
    if (filter === "Cases") return ["accept", "proposal", "submit", "reject", "assign"].includes(ev.type);
    if (filter === "Invitations") return ["invite", "open"].includes(ev.type);
    if (filter === "Documents") return ["upload", "verify", "reject"].includes(ev.type);
    if (filter === "Identity") return ["verify"].includes(ev.type);
    if (filter === "Exceptions") return ["exception"].includes(ev.type);
    return true;
  });

  const handleExport = () => {
    exportToCsv("activity_audit_log.csv", events as unknown as Record<string, unknown>[]);
  };

  return (
    <PageShell
      title="Activity"
      subtitle="Real-time event log across all cases and clients"
      breadcrumb={["EnTIQ", "Start", "Activity"]}
    >
      <div className="flex gap-4 items-start">
        {/* Main feed */}
        <div className="flex-1 space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setQuickFilter(null); }}
                className={`px-3 py-1.5 text-[12px] font-medium rounded border transition-colors ${filter === f && !quickFilter ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {f}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
            >
              <Download size={12} />Export audit log
            </button>
          </div>

          {error && <ApiErrorBanner message={error} onRetry={refetch} />}

          {/* Timeline */}
          {loading ? <TableSkeleton rows={8} cols={3} /> : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {events.map((ev, i) => (
              <div key={ev.id} className={`flex gap-4 px-5 py-4 ${i < events.length - 1 ? "border-b border-border" : ""} hover:bg-[#F8FAFF] transition-colors`}>
                <div className="flex flex-col items-center gap-1 pt-1">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${activityDot(ev.type)}`} />
                  {i < events.length - 1 && <div className="w-px flex-1 bg-border min-h-[20px]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold text-foreground">{ev.action}</span>
                    <span className="text-[11px] text-muted-foreground">by {ev.actor}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-snug">{ev.target}</p>
                </div>
                <div className="text-[11px] text-muted-foreground whitespace-nowrap pt-0.5">{ev.time}</div>
              </div>
            ))}

            {events.length === 0 && (
              <div className="py-12 text-center text-[13px] text-muted-foreground">
                No activity logs match your filter criteria.
              </div>
            )}
          </div>
          )}
        </div>

        {/* Right summary */}
        <div className="w-[240px] space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-[13px] font-semibold text-foreground mb-3">Today at a glance</h3>
            <div className="space-y-2">
              {[
                { label: "Events recorded", value: rawEvents.length },
                { label: "Cases updated", value: rawEvents.filter(e => e.type === "accept" || e.type === "submit").length },
                { label: "Documents received", value: rawEvents.filter(e => e.type === "upload").length },
                { label: "Exceptions raised", value: rawEvents.filter(e => e.type === "exception").length },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">{s.label}</span>
                  <span className="text-[13px] font-semibold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-[13px] font-semibold text-foreground mb-3">Quick filters</h3>
            <div className="space-y-1.5">
              {["Accepted this week", "Exceptions unresolved", "Proposals overdue", "Identity failures"].map(f => (
                <button
                  key={f}
                  onClick={() => setQuickFilter(f)}
                  className={`w-full text-left px-3 py-1.5 text-[12px] rounded transition-colors ${quickFilter === f ? "bg-[#EEF2FA] text-[#2855A6] font-semibold" : "text-[#2855A6] hover:bg-[#EEF2FA]"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Template Manager screen ──────────────────────────────────────────────────

const TEMPLATE_ROWS = [
  { id: "TPL-001", name: "Individual Tax Engagement", type: "Engagement", service: "Individual Tax", version: "v4", status: "Published", updated: "1 Jun 2026", author: "A. Brennan" },
  { id: "TPL-002", name: "Company Tax + BAS Engagement", type: "Engagement", service: "Company Tax", version: "v3", status: "Published", updated: "1 Jun 2026", author: "A. Brennan" },
  { id: "TPL-003", name: "Trust Tax Engagement", type: "Engagement", service: "Trust Tax", version: "v2", status: "Published", updated: "15 Mar 2026", author: "J. Okafor" },
  { id: "TPL-004", name: "SMSF Administration Engagement", type: "Engagement", service: "SMSF", version: "v2", status: "Published", updated: "10 Feb 2026", author: "J. Okafor" },
  { id: "TPL-005", name: "Individual Onboarding Questions", type: "Questionnaire", service: "All individual", version: "v7", status: "Published", updated: "20 Jul 2026", author: "S. Patel" },
  { id: "TPL-006", name: "Company Onboarding Questions", type: "Questionnaire", service: "Company", version: "v5", status: "Published", updated: "18 Jun 2026", author: "S. Patel" },
  { id: "TPL-007", name: "AML/CTF Risk Questions", type: "Questionnaire", service: "Designated services", version: "v3", status: "Draft", updated: "25 Jul 2026", author: "J. Okafor" },
  { id: "TPL-008", name: "Privacy Collection Notice", type: "Consent notice", service: "All", version: "v6", status: "Published", updated: "1 Apr 2026", author: "A. Brennan" },
  { id: "TPL-009", name: "Biometric Consent Notice", type: "Consent notice", service: "Identity verification", version: "v2", status: "Published", updated: "1 Apr 2026", author: "A. Brennan" },
  { id: "TPL-010", name: "Advisory Engagement", type: "Engagement", service: "Business Advisory", version: "v1", status: "Draft", updated: "28 Jul 2026", author: "J. Okafor" },
];

function tplStatusColor(s: string) {
  return s === "Published" ? "bg-[#E8F7EB] text-[#1E7A31]" : "bg-[#FEF6E9] text-[#B87A1A]";
}

const TEMPLATE_TYPES = ["Engagement", "Questionnaire", "Consent notice", "Service catalogue"];
const TEMPLATE_SERVICES = ["All", "Individual Tax", "Company Tax", "Trust Tax", "SMSF", "Business Advisory", "All individual", "Company", "Designated services", "Identity verification", "Partnership Tax"];

function NewTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: typeof TEMPLATE_ROWS[0], openBuilder: boolean) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [type, setType] = useState("Engagement");
  const [service, setService] = useState("All");
  const [status, setStatus] = useState<"Draft" | "Published">("Draft");
  const [docSource, setDocSource] = useState<"builder" | "upload">("builder");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFileInput(files: FileList | null) {
    if (!files?.length) return;
    setUploadedFile(files[0].name);
  }

  function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const now = new Date();
      const formatted = `${now.getDate()} ${now.toLocaleString("en-AU", { month: "short" })} ${now.getFullYear()}`;
      const newId = `TPL-${String(TEMPLATE_ROWS.length + 1).padStart(3, "0")}`;
      onCreated(
        { id: newId, name: name.trim(), type, service, version: "v1", status, updated: formatted, author: "J. Okafor" },
        docSource === "builder"
      );
      setSubmitting(false);
    }, 400);
  }

  const inputCls = "w-full px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all";
  const selectCls = inputCls + " appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-card border border-border rounded-xl shadow-xl w-[560px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-[15px] font-bold text-foreground">New template</h2>
              <span className="text-[11px] text-muted-foreground">— Step {step} of 2</span>
            </div>
            <p className="text-[12px] text-muted-foreground">{step === 1 ? "Name and classify your template" : "How would you like to create the document?"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"><X size={16} /></button>
        </div>

        {/* Step indicators */}
        <div className="flex px-6 pt-4 gap-2">
          {[1, 2].map(n => (
            <div key={n} className="flex-1 flex flex-col gap-1">
              <div className={`h-1 rounded-full transition-colors ${n <= step ? "bg-[#2855A6]" : "bg-[#E8E8E8]"}`} />
              <span className="text-[10px] text-muted-foreground">{n === 1 ? "Template details" : "Document source"}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* ── Step 1: details ── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1.5">Template name <span className="text-[#D0021B]">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Individual Tax Engagement Letter" autoFocus className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1.5">Template type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className={selectCls}>
                    {TEMPLATE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1.5">Applicable service</label>
                  <select value={service} onChange={e => setService(e.target.value)} className={selectCls}>
                    {TEMPLATE_SERVICES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-2">Initial status</label>
                <div className="flex gap-3">
                  {(["Draft", "Published"] as const).map(s => (
                    <label key={s} className={`flex items-center gap-2.5 flex-1 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${status === s ? "border-[#2855A6] bg-[#EEF2FA]/60" : "border-border hover:border-[#2855A6]/30"}`}>
                      <input type="radio" name="status" checked={status === s} onChange={() => setStatus(s)} className="accent-[#2855A6]" />
                      <div>
                        <div className="text-[13px] font-semibold text-foreground">{s}</div>
                        <div className="text-[11px] text-muted-foreground">{s === "Draft" ? "Not in active flows yet" : "Live in process flows"}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: document source ── */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "builder", label: "Build with Document Builder", desc: "Use our drag-and-drop builder with your branding, merge fields, fee tables and signature blocks.", badge: "Recommended" },
                  { id: "upload", label: "Upload existing document", desc: "Upload a PDF or Word document. We'll convert it and add e-signature fields.", badge: null },
                ] as const).map(opt => (
                  <label key={opt.id} className={`flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${docSource === opt.id ? "border-[#2855A6] bg-[#EEF2FA]/40" : "border-border hover:border-[#2855A6]/30"}`}>
                    <input type="radio" name="source" className="sr-only" checked={docSource === opt.id} onChange={() => setDocSource(opt.id)} />
                    <div className="flex items-start justify-between">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${docSource === opt.id ? "border-[#2855A6] bg-[#2855A6]" : "border-border"}`}>
                        {docSource === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {opt.badge && <span className="px-2 py-0.5 bg-[#20BCA4] text-white text-[10px] font-bold rounded-full">{opt.badge}</span>}
                    </div>
                    <div className="text-[13px] font-semibold text-foreground">{opt.label}</div>
                    <div className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</div>
                  </label>
                ))}
              </div>

              {docSource === "upload" && (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-colors cursor-pointer ${dragOver ? "border-[#2855A6] bg-[#EEF2FA]/30" : "border-border hover:border-[#2855A6]/40"} ${uploadedFile ? "border-[#2EA843] bg-[#E8F7EB]/20" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFileInput(e.dataTransfer.files); }}
                  onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".pdf,.doc,.docx"; i.onchange = (ev) => handleFileInput((ev.target as HTMLInputElement).files); i.click(); }}
                >
                  {uploadedFile ? (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-[#E8F7EB] flex items-center justify-center"><CheckCircle size={20} className="text-[#2EA843]" /></div>
                      <div className="text-center">
                        <div className="text-[13px] font-semibold text-foreground">{uploadedFile}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Click to replace</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-[#F0F0F0] flex items-center justify-center"><Upload size={20} className="text-muted-foreground" /></div>
                      <div className="text-center">
                        <div className="text-[13px] font-semibold text-foreground">Drop file here or click to browse</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Supports PDF, DOC, DOCX — max 25 MB</div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {docSource === "builder" && (
                <div className="p-4 rounded-xl bg-[#EEF2FA]/60 border border-[#2855A6]/15 space-y-2">
                  <div className="text-[12px] font-semibold text-[#2855A6]">What you can do in the Document Builder</div>
                  <ul className="space-y-1">
                    {["Upload your firm logo and set brand colours", "Add and edit text sections with merge fields (client name, fees, dates…)", "Auto-populate fee tables from your Services & Pricing settings", "Insert staff charge-out rate tables", "Add signature blocks for e-signing via DocuSign or EnTIQ eSign"].map(item => (
                      <li key={item} className="flex items-start gap-2 text-[11px] text-[#2855A6]/80">
                        <CheckCircle size={12} className="mt-0.5 shrink-0 text-[#20BCA4]" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button onClick={() => step === 1 ? onClose() : setStep(1)} className="px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step === 1 ? (
            <button disabled={!name.trim()} onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={submitting || (docSource === "upload" && !uploadedFile)}
              className="flex items-center gap-2 px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={14} />}
              {submitting ? "Creating…" : docSource === "builder" ? "Create & open builder" : "Create template"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplatesScreen() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [localNew, setLocalNew] = useState<typeof TEMPLATE_ROWS>([]);
  const [builderTemplate, setBuilderTemplate] = useState<{ name: string; type: string } | null>(null);

  if (builderTemplate) {
    return <DocumentBuilderScreen templateName={builderTemplate.name} templateType={builderTemplate.type} onBack={() => setBuilderTemplate(null)} />;
  }

  const { data: page, loading, error, refetch } = useApiData(
    () => templatesApi.list({ search: search || undefined, type: typeFilter || undefined }),
    [search, typeFilter]
  );
  const allTemplates = [...(page?.items ?? TEMPLATE_ROWS), ...localNew];

  const filtered = allTemplates.filter(t => {
    const ms = !search || t.name.toLowerCase().includes(search.toLowerCase());
    const mt = !typeFilter || t.type === typeFilter;
    return ms && mt;
  });

  return (
    <>
      {showNewModal && (
        <NewTemplateModal
          onClose={() => setShowNewModal(false)}
          onCreated={(t, openBuilder) => {
            setLocalNew(prev => [t, ...prev]);
            setShowNewModal(false);
            if (openBuilder) setBuilderTemplate({ name: t.name, type: t.type });
          }}
        />
      )}
    <PageShell
      title="Template Manager"
      subtitle="Manage engagement templates, questionnaires and consent notices"
      breadcrumb={["EnTIQ", "Start", "Settings", "Template Manager"]}
      actions={
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors">
          <Plus size={14} />New template
        </button>
      }
    >
      <div className="flex gap-5">
        {/* Left: type nav */}
        <div className="w-[200px] shrink-0">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Template type</span>
            </div>
            {["All templates", "Engagement", "Questionnaire", "Consent notice", "Service catalogue"].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t === "All templates" ? "" : t)}
                className={`w-full text-left px-4 py-2.5 text-[13px] border-b border-border last:border-0 transition-colors ${(t === "All templates" && !typeFilter) || typeFilter === t ? "bg-[#EEF2FA] text-[#2855A6] font-semibold" : "text-muted-foreground hover:bg-[#F5F5F5]"}`}
              >{t}</button>
            ))}
          </div>
        </div>

        {/* Right: template list */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…" className="pl-7 pr-3 py-1.5 text-[12px] bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] w-[220px] transition-all" />
            </div>
            <div className="flex-1" />
            <span className="text-[12px] text-muted-foreground">{loading ? "Loading…" : `${filtered.length} templates`}</span>
          </div>

          {error && <ApiErrorBanner message={error} onRetry={refetch} />}
          {loading ? <TableSkeleton rows={10} cols={9} /> : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border bg-[#FAFAFA]">
                  {["ID", "Name", "Type", "Service", "Version", "Status", "Last updated", "Author", ""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr
                    key={t.id}
                    onClick={() => setBuilderTemplate({ name: t.name, type: t.type })}
                    className={`border-b border-border last:border-0 hover:bg-[#F0F5FF] cursor-pointer transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}
                  >
                    <td className="px-4 py-3"><span className="font-mono text-[11px] text-[#2855A6]">{t.id}</span></td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{t.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.service}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{t.version}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${tplStatusColor(t.status)}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.updated}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.author}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setBuilderTemplate({ name: t.name, type: t.type })} className="p-1 rounded text-muted-foreground hover:text-[#2855A6] hover:bg-[#EEF2FA] transition-colors text-[11px] font-semibold px-2">Open</button>
                        <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><MoreHorizontal size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </PageShell>
    </>
  );
}


function AuthenticatedApp() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [fullEngagement, setFullEngagement] = useState<EngagementRow | null>(null);

  const screenMap: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    cases: <CasesScreen />,
    invitations: <InvitationsScreen />,
    clients: <ClientsScreen />,
    engagements: <EngagementsScreen fullPageEngagement={fullEngagement} onOpenFull={setFullEngagement} onCloseFull={() => setFullEngagement(null)} />,
    billing: <BillingScreen />,
    "process-builder": <ProcessBuilderScreen />,
    activity: <ActivityScreen />,
    templates: <TemplatesScreen />,
    services: <ServicesScreen />,
    integrations: <IntegrationsScreen />,
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {showModal && <NewInvitationModal onClose={() => setShowModal(false)} />}
      <Sidebar active={activeNav} setActive={(id) => { setActiveNav(id); if (id !== "engagements") setFullEngagement(null); }} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {screenMap[activeNav]}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

function AppShell() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#2855A6] flex items-center justify-center">
            <span className="text-white text-[14px] font-bold">EN</span>
          </div>
          <div className="w-5 h-5 border-2 border-[#2855A6]/30 border-t-[#2855A6] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedApp /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
