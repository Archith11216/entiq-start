import { useState, useRef, useCallback, useMemo, useEffect, useContext, createContext } from "react";
import IntegrationsScreen from "./IntegrationsScreen";
import ProcessBuilderScreen from "./ProcessBuilderScreen";
import ServicesScreen from "./ServicesScreen";
import { INITIAL_FEES, INITIAL_STAFF } from "./ServicesScreen";
import BillingScreen from "./BillingScreen";
import DocumentBuilderScreen from "./DocumentBuilderScreen";
import { auth as authApi, cases as casesApi, alerts as alertsApi, invitations as invitationsApi, clients as clientsApi, engagements as engagementsApi, activity as activityApi, templates as templatesApi, ApiError, exportToCsv } from "../lib/api";
import { AuthProvider, useAuth, FIRM_USERS } from "../contexts/AuthContext";
import type { OnboardingCase as ApiCase, ReviewAlert as ApiAlert, Invitation, ClientEntity, Engagement as ApiEngagement, ActivityEvent as ApiActivityEvent, Template as ApiTemplate } from "../types/api";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { Header } from "./components/Header";
import { NavigationContext, useNavigation, NavigationContextType } from "./NavigationContext";
import { EmailSettingsModal } from "./components/EmailSettingsModal";
import { ClientOnboardingPortal } from "./components/ClientOnboardingPortal";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Bell,
  Search,
  Key,
  Database,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Check,
  BarChart2,
  Plus,
  Filter,
  Download,
  Printer,
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
  GripVertical,
  Link,
  SquarePen,
  Trash,
  Package,
  IndentIncrease,
  Minus,
  Mail,
  ExternalLink,
  Loader2,
  Send,
  AlertCircle,
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
        <div key={i} className="bg-card border border-border rounded-lg px-3 py-2">
          <div className="h-2 w-16 rounded bg-[#F0F0F0] mb-1.5" />
          <div className="h-5 w-8 rounded bg-[#F0F0F0]" />
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
              className="w-full py-2.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F4491] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : "Sign in"}
            </button>
          </form>

          {/* 1-Click Practice Member Switcher on Login Screen */}
          <div className="mt-5 pt-4 border-t border-border">
            <div className="text-[11px] font-semibold text-foreground mb-2 flex items-center justify-between">
              <span>Quick Sign In As:</span>
              <span className="text-[10px] text-muted-foreground font-normal">Grow Advisory Group</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {FIRM_USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => login(u.email, "password123")}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-border bg-[#FBFBFB] hover:bg-[#EEF2FA] hover:border-[#2855A6]/40 transition-colors text-left group cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#2855A6]/10 group-hover:bg-[#2855A6] text-[#2855A6] group-hover:text-white flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors">
                    {u.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-foreground leading-none truncate group-hover:text-[#2855A6]">{u.displayName}</div>
                    <div className="text-[9.5px] text-muted-foreground truncate mt-0.5">{u.role}</div>
                  </div>
                </button>
              ))}
            </div>
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
    <div className="bg-card border border-border rounded-lg px-3 py-2 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground mb-0.5">{label}</span>
        <span className={`p-1 rounded ${accent ?? "bg-muted"} [&_svg]:size-3.5`}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[18px] font-bold text-foreground leading-tight">{value}</span>
        {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
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
  { label: "Onboarding Pipeline", icon: <Layers size={16} />, id: "cases" },
  { label: "Invitations & Intake", icon: <Inbox size={16} />, id: "invitations" },
  { label: "Clients & Entities", icon: <Building2 size={16} />, id: "clients" },
  { label: "Proposals & Engagements", icon: <FileText size={16} />, id: "engagements" },
  { label: "Workflow Builder", icon: <Workflow size={16} />, id: "process-builder" },
  { label: "Onboarding Activity", icon: <Activity size={16} />, id: "activity" },
];

const SETTINGS_ITEMS = [
  { label: "Proposal Templates", icon: <FileText size={16} />, id: "templates" },
  { label: "Services Catalogue", icon: <DollarSign size={16} />, id: "services" },
  { label: "Module Connectors", icon: <Settings size={16} />, id: "integrations" },
  { label: "API Keys & DB", icon: <Key size={16} />, id: "apikeys" },
];

function Sidebar({
  active,
  setActive,
  onOpenApiKeyModal,
}: {
  active: string;
  setActive: (id: string) => void;
  onOpenApiKeyModal?: () => void;
}) {
  const { user, logout, switchUser, availableUsers } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);

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
            onClick={() => {
              if (item.id === "apikeys") {
                onOpenApiKeyModal?.();
              } else {
                setActive(item.id);
              }
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-[13px] text-left transition-colors ${
              active === item.id
                ? "bg-[#EEF2FA] text-[#2855A6] font-semibold"
                : "text-[#6F6F6F] hover:bg-[#F5F5F5] hover:text-foreground"
            }`}
          >
            <span className={item.id === "apikeys" ? "text-[#2855A6]" : "text-[#9F9F9F]"}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User footer with switch user menu */}
      <div className="px-3 py-2.5 border-t border-border relative">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="flex-1 flex items-center gap-2 text-left p-1 -ml-1 rounded-lg hover:bg-[#F5F5F5] transition-colors group cursor-pointer"
            title="Click to switch user persona"
          >
            <div className="w-7 h-7 rounded-full bg-[#2855A6] flex items-center justify-center text-white text-[11px] font-semibold shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-semibold text-foreground leading-none truncate group-hover:text-[#2855A6] transition-colors">{displayName}</span>
                <ChevronsUpDown size={11} className="text-muted-foreground group-hover:text-[#2855A6] shrink-0 transition-colors" />
              </div>
              <div className="text-[10px] text-muted-foreground truncate mt-0.5">{role}</div>
            </div>
          </button>

          <button
            onClick={onOpenApiKeyModal}
            title="Manage API Keys & SQLite DB"
            className="p-1.5 rounded text-muted-foreground hover:text-[#2855A6] hover:bg-[#F5F5F5] transition-colors shrink-0"
          >
            <Key size={13} />
          </button>
          <button
            onClick={() => logout()}
            title="Sign out"
            className="p-1.5 rounded text-muted-foreground hover:text-[#D0021B] hover:bg-[#FCE8EB] transition-colors shrink-0"
          >
            <LogOut size={13} />
          </button>
        </div>

        {/* Switch User Popover */}
        {showUserMenu && (
          <div
            ref={userMenuRef}
            className="absolute left-2 bottom-14 w-[240px] bg-card border border-border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-left"
          >
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-border mb-1.5">
              <div>
                <div className="text-[11px] font-bold text-foreground">Switch User Persona</div>
                <div className="text-[9px] text-muted-foreground">Grow Advisory Group</div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 bg-[#EEF2FA] text-[#2855A6] rounded font-semibold">
                {availableUsers.length} staff
              </span>
            </div>
            <div className="max-h-[260px] overflow-y-auto space-y-0.5">
              {availableUsers.map((u) => {
                const isActive = u.id === user?.id || u.displayName === displayName;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u);
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#EEF2FA] text-[#2855A6] font-semibold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isActive ? "bg-[#2855A6] text-white shadow-sm" : "bg-[#EAEAEA] text-[#555]"
                      }`}
                    >
                      {u.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11.5px] font-medium leading-none truncate">{u.displayName}</div>
                      <div className="text-[9.5px] text-muted-foreground truncate mt-0.5">{u.role}</div>
                    </div>
                    {isActive && <Check size={13} className="text-[#2855A6] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
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

// ─── Edit Case Modal ─────────────────────────────────────────────────────────

function EditCaseModal({
  c,
  onClose,
  onSaved,
}: {
  c: OnboardingCase;
  onClose: () => void;
  onSaved: (updated: OnboardingCase) => void;
}) {
  const [client, setClient] = useState(c.client);
  const [entity, setEntity] = useState(c.entity);
  const [service, setService] = useState(c.service);
  const [status, setStatus] = useState<CaseStatus>(c.status);
  const [risk, setRisk] = useState<"Low" | "Medium" | "High">(c.risk);
  const [owner, setOwner] = useState(c.owner);
  const [due, setDue] = useState(c.due);
  const [progress, setProgress] = useState(c.progress);
  const [channel, setChannel] = useState(c.channel);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim()) {
      setError("Client name is required");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await casesApi.update(c.id, {
        client: client.trim(),
        entity,
        service: service.trim(),
        status,
        risk,
        owner,
        due: due.trim(),
        progress: Number(progress),
        channel,
      });
      activityApi.log({
        time: "Just now",
        actor: "J. Okafor",
        action: "Updated case details",
        target: `${c.id} · ${client.trim()}`,
        type: "assign",
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update case");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-[16px] font-bold text-foreground">Edit Onboarding Case</h2>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{c.id} · Created {c.created}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-[#FCE8EB] border border-[#F5C2C7] text-[#A80016] text-[12px]">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-foreground">Client / Account Name *</label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              required
              className="w-full px-3 py-2 text-[12px] bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              placeholder="e.g. Apex Holdings Pty Ltd"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-foreground">Entity Type</label>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="w-full px-3 py-2 text-[12px] bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              >
                {["Company", "Individual", "Trust", "SMSF", "Partnership", "Individual group"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-foreground">Service</label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2 text-[12px] bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
                placeholder="e.g. Company Tax + Advisory"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CaseStatus)}
                className="w-full px-3 py-2 text-[12px] bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-foreground">Risk Level</label>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value as "Low" | "Medium" | "High")}
                className="w-full px-3 py-2 text-[12px] bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              >
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-foreground">Assigned Owner</label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-2 text-[12px] bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              >
                {["J. Okafor", "A. Brennan", "S. Patel"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-foreground">Due Date</label>
              <input
                type="text"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="w-full px-3 py-2 text-[12px] bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
                placeholder="e.g. 18 Sept"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11.5px] font-semibold text-foreground">Progress ({progress}%)</label>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[#2855A6] cursor-pointer mt-1"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-foreground">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 text-[12px] bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              >
                {["Invitation", "QR code", "Referral", "Share My EnTIQ"].map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-[12px] font-medium border border-border rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-[12px] font-semibold bg-[#2855A6] text-white rounded hover:bg-[#1F4491] transition-colors disabled:opacity-40"
            >
              {isSubmitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Case Modal ───────────────────────────────────────────────────────

function DeleteCaseModal({
  c,
  onClose,
  onDeleted,
}: {
  c: OnboardingCase;
  onClose: () => void;
  onDeleted: (caseId: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await casesApi.delete(c.id);
      activityApi.log({
        time: "Just now",
        actor: "J. Okafor",
        action: "Deleted case",
        target: `${c.id} · ${c.client}`,
        type: "reject",
      });
      onDeleted(c.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete case");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-[420px] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-[#FCE8EB] text-[#D0021B] shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-bold text-foreground">Delete Onboarding Case</h3>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
              Are you sure you want to delete case <strong className="text-foreground">{c.id}</strong> ({c.client})?
              This will permanently remove the case and any associated review alerts.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-[#FCE8EB] border border-[#F5C2C7] text-[#A80016] text-[11px]">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 text-[12px] font-medium border border-border rounded hover:bg-muted text-muted-foreground transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3.5 py-1.5 text-[12px] font-semibold bg-[#D0021B] text-white rounded hover:bg-[#A80016] transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <Trash2 size={13} />
            {isDeleting ? "Deleting…" : "Delete Case"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cases Table ──────────────────────────────────────────────────────────────

function CasesTable({
  cases,
  onSelect,
  onRefresh,
}: {
  cases: OnboardingCase[];
  onSelect: (c: OnboardingCase) => void;
  onRefresh?: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<OnboardingCase | null>(null);
  const [deletingCase, setDeletingCase] = useState<OnboardingCase | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [activeMenuId]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(cases.length / pageSize));
  const displayedCases = cases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      {editingCase && (
        <EditCaseModal
          c={editingCase}
          onClose={() => setEditingCase(null)}
          onSaved={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
      {deletingCase && (
        <DeleteCaseModal
          c={deletingCase}
          onClose={() => setDeletingCase(null)}
          onDeleted={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px] min-w-[650px]">
            <thead>
              <tr className="border-b border-border bg-[#FAFAFA]">
                <th className="text-left px-2 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Case ID</th>
                <th className="text-left px-2 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Client</th>
                <th className="text-left px-2 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Entity</th>
                <th className="text-left px-2 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Service</th>
                <th className="text-left px-2 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-left px-2 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Progress</th>
                <th className="text-left px-2 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Risk</th>
                <th className="text-left px-2 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Owner</th>
                <th className="text-left px-2 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Due</th>
                <th className="w-8 px-1 py-1.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedCases.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={`border-b border-border last:border-0 hover:bg-[#F8FAFF] cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-[#FAFAFA]/50"}`}
                >
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className="font-mono text-[10.5px] font-semibold text-[#2855A6]">{c.id}</span>
                  </td>
                  <td className="px-2 py-1.5 font-medium text-foreground max-w-[130px] truncate" title={c.client}>{c.client}</td>
                  <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{c.entity}</td>
                  <td className="px-2 py-1.5 text-muted-foreground max-w-[120px] truncate text-[10.5px]" title={c.service}>{c.service}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap"><StatusBadge status={c.status} /></td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <div className="w-10 h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden shrink-0">
                        <div
                          style={{
                            width: `${c.progress}%`,
                            background: c.progress === 100 ? "#2EA843" : c.progress >= 70 ? "#2855A6" : c.progress >= 40 ? "#F5A623" : "#D1D1D1"
                          }}
                          className="h-full rounded-full transition-all"
                        />
                      </div>
                      <span className="text-[9.5px] text-muted-foreground w-6 text-right font-medium">{c.progress}%</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className={`text-[10.5px] font-semibold ${riskColor(c.risk)}`}>{c.risk}</span>
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{c.owner}</td>
                  <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{c.due}</td>
                  <td className="px-1 py-1.5 text-center relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === c.id ? null : c.id);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Actions: View, Edit, Delete"
                    >
                      <MoreHorizontal size={13} />
                    </button>
                    {activeMenuId === c.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-1 top-7 z-40 w-36 bg-card border border-border rounded-lg shadow-xl py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onSelect(c);
                          }}
                          className="w-full px-2.5 py-1.5 text-[11px] text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                        >
                          <Eye size={12} className="text-[#2855A6]" />
                          <span>View details</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            setEditingCase(c);
                          }}
                          className="w-full px-2.5 py-1.5 text-[11px] text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                        >
                          <Pencil size={12} className="text-foreground" />
                          <span>Edit case</span>
                        </button>
                        <div className="my-0.5 border-t border-border" />
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            setDeletingCase(c);
                          }}
                          className="w-full px-2.5 py-1.5 text-[11px] text-[#D0021B] hover:bg-[#FCE8EB] flex items-center gap-2 transition-colors"
                        >
                          <Trash2 size={12} className="text-[#D0021B]" />
                          <span>Delete case</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cases.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-[12px]">
            No cases match your current filters.
          </div>
        )}

        <div className="px-3 py-1.5 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{cases.length} case{cases.length !== 1 ? "s" : ""} shown</span>
          <div className="flex items-center gap-2.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="hover:text-foreground transition-colors disabled:opacity-40 font-medium"
            >
              Previous
            </button>
            <span className="px-1.5 py-0.5 bg-[#EEF2FA] text-[#2855A6] rounded font-semibold">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="hover:text-foreground transition-colors disabled:opacity-40 font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Review Alert Rail ────────────────────────────────────────────────────────

function ReviewAlertRail({
  alerts,
  onSelectCase,
  collapsed,
  onToggleCollapse,
}: {
  alerts: ReviewAlert[];
  onSelectCase?: (caseId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const critCount = alerts.filter((a) => a.severity === "error").length;

  if (collapsed) {
    return (
      <div
        onClick={onToggleCollapse}
        title="Click to expand Review Alerts"
        className="w-8 shrink-0 bg-card border border-border rounded-lg py-2 px-1 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/60 transition-colors shadow-2xs select-none"
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleCollapse && onToggleCollapse(); }}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Expand Review Alerts"
        >
          <ChevronLeft size={13} />
        </button>
        <div className="relative mt-1">
          <Bell size={13} className="text-[#D0021B]" />
          {critCount > 0 && (
            <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-[#D0021B] text-white text-[8px] font-bold leading-none">
              {critCount}
            </span>
          )}
        </div>
        <span className="text-[9px] font-semibold text-muted-foreground [writing-mode:vertical-rl] rotate-180 tracking-wider mt-2">
          Alerts ({alerts.length})
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 min-w-0">
          <h3 className="text-[11px] font-semibold text-foreground truncate">Review alerts</h3>
          <span className="px-1 py-0.2 rounded bg-[#FCE8EB] text-[#A80016] text-[9px] font-bold shrink-0">
            {critCount} crit
          </span>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Collapse alerts rail"
          >
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-0.5">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => onSelectCase && onSelectCase(alert.case)}
            className={`border border-border rounded-md p-1.5 border-l-[2.5px] ${alertBg(alert.severity)} cursor-pointer hover:shadow-2xs transition-shadow`}
          >
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="font-mono text-[9.5px] text-[#2855A6] font-semibold truncate">{alert.case}</span>
              <span className="text-muted-foreground text-[8px] shrink-0">{alert.age}</span>
            </div>
            <p className="text-[9.5px] text-foreground leading-snug line-clamp-2" title={alert.message}>
              {alert.message}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <span className={`text-[8px] uppercase font-bold tracking-tight ${alert.severity === "error" ? "text-[#D0021B]" : "text-[#D97706]"}`}>
                {alert.severity}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onSelectCase && onSelectCase(alert.case); }}
                className="text-[9px] text-[#2855A6] font-semibold hover:underline flex items-center gap-0.5"
              >
                <Eye size={9} /> Review
              </button>
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="py-4 text-center text-[10px] text-muted-foreground bg-card border border-border rounded-md">
            No active alerts
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Case Detail Drawer ───────────────────────────────────────────────────────

// ─── Case Detail Drawer ───────────────────────────────────────────────────────

const ONBOARDING_11_STAGES = [
  { step: 1, id: "invitation", label: "Invitation", desc: "Magic link invitation issued to prospect" },
  { step: 2, id: "entity_details", label: "Entity Details", desc: "ABN/ACN registry match, tax residency & contact profile" },
  { step: 3, id: "questionnaire", label: "Questionnaire", desc: "Onboarding intake questionnaire & scope discovery" },
  { step: 4, id: "document_requests", label: "Document Requests", desc: "Prior financials, trust deeds & ASIC extracts collected" },
  { step: 5, id: "related_parties", label: "Related Parties", desc: "Directors, trustees & beneficial owners (UBO) structure" },
  { step: 6, id: "service_selection", label: "Service Selection", desc: "Selected services & engagement package from catalogue" },
  { step: 7, id: "proposal", label: "Proposal", desc: "Fee proposal quote & commercial terms presentation" },
  { step: 8, id: "engagement_prep", label: "Engagement Preparation", desc: "Letter of engagement compiled & dispatched to eSign" },
  { step: 9, id: "external_checks", label: "External Module Checks", desc: "Verification gateway: KYC, Compliance, eSign & Mandate" },
  { step: 10, id: "acceptance", label: "Internal Acceptance", desc: "Partner review, margin check & formal risk sign-off" },
  { step: 11, id: "activated", label: "Client Activated", desc: "Downstream handover dispatched to EnTIQ Practice" },
];

const TABS = [
  "Overview",
  "11-Stage Lifecycle",
  "External Checks (Gateway)",
  "Parties & Structure",
  "Documents",
  "Proposal & Terms",
  "Internal Acceptance",
  "Activity",
];

const INFO_REQUEST_PRESETS = [
  {
    label: "Missing Photo ID",
    text: "Please provide a clear, color copy of your valid Australian Driver Licence or Passport to complete your biometric identity verification.",
  },
  {
    label: "Trust Deed / Schedule 1",
    text: "Please upload the complete executed Trust Deed including Schedule 1, along with any subsequent Deeds of Variation or Trustee Appointments.",
  },
  {
    label: "Proof of Residential Address",
    text: "Please provide a utility bill, rates notice, or bank statement dated within the last 3 months confirming your residential address.",
  },
  {
    label: "Signed Engagement Letter",
    text: "Your engagement letter is ready for review and signing. Please open the secure client portal link to review and sign your engagement.",
  },
  {
    label: "ASIC Extract / ABN",
    text: "Please provide your current ASIC Company Extract and confirm registered office address and ultimate beneficial owners (UBO).",
  },
];

// ─── Document Viewer Modal ───────────────────────────────────────────────────

function DocumentViewerModal({
  doc,
  clientName,
  entityName,
  onClose,
}: {
  doc: { name: string; verified: boolean; source: string; date: string };
  clientName: string;
  entityName: string;
  onClose: () => void;
}) {
  const isPassport = doc.name.toLowerCase().includes("passport") || doc.name.toLowerCase().includes("photo id");
  const isTrustDeed = doc.name.toLowerCase().includes("trust") || doc.name.toLowerCase().includes("constitution");
  const isAsic = doc.name.toLowerCase().includes("asic") || doc.name.toLowerCase().includes("extract");
  const isEngagementLetter = doc.name.toLowerCase().includes("engagement") || doc.name.toLowerCase().includes("proposal") || doc.name.toLowerCase().includes("fee") || doc.name.toLowerCase().includes("terms");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-card w-full max-w-[800px] max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-border bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FA] text-[#2855A6] flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-foreground leading-none">{doc.name}</h3>
                <span className="px-2 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31] text-[10.5px] font-semibold flex items-center gap-1">
                  <CheckCircle size={11} /> Verified Document
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Source: <strong>{doc.source}</strong> · Verified: {doc.date} · SHA-256 Validated
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 border border-border rounded text-[11px] font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>
            <button
              onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([`EnTIQ Start Verified Document\n\nTitle: ${doc.name}\nClient: ${clientName}\nEntity: ${entityName}\nSource: ${doc.source}\nStatus: Verified\nDate: ${doc.date}\nVerification Hash: SHA256-${Math.random().toString(36).substring(2, 15)}`], { type: "text/plain" });
                element.href = URL.createObjectURL(file);
                element.download = `${doc.name.replace(/\s+/g, "_")}_Verified.txt`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
              className="px-3 py-1.5 bg-[#2855A6] text-white rounded text-[11px] font-semibold hover:bg-[#1F4491] transition-colors flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document Content / Preview Viewport */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F3F4F6]">
          {isPassport ? (
            /* Passport / Identity Preview */
            <div className="bg-white border border-[#CBD5E1] rounded-xl shadow-lg p-6 max-w-[620px] mx-auto text-[#1E293B]">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#2855A6] text-white flex items-center justify-center font-bold text-[11px]">
                    AUS
                  </div>
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-wider text-[#2855A6]">Commonwealth of Australia</div>
                    <div className="text-[15px] font-black tracking-tight">PASSPORT / PASSEPORT</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Document No.</div>
                  <div className="font-mono text-[14px] font-bold text-[#D0021B]">N8921044</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                {/* Photo box */}
                <div className="col-span-1 bg-[#EEF2FA] border-2 border-dashed border-[#2855A6]/40 rounded-lg p-3 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-24 rounded bg-[#CBD5E1] flex items-center justify-center text-[28px] font-bold text-[#64748B] mb-2 shadow-inner">
                    {clientName.charAt(0) || "U"}
                  </div>
                  <span className="text-[10px] font-bold text-[#2855A6] bg-white px-2 py-0.5 rounded border border-[#2855A6]/20">
                    3D BIOMETRIC MATCH
                  </span>
                </div>

                {/* Passport Details */}
                <div className="col-span-2 space-y-2 text-[11.5px]">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9.5px] uppercase text-muted-foreground font-semibold">Type / Type</div>
                      <div className="font-bold">P</div>
                    </div>
                    <div>
                      <div className="text-[9.5px] uppercase text-muted-foreground font-semibold">Country Code</div>
                      <div className="font-bold">AUS</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9.5px] uppercase text-muted-foreground font-semibold">Surname / Nom</div>
                    <div className="font-bold text-[13px]">{clientName.split(" ").slice(-1)[0]?.toUpperCase() || "SHARMA"}</div>
                  </div>
                  <div>
                    <div className="text-[9.5px] uppercase text-muted-foreground font-semibold">Given Names / Prénoms</div>
                    <div className="font-bold">{clientName.split(" ").slice(0, -1).join(" ") || clientName}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9.5px] uppercase text-muted-foreground font-semibold">Nationality</div>
                      <div className="font-bold">AUSTRALIAN</div>
                    </div>
                    <div>
                      <div className="text-[9.5px] uppercase text-muted-foreground font-semibold">Date of Birth</div>
                      <div className="font-bold">14 MAY 1982</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9.5px] uppercase text-muted-foreground font-semibold">Sex</div>
                      <div className="font-bold">M</div>
                    </div>
                    <div>
                      <div className="text-[9.5px] uppercase text-muted-foreground font-semibold">Expiry Date</div>
                      <div className="font-bold text-[#1E7A31]">12 JUN 2031</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MRZ Machine Readable Zone */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded font-mono text-[11px] tracking-wider leading-relaxed text-[#334155] select-all">
                P&lt;AUS{clientName.replace(/\s+/g, "&lt;").toUpperCase()}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br />
                N8921044&lt;4AUS8205148M3106124&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;02
              </div>

              {/* Verification Stamp */}
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-[#1E7A31] font-semibold">
                  <CheckCircle size={14} /> NFC Chip Cryptographic Verification Passed
                </div>
                <div className="text-muted-foreground text-[10px]">
                  EnTIQ KYC Biometric Audit #KYC-9812-OK
                </div>
              </div>
            </div>
          ) : isTrustDeed ? (
            /* Trust Deed / Constitution Preview */
            <div className="bg-white border border-[#CBD5E1] rounded-xl shadow-lg p-8 max-w-[620px] mx-auto text-[#1E293B] font-serif leading-relaxed">
              <div className="text-center border-b pb-4 mb-6">
                <div className="text-[11px] font-sans font-bold uppercase tracking-widest text-[#2855A6]">Official Legal Instrument</div>
                <h2 className="text-[18px] font-bold text-[#0F172A] mt-1">DEED OF TRUST / CONSTITUTION</h2>
                <div className="text-[12px] font-sans text-muted-foreground mt-1">DATED THIS 20TH DAY OF JULY 2026</div>
              </div>

              <div className="space-y-4 text-[12px] font-sans">
                <div>
                  <strong className="block text-[#0F172A] font-semibold">PARTIES:</strong>
                  <p className="text-muted-foreground mt-0.5">
                    <strong>1. SETTLOR:</strong> James Alexander Harrison<br />
                    <strong>2. TRUSTEE:</strong> {entityName || "TechVentures Pty Ltd"}<br />
                    <strong>3. PRIMARY BENEFICIARY:</strong> {clientName}
                  </p>
                </div>

                <div className="border-t pt-3">
                  <strong className="block text-[#0F172A] font-semibold">RECITALS &amp; POWERS:</strong>
                  <p className="text-muted-foreground mt-0.5 text-justify leading-normal text-[11.5px]">
                    The Settlor has transferred to the Trustee the initial sum of $100.00 to be held upon the trusts and subject to the powers and provisions contained in this Deed. The Trustee hereby consents to act as trustee of the Trust Fund with full discretionary powers of distribution and investment.
                  </p>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded text-[11px]">
                  <strong className="text-[#2855A6] block mb-1">SCHEDULE 1 (KEY PARTICULARS):</strong>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Trust Name: <strong className="text-foreground">{entityName} Family Trust</strong></div>
                    <div>Vesting Date: <strong className="text-foreground">80th Anniversary</strong></div>
                    <div>Governing Law: <strong className="text-foreground">State of Victoria, Australia</strong></div>
                    <div>Stamp Duty: <strong className="text-foreground">Duly Stamped / Exempt</strong></div>
                  </div>
                </div>

                <div className="border-t pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-[#1E7A31] font-semibold font-sans">
                    <CheckCircle size={13} /> Original Deed &amp; Schedule Verified
                  </span>
                  <span>Page 1 of 12 (Certified Copy)</span>
                </div>
              </div>
            </div>
          ) : isAsic ? (
            /* ASIC Extract Preview */
            <div className="bg-white border border-[#CBD5E1] rounded-xl shadow-lg p-6 max-w-[620px] mx-auto text-[#1E293B]">
              <div className="border-b pb-3 mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#2855A6]">Australian Securities &amp; Investments Commission</div>
                  <h2 className="text-[16px] font-black text-[#0F172A] mt-0.5">CURRENT COMPANY EXTRACT</h2>
                </div>
                <div className="text-right font-mono text-[12px]">
                  <span className="text-muted-foreground text-[10px] block font-sans">Extracted:</span>
                  <strong>20/07/2026 14:22 AEST</strong>
                </div>
              </div>

              <div className="space-y-4 text-[12px]">
                <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                  <div>
                    <span className="text-[10.5px] text-muted-foreground block">Company Name:</span>
                    <strong className="text-[13px]">{entityName || "TECHVENTURES PTY LTD"}</strong>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-muted-foreground block">ACN:</span>
                    <strong className="font-mono text-[13px]">612 849 012</strong>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-muted-foreground block">Registration Date:</span>
                    <strong>15/03/2019</strong>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-muted-foreground block">Status:</span>
                    <span className="px-2 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31] font-bold text-[11px]">REGISTERED / ACTIVE</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Registered Office &amp; Principal Place</h4>
                  <div className="p-2.5 border rounded text-[11.5px] text-muted-foreground">
                    Level 4, 120 Collins Street, Melbourne VIC 3000 (Recorded 15/03/2019)
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Current Officeholders &amp; Directors</h4>
                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-[11px]">
                      <thead className="bg-[#F8FAFC] border-b text-muted-foreground">
                        <tr>
                          <th className="text-left p-2">Role</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Appointed</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Director</td>
                          <td className="p-2 font-bold text-foreground">{clientName}</td>
                          <td className="p-2 text-muted-foreground">15/03/2019</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">Secretary</td>
                          <td className="p-2 font-bold text-foreground">{clientName}</td>
                          <td className="p-2 text-muted-foreground">15/03/2019</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-[11px]">
                  <span className="text-[#1E7A31] font-semibold flex items-center gap-1">
                    <CheckCircle size={13} /> ASIC Government Register Match Verified
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">ASIC-REG-SYNC-2026</span>
                </div>
              </div>
            </div>
          ) : isEngagementLetter ? (
            /* Letter of Engagement / Fee Proposal Preview */
            <div className="bg-white border border-[#CBD5E1] rounded-xl shadow-lg p-8 max-w-[620px] mx-auto text-[#1E293B] font-sans leading-relaxed">
              <div className="flex items-center justify-between border-b pb-4 mb-5">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#2855A6]">EnTIQ Start Accounting &amp; Advisory</div>
                  <h2 className="text-[17px] font-black text-[#0F172A] mt-0.5">LETTER OF ENGAGEMENT</h2>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  <div>Ref: <strong className="font-mono text-foreground">LOE-2026-ENG</strong></div>
                  <div>Date: <strong>{doc.date || "20 Jul 2026"}</strong></div>
                </div>
              </div>

              <div className="space-y-4 text-[12px]">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded">
                  <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                    <div><span className="text-muted-foreground">Addressed To:</span> <strong className="text-foreground">{clientName}</strong></div>
                    <div><span className="text-muted-foreground">Target Entity:</span> <strong className="text-foreground">{entityName || "Client Entity Pty Ltd"}</strong></div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#0F172A] mb-1 text-[12.5px]">1. Scope of Professional Services</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-[11.5px]">
                    <li>Preparation and electronic lodgement of annual Company / Individual Income Tax Returns.</li>
                    <li>Preparation of Statutory Financial Statements in accordance with Australian Accounting Standards.</li>
                    <li>Quarterly Business Activity Statement (BAS) preparation and ATO lodgement.</li>
                    <li>General ongoing commercial tax compliance, corporate secretarial and advisory.</li>
                  </ul>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-bold text-[#0F172A] mb-1 text-[12.5px]">2. Agreed Professional Fee Structure</h4>
                  <div className="p-3 bg-[#EEF2FA] rounded-lg border border-[#2855A6]/20 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#2855A6]">Annual Recurring Retainer</div>
                      <div className="text-[11px] text-muted-foreground">Billed monthly in advance via direct debit mandate ($412.50 / mo)</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[16px] font-black text-[#2855A6]">$4,950.00</div>
                      <div className="text-[10px] text-muted-foreground">per annum (incl. GST)</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-bold text-[#0F172A] mb-2 text-[12.5px]">3. Digital Execution &amp; eSignature Audit</h4>
                  <div className="border rounded-lg p-3 bg-[#F0FDF4] border-[#86EFAC] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#1E7A31] font-bold flex items-center gap-1.5">
                        <CheckCircle size={14} /> Digitally Signed via EnTIQ Documents &amp; eSign
                      </span>
                      <span className="text-[#1E7A31] font-mono text-[10.5px]">CERT-eSIGN-2026</span>
                    </div>
                    <div className="text-[10.5px] text-muted-foreground font-mono">
                      Signatory: {clientName} &bull; Hash: SHA256-e8f92a104bce7193 &bull; Timestamp: {doc.date}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Generic Document Viewer */
            <div className="bg-white border border-[#CBD5E1] rounded-xl shadow-lg p-8 max-w-[620px] mx-auto text-[#1E293B]">
              <div className="border-b pb-4 mb-6 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#2855A6]">Verified Case Attachment</div>
                  <h2 className="text-[16px] font-bold text-[#0F172A] mt-0.5">{doc.name}</h2>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#E8F7EB] text-[#1E7A31] text-[11px] font-bold">
                  Verified
                </span>
              </div>
              <div className="space-y-4 text-[12px] text-muted-foreground leading-relaxed">
                <p>This document was securely uploaded and verified during the onboarding intake lifecycle for <strong>{clientName}</strong> ({entityName}).</p>
                <div className="bg-[#F8FAFC] border p-4 rounded-lg space-y-2 text-[11.5px]">
                  <div><strong>File Name:</strong> {doc.name}</div>
                  <div><strong>Upload Source:</strong> {doc.source}</div>
                  <div><strong>Verification Timestamp:</strong> {doc.date}</div>
                  <div><strong>Integrity Checksum:</strong> <span className="font-mono text-[10.5px]">SHA256-d8f92a104bce7193...</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground text-[11px]">
            Viewing 1 of 1 verified document files
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-muted text-foreground rounded text-[11.5px] font-semibold hover:bg-muted/80 transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}

function CaseDetailDrawer({
  c,
  onClose,
  onUpdateCase,
  onDeleteCase,
}: {
  c: OnboardingCase;
  onClose: () => void;
  onUpdateCase?: (updated: OnboardingCase) => void;
  onDeleteCase?: (caseId: string) => void;
}) {
  const [tab, setTab] = useState("Overview");
  const [drawerWidthMode, setDrawerWidthMode] = useState<"compact" | "wide" | "expanded">("wide");
  const [currentCase, setCurrentCase] = useState<OnboardingCase>(c);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showInfoRequestModal, setShowInfoRequestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ name: string; verified: boolean; source: string; date: string } | null>(null);
  const [infoRequestEmail, setInfoRequestEmail] = useState("");
  const [infoRequestSubject, setInfoRequestSubject] = useState("");
  const [infoRequestText, setInfoRequestText] = useState("");
  const [isSendingInfoRequest, setIsSendingInfoRequest] = useState(false);
  const [infoRequestValidationErr, setInfoRequestValidationErr] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showPracticeHandoverBanner, setShowPracticeHandoverBanner] = useState(c.status === "Accepted");

  const [checklist, setChecklist] = useState({
    identity: true,
    aml: true,
    conflicts: true,
    margin: true,
  });

  const [uploadedDocs, setUploadedDocs] = useState([
    { name: "Primary Photo ID (Passport)", verified: true, source: "EnTIQ KYC Biometric", date: "22 Jul 2026" },
    { name: "Trust Deed / Constitution", verified: true, source: "Client Upload", date: "20 Jul 2026" },
    { name: "ASIC Company Extract", verified: true, source: "ASIC Register Sync", date: "20 Jul 2026" },
  ]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleStatusChange = (status: OnboardingCase["status"]) => {
    const isAccepted = status === "Accepted";
    const updated = { ...currentCase, status, progress: isAccepted ? 100 : currentCase.progress };
    setCurrentCase(updated);
    if (isAccepted) {
      setShowPracticeHandoverBanner(true);
    }
    casesApi.updateStatus(updated.id, status);
    activityApi.log({
      time: "Just now",
      actor: "J. Okafor",
      action: isAccepted ? "Accepted case & dispatched Practice Handover" : status === "Rejected" ? "Rejected case" : "Updated case status",
      target: `${updated.id} · ${updated.client}`,
      type: isAccepted ? "accept" : status === "Rejected" ? "reject" : "accept",
    });
    if (onUpdateCase) onUpdateCase(updated);
    showToast(isAccepted ? "Case Accepted! Client Activated in EnTIQ Practice" : `Case marked as ${status}`);
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

  const handleOpenInfoRequest = () => {
    const candidateEmail = currentCase.client.includes("@") ? currentCase.client.trim() : "";
    if (!infoRequestEmail && candidateEmail) {
      setInfoRequestEmail(candidateEmail);
    }
    setInfoRequestSubject(`Information Request — Case ${currentCase.id} (${currentCase.service})`);
    setInfoRequestValidationErr(null);
    setShowInfoRequestModal(true);
  };

  const handleApplyPreset = (presetText: string) => {
    setInfoRequestText((prev) => {
      if (!prev.trim()) return presetText;
      return `${prev}\n\n${presetText}`;
    });
    setInfoRequestValidationErr(null);
  };

  const handleSendInfoRequest = async () => {
    const emailToUse = infoRequestEmail.trim() || (currentCase.client.includes("@") ? currentCase.client.trim() : "");
    if (!emailToUse || !emailToUse.includes("@")) {
      setInfoRequestValidationErr("Please enter a valid recipient email address.");
      return;
    }
    if (!infoRequestText.trim()) {
      setInfoRequestValidationErr("Please enter details of the requested information or pick a preset template above.");
      return;
    }

    setIsSendingInfoRequest(true);
    setInfoRequestValidationErr(null);

    try {
      const resp = await casesApi.requestInfo(currentCase.id, {
        recipientEmail: emailToUse,
        message: infoRequestText.trim(),
        subject: infoRequestSubject.trim() || undefined,
      });

      activityApi.log({
        time: "Just now",
        actor: currentCase.owner || "J. Okafor",
        action: "Requested additional information",
        target: `${currentCase.id} · ${emailToUse} — ${infoRequestText.trim().slice(0, 60)}...`,
        type: "request",
      });

      setShowInfoRequestModal(false);
      setInfoRequestText("");

      if (resp.simulated) {
        showToast(`Request saved for ${emailToUse} (SMTP simulated/not configured)`);
      } else {
        showToast(`Information request email sent to ${emailToUse}`);
      }
    } catch (err: any) {
      setInfoRequestValidationErr(err?.message || "Failed to dispatch request. Please check email settings.");
    } finally {
      setIsSendingInfoRequest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/15 backdrop-blur-[0.5px]" onClick={onClose} />
      <div className={`${drawerWidthMode === "compact" ? "w-[480px] max-w-[90vw]" : drawerWidthMode === "wide" ? "w-[720px] max-w-[95vw]" : "w-[95vw] max-w-[1200px]"} bg-card h-full flex flex-col shadow-2xl overflow-hidden transition-all duration-200`}>
        {/* Drawer header */}
        <div className="px-4.5 pt-3.5 pb-0 border-b border-border">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="font-mono text-[11px] text-[#2855A6] bg-[#EEF2FA] px-1.5 py-0.5 rounded font-semibold">{currentCase.id}</span>
                <StatusBadge status={currentCase.status} />
                <span className={`text-[10.5px] font-semibold ${riskColor(currentCase.risk)}`}>
                  {currentCase.risk} risk
                </span>
                <span className="text-[10.5px] text-muted-foreground ml-1">Owner: <strong>{currentCase.owner}</strong></span>
              </div>
              <h2 className="text-[16px] font-bold text-foreground leading-tight">{currentCase.client}</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">{currentCase.entity} · {currentCase.service}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowEditModal(true)}
                title="Edit case details"
                className="flex items-center gap-1 px-2 py-0.8 text-[10.5px] font-medium border border-border rounded hover:bg-muted transition-colors text-foreground"
              >
                <Pencil size={11} />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                title="Delete this case"
                className="flex items-center gap-1 px-2 py-0.8 text-[10.5px] font-medium border border-[#FCE8EB] bg-[#FFF5F5] rounded hover:bg-[#FCE8EB] transition-colors text-[#D0021B]"
              >
                <Trash2 size={11} />
                <span>Delete</span>
              </button>
              <button
                onClick={() => setDrawerWidthMode((w) => (w === "wide" ? "compact" : w === "compact" ? "expanded" : "wide"))}
                title={drawerWidthMode === "wide" ? "Switch to Compact (480px)" : drawerWidthMode === "compact" ? "Switch to Full-screen width (95vw)" : "Switch to Standard Wide (720px)"}
                className="flex items-center gap-1 px-2 py-0.8 text-[10.5px] font-medium border border-border rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                <Maximize2 size={11} />
                <span className="capitalize">{drawerWidthMode}</span>
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                <XCircle size={16} />
              </button>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className="mb-2.5 px-3 py-1.5 bg-[#E8F7EB] border border-[#2EA843]/30 rounded text-[11px] font-semibold text-[#1E7A31] flex items-center gap-2">
              <CheckCircle size={13} />
              {feedback}
            </div>
          )}

          {/* Progress */}
          <div className="mb-2.5">
            <div className="flex items-center justify-between mb-1 text-[10.5px]">
              <span className="text-muted-foreground">Onboarding Lifecycle Progress (11 Stages)</span>
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
                className={`px-3 py-1.5 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
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
        <div className="flex-1 overflow-y-auto px-4.5 py-4">
          {tab === "Overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Channel", currentCase.channel],
                  ["Responsible owner", currentCase.owner],
                  ["Created date", currentCase.created.includes("202") ? currentCase.created : currentCase.created.includes(" ") ? `${currentCase.created} 2026` : `${currentCase.created}`],
                  ["Due date", currentCase.due.includes("202") ? currentCase.due : currentCase.due.includes(" ") ? `${currentCase.due} 2026` : `${currentCase.due}`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[#F5F5F5] rounded-lg p-3">
                    <div className="text-[11px] text-muted-foreground mb-0.5">{k}</div>
                    <div className="text-[13px] font-medium text-foreground">{v}</div>
                  </div>
                ))}
              </div>

              {/* 11-Stage summary tracker */}
              <div className="border border-border rounded-lg p-3.5 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-foreground">11-Stage Onboarding Lifecycle</h3>
                  <button onClick={() => setTab("11-Stage Lifecycle")} className="text-[11px] text-[#2855A6] font-semibold hover:underline">View all 11 stages →</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                  <div className="p-2 rounded bg-[#EEF2FA]/50 border border-[#2855A6]/20">
                    <span className="text-muted-foreground">Current Stage:</span>
                    <div className="font-semibold text-[#2855A6]">
                      {currentCase.progress >= 100 ? "Stage 11: Client Activated" : currentCase.progress >= 85 ? "Stage 10: Internal Acceptance" : currentCase.progress >= 70 ? "Stage 9: External Module Checks" : currentCase.progress >= 60 ? "Stage 7: Proposal" : "Stage 2: Entity Intake"}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-[#F5F5F5] border border-border">
                    <span className="text-muted-foreground">Gateway Status:</span>
                    <div className="font-semibold text-foreground">
                      {currentCase.status === "Accepted" ? "4/4 Checks Cleared" : "Checks in progress"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "11-Stage Lifecycle" && (
            <div className="space-y-4">
              <div className="bg-[#EEF2FA] border border-[#2855A6]/20 rounded-lg p-3 text-[12px] text-[#1C2D4F]">
                <strong>EnTIQ Start Boundary:</strong> Start orchestrates all 11 stages from lead invitation to client activation, delegating verification and billing execution to companion modules.
              </div>
              <div className="space-y-2">
                {ONBOARDING_11_STAGES.map((s) => {
                  const stageThreshold = (s.step / 11) * 100;
                  const isDone = currentCase.progress >= stageThreshold || (currentCase.status === "Accepted");
                  const isCurrent = !isDone && (currentCase.progress >= ((s.step - 1) / 11) * 100);
                  return (
                    <div
                      key={s.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        isDone
                          ? "bg-[#F8FCF8] border-[#2EA843]/30"
                          : isCurrent
                          ? "bg-[#EEF2FA] border-[#2855A6]"
                          : "bg-card border-border opacity-70"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                          isDone
                            ? "bg-[#2EA843] text-white"
                            : isCurrent
                            ? "bg-[#2855A6] text-white"
                            : "bg-[#E0E0E0] text-muted-foreground"
                        }`}
                      >
                        {isDone ? <Check size={13} /> : s.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[12.5px] font-semibold text-foreground">Stage {s.step}: {s.label}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isDone
                                ? "bg-[#E8F7EB] text-[#1E7A31]"
                                : isCurrent
                                ? "bg-[#2855A6] text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isDone ? "Completed" : isCurrent ? "Active Stage" : "Pending"}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-muted-foreground mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "External Checks (Gateway)" && (
            <div className="space-y-4">
              <div className="bg-[#FAFAFA] border border-border rounded-lg p-3 text-[12px] text-muted-foreground">
                <strong className="text-foreground">Stage 9 External Module Verification Gateway:</strong> Aggregates external validation signals from EnTIQ companion modules prior to internal partner acceptance.
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {/* 1. KYC Card */}
                <div className="border border-border rounded-lg p-4 bg-card hover:border-[#2855A6]/40 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-[#EEF2FA] text-[#2855A6] flex items-center justify-center">
                        <UserCheck size={15} />
                      </div>
                      <div>
                        <div className="text-[12.5px] font-bold text-foreground">1. Identity Verification (KYC)</div>
                        <div className="text-[10.5px] text-muted-foreground">Source: EnTIQ KYC / Didit Engine</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31] text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle size={12} /> Complete
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11.5px] bg-[#F9F9F9] p-2.5 rounded mt-2">
                    <div><span className="text-muted-foreground">Method:</span> <strong>Passport NFC &amp; 3D Biometric</strong></div>
                    <div><span className="text-muted-foreground">Verified At:</span> <span>22 Jul 2026, 10:15 am</span></div>
                    <div><span className="text-muted-foreground">Subject:</span> <span>{currentCase.client}</span></div>
                    <div><span className="text-muted-foreground">Reference:</span> <span className="font-mono text-[10.5px]">KYC-2026-9812</span></div>
                  </div>
                </div>

                {/* 2. Compliance / AML Card */}
                <div className="border border-border rounded-lg p-4 bg-card hover:border-[#2855A6]/40 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-[#EEF2FA] text-[#2855A6] flex items-center justify-center">
                        <Shield size={15} />
                      </div>
                      <div>
                        <div className="text-[12.5px] font-bold text-foreground">2. AML / PEP &amp; Sanctions Screening</div>
                        <div className="text-[10.5px] text-muted-foreground">Source: EnTIQ Compliance &amp; AML Engine</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31] text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle size={12} /> Cleared
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11.5px] bg-[#F9F9F9] p-2.5 rounded mt-2">
                    <div><span className="text-muted-foreground">PEP Screening:</span> <strong className="text-[#1E7A31]">0 Matches (Clear)</strong></div>
                    <div><span className="text-muted-foreground">Sanctions:</span> <strong className="text-[#1E7A31]">0 Matches (Clear)</strong></div>
                    <div><span className="text-muted-foreground">Risk Rating:</span> <span className="font-semibold text-[#1E7A31]">Low Risk (Score 18/100)</span></div>
                    <div><span className="text-muted-foreground">Screened:</span> <span>22 Jul 2026</span></div>
                  </div>
                </div>

                {/* 3. eSign Envelope Card */}
                <div className="border border-border rounded-lg p-4 bg-card hover:border-[#2855A6]/40 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-[#EEF2FA] text-[#2855A6] flex items-center justify-center">
                        <FileCheck size={15} />
                      </div>
                      <div>
                        <div className="text-[12.5px] font-bold text-foreground">3. Electronic Signature (eSign)</div>
                        <div className="text-[10.5px] text-muted-foreground">Source: EnTIQ Documents &amp; eSign Module</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31] text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle size={12} /> Executed &amp; Sealed
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11.5px] bg-[#F9F9F9] p-2.5 rounded mt-2">
                    <div><span className="text-muted-foreground">Document:</span> <span className="truncate block font-medium">Letter of Engagement (Standard).pdf</span></div>
                    <div><span className="text-muted-foreground">Signed Timestamp:</span> <span>23 Jul 2026, 04:30 pm</span></div>
                    <div><span className="text-muted-foreground">Certificate:</span> <span className="font-mono text-[10.5px]">CERT-ESIGN-884920</span></div>
                    <div><span className="text-muted-foreground">Integrity:</span> <span className="text-[#1E7A31] font-semibold">SHA-256 Validated</span></div>
                  </div>
                </div>

                {/* 4. Billing Mandate Card */}
                <div className="border border-border rounded-lg p-4 bg-card hover:border-[#2855A6]/40 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-[#EEF2FA] text-[#2855A6] flex items-center justify-center">
                        <CreditCard size={15} />
                      </div>
                      <div>
                        <div className="text-[12.5px] font-bold text-foreground">4. Billing &amp; Payment Mandate</div>
                        <div className="text-[10.5px] text-muted-foreground">Source: EnTIQ Billing &amp; Payments Mandate Instruction</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31] text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle size={12} /> Mandate Authorised
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11.5px] bg-[#F9F9F9] p-2.5 rounded mt-2">
                    <div><span className="text-muted-foreground">Mandate Type:</span> <strong>Direct Debit Mandate</strong></div>
                    <div><span className="text-muted-foreground">Frequency:</span> <span>Monthly in advance</span></div>
                    <div><span className="text-muted-foreground">Quoted Fee:</span> <span className="font-semibold">$4,950.00 pa</span></div>
                    <div><span className="text-muted-foreground">First Cycle:</span> <span>1 Aug 2026</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "Parties & Structure" && (
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
                  <div
                    key={i}
                    onClick={() => setViewingDoc(doc)}
                    className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#EEF2FA] group-hover:bg-[#2855A6]/10 flex items-center justify-center text-[#2855A6] transition-colors">
                        <FileText size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-foreground group-hover:text-[#2855A6] transition-colors flex items-center gap-1.5">
                          {doc.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{doc.source} · {doc.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#1E7A31] bg-[#E8F7EB] px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle size={11} /> Verified
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingDoc(doc);
                        }}
                        className="px-2.5 py-1 bg-[#EEF2FA] text-[#2855A6] text-[11.5px] font-semibold rounded hover:bg-[#2855A6]/20 transition-colors flex items-center gap-1 shadow-2xs"
                        title="View Document Preview"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const element = document.createElement("a");
                          const file = new Blob([`EnTIQ Start Verified Document\n\nTitle: ${doc.name}\nClient: ${currentCase.client}\nEntity: ${currentCase.entity}\nSource: ${doc.source}\nStatus: Verified\nDate: ${doc.date}\nVerification Hash: SHA256-${Math.random().toString(36).substring(2, 15)}`], { type: "text/plain" });
                          element.href = URL.createObjectURL(file);
                          element.download = `${doc.name.replace(/\s+/g, "_")}_Verified.txt`;
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                          showToast(`Downloaded ${doc.name}`);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
                        title="Download Document"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Proposal & Terms" && (
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
                <div className="font-semibold text-foreground">Billing Instruction Mandate</div>
                <div className="text-muted-foreground">Direct debit payment authority recorded. Monthly billing cycle ($412.50 / mo incl. GST).</div>
              </div>
            </div>
          )}

          {tab === "Internal Acceptance" && (
            <div className="space-y-4">
              {showPracticeHandoverBanner && (
                <div className="bg-[#E8F7EB] border border-[#2EA843]/30 rounded-lg p-4 text-[12px] text-[#1E7A31] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[13px]">
                    <CheckCircle size={16} /> Downstream Practice Handover Completed (Stage 11)
                  </div>
                  <p className="text-muted-foreground">Client record, contact profile, and approved service scope have been dispatched and provisioned in <strong>EnTIQ Practice</strong>.</p>
                  <div className="grid grid-cols-2 gap-2 bg-white/70 p-2.5 rounded border border-[#2EA843]/20 font-mono text-[11px]">
                    <div>Client ID: <strong>{currentCase.id}</strong></div>
                    <div>Entity: <strong>{currentCase.entity}</strong></div>
                    <div>Status: <strong>Active Practice Client</strong></div>
                    <div>Ledger Synced: <strong>Yes</strong></div>
                  </div>
                </div>
              )}

              <div className="border border-border rounded-lg p-4 space-y-3">
                <h4 className="text-[13px] font-semibold text-foreground">Stage 10: Partner Risk &amp; Compliance Sign-off</h4>
                <p className="text-[12px] text-muted-foreground">Confirm all 4 external module checks are satisfied prior to formal client activation.</p>

                <div className="space-y-2.5 pt-2">
                  {[
                    { key: "identity", label: "Client identity verified via EnTIQ KYC" },
                    { key: "aml", label: "AML/CTF and Sanctions screening cleared via EnTIQ Compliance" },
                    { key: "conflicts", label: "Conflict of interest search completed against firm register" },
                    { key: "margin", label: "Agreed fee conforms to practice margin and pricing catalogue" },
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
                  <CheckCircle size={15} /> Approve &amp; Activate Client (Stage 11)
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
                { time: "22 Jul, 10:15 am", actor: "System", action: "Identity verification completed via EnTIQ KYC" },
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
        <div className="border-t border-border px-4 py-2.5 flex items-center gap-2">
          <button
            onClick={() => setDrawerWidthMode((prev) => (prev === "wide" ? "compact" : "wide"))}
            className="px-2.5 py-1.5 bg-[#EEF2FA] text-[#2855A6] text-[11.5px] font-semibold rounded hover:bg-[#2855A6]/15 border border-[#2855A6]/20 transition-colors"
          >
            {drawerWidthMode === "wide" ? "Compact view" : "Wider view"}
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-2.5 py-1.5 border border-border text-[11.5px] font-semibold rounded hover:bg-muted transition-colors"
          >
            Assign
          </button>
          <button
            onClick={handleOpenInfoRequest}
            className="px-2.5 py-1.5 border border-border text-[11.5px] font-semibold rounded hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Mail size={13} className="text-[#2855A6]" />
            <span>Request info</span>
          </button>
          <div className="flex-1" />
          {currentCase.status !== "Accepted" && (
            <button
              onClick={() => handleStatusChange("Accepted")}
              className="px-3 py-1.5 bg-[#1E7A31] text-white text-[11.5px] font-semibold rounded hover:bg-[#186227] transition-colors"
            >
              Accept
            </button>
          )}
          {currentCase.status !== "Rejected" && (
            <button
              onClick={() => handleStatusChange("Rejected")}
              className="px-3 py-1.5 border border-[#D0021B] text-[#D0021B] text-[11.5px] font-semibold rounded hover:bg-[#FCE8EB] transition-colors"
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
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-card w-full max-w-[460px] rounded-xl p-4.5 shadow-2xl border border-border space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EEF2FA] text-[#2855A6] flex items-center justify-center shrink-0">
                  <Mail size={15} />
                </div>
                <div>
                  <h3 className="text-[14.5px] font-semibold text-foreground leading-tight">Request Information from Client</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Case <span className="font-mono text-[#2855A6] font-semibold">{currentCase.id}</span> &bull; {currentCase.client}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInfoRequestModal(false);
                  setInfoRequestValidationErr(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Recipient Email Field */}
            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-foreground flex items-center justify-between">
                <span>Recipient Email Address <span className="text-[#D0021B]">*</span></span>
                <span className="text-[10px] font-normal text-muted-foreground">Will receive formal email</span>
              </label>
              <div className="relative">
                <Mail size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={infoRequestEmail}
                  onChange={(e) => {
                    setInfoRequestEmail(e.target.value);
                    if (infoRequestValidationErr) setInfoRequestValidationErr(null);
                  }}
                  placeholder="e.g. client@example.com"
                  className="w-full pl-8 pr-2.5 py-1.5 text-[12px] bg-[#F5F5F5] border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] text-foreground"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Template Presets (Click to insert)
              </label>
              <div className="flex flex-wrap gap-1">
                {INFO_REQUEST_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset.text)}
                    className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#EEF2FA] text-[#2855A6] hover:bg-[#DCE6F7] border border-[#2855A6]/20 transition-colors flex items-center gap-0.5"
                  >
                    <span>+</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions Textarea */}
            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-foreground flex items-center justify-between">
                <span>Requested Information or Documents <span className="text-[#D0021B]">*</span></span>
                <span className="text-[10px] font-normal text-muted-foreground">{infoRequestText.length} chars</span>
              </label>
              <textarea
                value={infoRequestText}
                onChange={(e) => {
                  setInfoRequestText(e.target.value);
                  if (infoRequestValidationErr) setInfoRequestValidationErr(null);
                }}
                placeholder="Detail the specific documentation, schedules, or clarifications required from the client..."
                rows={3}
                className="w-full p-2.5 text-[12px] bg-[#F5F5F5] border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] resize-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Validation error display */}
            {infoRequestValidationErr && (
              <div className="p-2.5 bg-[#FFF5F5] border border-[#D0021B]/30 rounded-lg flex items-center gap-2 text-[11.5px] text-[#D0021B] font-medium">
                <AlertCircle size={14} className="shrink-0" />
                <span>{infoRequestValidationErr}</span>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowInfoRequestModal(false);
                  setInfoRequestValidationErr(null);
                }}
                className="px-3 py-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingInfoRequest}
                onClick={handleSendInfoRequest}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2855A6] text-white text-[11.5px] font-semibold rounded-lg hover:bg-[#1F4491] disabled:opacity-50 transition-colors shadow-xs"
              >
                {isSendingInfoRequest ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Send Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <EditCaseModal
          c={currentCase}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setCurrentCase(updated);
            if (onUpdateCase) onUpdateCase(updated);
            showToast("Case updated successfully");
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteCaseModal
          c={currentCase}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={(deletedId) => {
            if (onDeleteCase) onDeleteCase(deletedId);
            onClose();
          }}
        />
      )}

      {viewingDoc && (
        <DocumentViewerModal
          doc={viewingDoc}
          clientName={currentCase.client}
          entityName={currentCase.entity}
          onClose={() => setViewingDoc(null)}
        />
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
  const { user } = useAuth();
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
  const [assignTo, setAssignTo] = useState(user?.displayName ?? "J. Okafor");
  const [inviteCompanies, setInviteCompanies] = useState<Array<{ id: string; name: string; abn: string; role: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const clientName = clientSearch || `${givenName} ${familyName}`.trim();

  const handleSend = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const targetEmail = email.trim();
      if (!targetEmail) {
        setFeedback({ type: "error", text: "Please enter a valid email address on Step 1." });
        setStep(1);
        setIsSubmitting(false);
        return;
      }

      const validAddCos = (clientType === "Company" || clientType === "Trust")
        ? inviteCompanies.filter(c => c.name.trim().length > 0)
        : undefined;

      const created = await invitationsApi.create({
        clientName: clientName || "New Client",
        clientType,
        service,
        channel,
        email: targetEmail,
        mobile,
        dueDate,
        assignTo,
        additionalCompanies: validAddCos,
      });

      await activityApi.log({
        time: "Just now",
        actor: assignTo,
        action: "Sent invitation",
        target: `${clientName || "New Client"} — ${service}` + (validAddCos && validAddCos.length > 0 ? ` (+${validAddCos.length} companies)` : ""),
        type: "invite",
      });

      if (created?.emailDelivered) {
        setFeedback({
          type: "success",
          text: `Invitation created & real email delivered to ${targetEmail} via Amazon SES!`,
        });
      } else {
        setFeedback({
          type: "success",
          text: `Invitation created! ${created?.emailMessage || `Link generated for ${targetEmail}`}`,
        });
      }

      setTimeout(() => {
        if (onCreated) onCreated();
        onClose();
      }, 1800);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to dispatch invitation" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-[560px] max-h-[min(90vh,720px)] rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col my-auto">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-card">
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">New client invitation</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
            <XCircle size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-3.5 pb-1 flex items-center gap-3 shrink-0 bg-card">
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

        {feedback && (
          <div className={`mx-6 mt-2 p-3 rounded-lg text-[12px] font-medium flex items-center gap-2 shrink-0 ${
            feedback.type === "success"
              ? "bg-[#E8F7EB] border border-[#2EA843]/30 text-[#1E7A31]"
              : "bg-[#FCE8EB] border border-[#D0021B]/30 text-[#D0021B]"
          }`}>
            {feedback.type === "success" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            {feedback.text}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
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
                      onClick={() => {
                        setClientType(t);
                        if (t !== "Company" && t !== "Trust") setInviteCompanies([]);
                      }}
                      className={`py-2 px-3 rounded border text-[12px] font-medium transition-colors ${clientType === t ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-foreground hover:border-[#2855A6]/40 hover:bg-[#EEF2FA]/40"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiple Companies Registration - ONLY for Trust & Company */}
              {(clientType === "Company" || clientType === "Trust") && (
                <div className="p-3 bg-[#F9FAFC] border border-border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-[#2855A6]" />
                      <span className="text-[12px] font-semibold text-foreground">
                        {clientType === "Trust" ? "Associated Companies / Corporate Trustee" : "Multiple Companies in Group"}
                      </span>
                      <span className="text-[10px] bg-[#EEF2FA] text-[#2855A6] font-semibold px-1.5 py-0.2 rounded">
                        {clientType} only
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInviteCompanies(prev => [...prev, { id: `inv_co_${Date.now()}`, name: "", abn: "", role: clientType === "Trust" ? "Corporate Trustee" : "Subsidiary" }])}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#2855A6] hover:underline"
                    >
                      <Plus size={11} /> Add Company
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {clientType === "Trust"
                      ? "Register the Corporate Trustee company and any beneficiary companies together under this onboarding flow."
                      : "Register multiple subsidiary companies under this corporate group invitation."}
                  </p>
                  {inviteCompanies.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <input
                        value={c.name}
                        onChange={e => setInviteCompanies(prev => prev.map(item => item.id === c.id ? { ...item, name: e.target.value } : item))}
                        placeholder={clientType === "Trust" ? `Company #${i + 1} (e.g. Trustee Pty Ltd)` : `Company #${i + 1} (e.g. Subsidiary Pty Ltd)`}
                        className="flex-1 px-2.5 py-1.5 text-[12px] bg-white border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]"
                      />
                      <button
                        type="button"
                        onClick={() => setInviteCompanies(prev => prev.filter(item => item.id !== c.id))}
                        className="text-muted-foreground hover:text-[#D0021B] p-1 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
              <div className="p-3 bg-[#EEF2FA] border border-[#2855A6]/20 rounded-lg text-[12px] space-y-1">
                <div className="font-semibold text-[#2855A6] flex items-center gap-1.5">
                  <CheckCircle size={14} /> Live Email Dispatch via Amazon SES
                </div>
                <div className="text-foreground text-[11px]">
                  Invitation will be sent directly to: <strong>{email.trim() || "(No email entered — go back to Step 1)"}</strong>
                </div>
                <div className="text-muted-foreground text-[10px]">
                  From: <strong>GrowKYC &lt;andrew@growadvisorygroup.com.au&gt;</strong>
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
                  {FIRM_USERS.map((u) => (
                    <option key={u.id} value={u.displayName}>{u.displayName} ({u.role})</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-border flex items-center justify-between shrink-0 bg-card">
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

function Dashboard({ onOpenApiKeyModal }: { onOpenApiKeyModal?: () => void } = {}) {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"All cases" | "My cases" | "Exceptions">("All cases");
  const [selectedCase, setSelectedCase] = useState<OnboardingCase | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [alertsCollapsed, setAlertsCollapsed] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  const { data: casesPage, loading: casesLoading, error: casesError, refetch: refetchCases } = useApiData(
    () => casesApi.list({ status: statusFilter || undefined, search: search || undefined }),
    [statusFilter, search]
  );
  const { data: alertsData, loading: alertsLoading, refetch: refetchAlerts } = useApiData(() => alertsApi.list());

  const casesArr = casesPage?.items ?? CASES;
  const alertsArr = alertsData ?? ALERTS;

  const currentUserName = user?.displayName ?? "J. Okafor";
  const currentUserLastName = user?.lastName ?? "Okafor";

  const filteredCases = casesArr.filter((c) => {
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchOwner = !ownerFilter || c.owner === ownerFilter;
    const matchChannel = !channelFilter || c.channel === channelFilter;
    const matchSearch = !search || c.client.toLowerCase().includes(search.toLowerCase()) || c.entity.toLowerCase().includes(search.toLowerCase());
    const matchView =
      viewMode === "All cases"
        ? true
        : viewMode === "My cases"
        ? c.owner === currentUserName || c.owner.includes(currentUserLastName)
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
          onDeleteCase={() => {
            refetchCases();
            setSelectedCase(null);
          }}
        />
      )}

      <div className="flex flex-col h-full overflow-hidden">
        <Header onNewInvitation={() => setShowModal(true)} onOpenApiKeyModal={onOpenApiKeyModal} searchQuery={search} onSearchChange={setSearch} />

        <div className="flex-1 overflow-y-auto">
          <div className="p-3.5 sm:p-4 space-y-3 w-full">
            {/* Page title */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[18px] font-bold text-foreground leading-tight">Start Dashboard</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">29 July 2026 · Grow Advisory Group</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCharts((s) => !s)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${showCharts ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-muted-foreground hover:text-foreground"}`}
                  title="Toggle conversion funnel and metrics charts"
                >
                  <BarChart2 size={12} />
                  {showCharts ? "Hide charts" : "Show charts"}
                </button>
                <span className="text-[11px] text-muted-foreground ml-1">View:</span>
                {(["All cases", "My cases", "Exceptions"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${viewMode === v ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-2.5">
              <SummaryCard
                label="Active cases"
                value={stats.active}
                sub="this month"
                icon={<Layers size={14} className="text-[#2855A6]" />}
                accent="bg-[#EEF2FA]"
              />
              <SummaryCard
                label="Overdue"
                value={stats.overdue}
                sub="need attention"
                icon={<AlertTriangle size={14} className="text-[#F5A623]" />}
                accent="bg-[#FEF6E9]"
              />
              <SummaryCard
                label="Accepted this month"
                value={stats.accepted}
                sub="engagements"
                icon={<CheckCircle size={14} className="text-[#2EA843]" />}
                accent="bg-[#E8F7EB]"
              />
              <SummaryCard
                label="Open exceptions"
                value={stats.exceptions}
                sub="require review"
                icon={<Shield size={14} className="text-[#D0021B]" />}
                accent="bg-[#FCE8EB]"
              />
            </div>

            {/* Charts row */}
            {showCharts && (
              <div className="grid grid-cols-2 gap-3">
                {/* Funnel bar chart */}
                <div className="bg-card border border-border rounded-lg p-3">
                  <h3 className="text-[11px] font-semibold text-foreground mb-2">Conversion funnel — July 2026</h3>
                  <div className="flex items-end gap-2 h-[80px]">
                    {conversionData.map((d) => {
                      const pct = Math.round((d.count / conversionData[0].count) * 100);
                      return (
                        <div key={d.stage} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                          <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-semibold">{d.count}</span>
                          <div
                            className="w-full rounded-t-[3px] bg-[#2855A6] transition-all"
                            style={{ height: `${pct}%`, minHeight: 4 }}
                          />
                          <span className="text-[8.5px] text-muted-foreground text-center leading-tight whitespace-nowrap overflow-hidden">{d.stage}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Trend line chart */}
                <div className="bg-card border border-border rounded-lg p-3">
                  <h3 className="text-[11px] font-semibold text-foreground mb-0.5">Median completion time (minutes)</h3>
                  <p className="text-[9.5px] text-muted-foreground mb-1.5">Individual cases — last 6 weeks</p>
                  <svg width="100%" height="76" viewBox="0 0 320 110" preserveAspectRatio="none">
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
                          <circle cx={x} cy={y} r="3" fill="#20BCA4" />
                          <text x={x} y="106" textAnchor="middle" fontSize="8.5" fill="#6F6F6F">{d.week}</text>
                          <text x={x} y={y - 7} textAnchor="middle" fontSize="8.5" fill="#2E2E2E" fontWeight="600">{d.time}m</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}

            {/* Main content: table + alert rail */}
            <div className="flex gap-2.5 items-start">
              <div className="flex-1 min-w-0 space-y-2.5">
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
                  <CasesTable cases={filteredCases} onSelect={setSelectedCase} onRefresh={refetchCases} />
                )}
              </div>

              <div className={alertsCollapsed ? "w-8 shrink-0 transition-all" : "w-[150px] min-w-[150px] shrink-0 transition-all"}>
                <ReviewAlertRail
                  alerts={alertsArr}
                  collapsed={alertsCollapsed}
                  onToggleCollapse={() => setAlertsCollapsed((c) => !c)}
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
  const nav = useNavigation();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <Header
        breadcrumb={breadcrumb}
        onNewInvitation={onNewInvitation || nav?.openNewInvitation}
        onOpenApiKeyModal={nav?.openApiKeyModal}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-3.5 sm:p-4 space-y-3 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-foreground leading-tight">{title}</h1>
              {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
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
  const [stageFilter, setStageFilter] = useState<string | null>(null);

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
    exportToCsv("onboarding_pipeline.csv", filtered as unknown as Record<string, unknown>[]);
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
          onDeleteCase={() => {
            refetch();
            setSelectedCase(null);
          }}
        />
      )}
      <PageShell
        title="Onboarding Pipeline (11 Stages)"
        subtitle="11-Stage client intake, verification gateway and downstream practice handover"
        breadcrumb={["EnTIQ", "Start", "Onboarding Pipeline"]}
        onNewInvitation={() => setShowModal(true)}
        actions={
          <div className="flex gap-1.5">
            {(["All", "Active", "Awaiting action", "Completed"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewTab(v)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${viewTab === v ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {v}
              </button>
            ))}
          </div>
        }
      >
        {/* 11-Stage Pipeline Ribbon */}
        <div className="bg-card border border-border rounded-lg p-2.5 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-[780px]">
            {ONBOARDING_11_STAGES.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#F8FAFF] border border-[#2855A6]/20 text-[10px] font-medium text-foreground whitespace-nowrap hover:bg-[#EEF2FA] transition-colors"
                  title={`Stage ${s.step}: ${s.desc}`}
                >
                  <span className="w-4 h-4 rounded-full bg-[#2855A6] text-white flex items-center justify-center font-bold text-[8.5px]">
                    {s.step}
                  </span>
                  <span>{s.label}</span>
                </div>
                {idx < ONBOARDING_11_STAGES.length - 1 && (
                  <ChevronRight size={11} className="text-muted-foreground mx-0.5 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Total in Pipeline", value: loading ? "—" : allCases.length, color: "text-foreground" },
            { label: "Intake / In Progress", value: loading ? "—" : allCases.filter(c => ["In progress","Awaiting others"].includes(c.status)).length, color: "text-[#2855A6]" },
            { label: "Stage 9/10 Verification", value: loading ? "—" : allCases.filter(c => ["Internal review","Acceptance review","Submitted"].includes(c.status)).length, color: "text-[#F5A623]" },
            { label: "Stage 11 Activated", value: loading ? "—" : allCases.filter(c => c.status === "Accepted").length, color: "text-[#2EA843]" },
            { label: "Rejected / Withdrawn", value: loading ? "—" : allCases.filter(c => c.status === "Rejected").length, color: "text-[#D0021B]" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg px-2.5 py-1.5">
              <div className="text-[9.5px] text-muted-foreground mb-0.5">{s.label}</div>
              <div className={`text-[16px] font-bold ${s.color}`}>{s.value}</div>
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
        {loading ? <TableSkeleton rows={8} cols={9} /> : <CasesTable cases={filtered} onSelect={setSelectedCase} onRefresh={refetch} />}
      </PageShell>
    </>
  );
}

// ─── Invitations screen ───────────────────────────────────────────────────────


function InvitationDetailDrawer({
  inv,
  onClose,
  onUpdated,
}: {
  inv: InvitationRow;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const nav = useNavigation();
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

  const handleViewCase = async () => {
    try {
      showToast("Opening onboarding case...");
      const allCases = await casesApi.getAll();
      const matchingCase = allCases.find(
        (c: OnboardingCase) =>
          c.client.toLowerCase() === inv.client.toLowerCase() ||
          (inv.email && c.client.toLowerCase().includes(inv.email.toLowerCase())) ||
          c.id === inv.id.replace("INV-", "C-") ||
          c.service === inv.service
      ) || allCases[0];

      if (matchingCase) {
        onClose();
        if (nav) {
          nav.setActiveNav("cases");
          setTimeout(() => {
            nav.openCaseDetail?.(matchingCase);
          }, 150);
        }
      } else {
        if (nav) nav.setActiveNav("cases");
        onClose();
      }
    } catch (e) {
      if (nav) nav.setActiveNav("cases");
      onClose();
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/onboard?id=${inv.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopied(true);
    showToast("Invitation link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const [testRecipient, setTestRecipient] = useState(inv.email);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSendTestToEmail = async () => {
    if (!testRecipient.trim()) return;
    setIsSendingTest(true);
    setTestFeedback(null);
    try {
      const res: any = await invitationsApi.resend(inv.id, { toEmail: testRecipient.trim() });
      if (res?.emailDelivered) {
        setTestFeedback({ type: "success", text: `Delivered live email to ${testRecipient.trim()} via Amazon SES!` });
        showToast(`Delivered to ${testRecipient.trim()}`);
      } else {
        setTestFeedback({ type: "success", text: `Invitation updated: ${res?.emailMessage || res?.message}` });
        showToast(`Invitation sent`);
      }
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setTestFeedback({ type: "error", text: err?.message || "Failed to dispatch email" });
    } finally {
      setIsSendingTest(false);
    }
  };

  const [resending, setResending] = useState(false);
  const handleResend = async () => {
    setResending(true);
    try {
      const res: any = await invitationsApi.resend(inv.id);
      await activityApi.log({
        time: "Just now",
        actor: "J. Okafor",
        action: "Resent invitation",
        target: `${inv.id} · ${inv.client} (${inv.email})`,
        type: "invite",
      });
      showToast(res?.emailDelivered ? `Delivered via Amazon SES to ${inv.email}` : `Fresh link generated for ${inv.email}`);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err?.message || "Failed to resend invitation");
    } finally {
      setResending(false);
    }
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

              {/* Send copy to my email */}
              <div className="p-3.5 bg-[#EEF2FA] border border-[#2855A6]/25 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#2855A6] flex items-center gap-1.5">
                    <Mail size={14} /> Send this invitation to your email
                  </span>
                  <span className="text-[10px] bg-[#2855A6]/10 text-[#2855A6] font-semibold px-2 py-0.5 rounded">
                    Amazon SES Live
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Dispatch this full client onboarding invitation email directly to your own inbox to inspect it.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="Enter your email address…"
                    className="flex-1 px-3 py-1.5 text-[12px] bg-white border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]"
                  />
                  <button
                    type="button"
                    disabled={isSendingTest || !testRecipient.trim()}
                    onClick={handleSendTestToEmail}
                    className="px-3.5 py-1.5 bg-[#2855A6] text-white text-[12px] font-semibold rounded hover:bg-[#1F4491] disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {isSendingTest ? "Sending…" : "Send to my email"}
                  </button>
                </div>
                {testFeedback && (
                  <div className={`text-[11px] font-medium p-2 rounded flex items-center gap-1.5 ${
                    testFeedback.type === "success" ? "bg-[#E8F7EB] text-[#1E7A31]" : "bg-[#FCE8EB] text-[#D0021B]"
                  }`}>
                    {testFeedback.type === "success" ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                    {testFeedback.text}
                  </div>
                )}
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
              onClick={handleViewCase}
              className="px-4 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors flex items-center gap-1.5"
            >
              <FileText size={13} />
              <span>View onboarding case</span>
            </button>
          )}
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 border border-border text-[13px] font-semibold rounded hover:bg-muted transition-colors"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          <a
            href={`/onboard?id=${inv.id}&test=true`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 border border-[#2855A6]/30 bg-[#EEF2FA] text-[#2855A6] text-[13px] font-semibold rounded hover:bg-[#2855A6]/20 transition-colors inline-flex items-center gap-1.5"
            title="Test client onboarding intake flow in new tab"
          >
            <ExternalLink size={13} />
            <span>Test onboarding</span>
          </a>
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

function EditInvitationModal({
  inv,
  onClose,
  onSaved,
}: {
  inv: Invitation;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [client, setClient] = useState(inv.client);
  const [email, setEmail] = useState(inv.email);
  const [service, setService] = useState(inv.service);
  const [channel, setChannel] = useState(inv.channel);
  const [status, setStatus] = useState(inv.status);
  const [expires, setExpires] = useState(inv.expires);
  const [owner, setOwner] = useState(inv.owner);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!client.trim() || !email.trim()) {
      setError("Client name and email are required");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await invitationsApi.update(inv.id, {
        client: client.trim(),
        email: email.trim(),
        service,
        channel,
        status,
        expires,
        owner,
      });

      await activityApi.log({
        time: "Just now",
        actor: owner,
        action: "Updated invitation details",
        target: `${inv.id} · ${client.trim()}`,
        type: "invite",
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card w-[520px] max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">Edit Invitation</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Modify invitation parameters for <span className="font-mono text-[#2855A6] font-semibold">{inv.id}</span></p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><XCircle size={18} /></button>
        </div>

        {error && (
          <div className="p-2.5 bg-[#FCE8EB] border border-[#D0021B]/30 rounded text-[12px] text-[#D0021B]">
            {error}
          </div>
        )}

        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block font-medium text-foreground mb-1">Client Name *</label>
            <input
              value={client}
              onChange={e => setClient(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">Service</label>
              <select
                value={service}
                onChange={e => setService(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              >
                <option value="Individual Tax Return">Individual Tax Return</option>
                <option value="Company Tax + Advisory">Company Tax + Advisory</option>
                <option value="Trust Tax Return">Trust Tax Return</option>
                <option value="SMSF Administration">SMSF Administration</option>
                <option value="BAS Preparation">BAS Preparation</option>
                <option value="Business Advisory">Business Advisory</option>
                <option value="Partnership Tax Return">Partnership Tax Return</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">Channel</label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              >
                <option value="Email">Email</option>
                <option value="SMS link">SMS link</option>
                <option value="QR code">QR code</option>
                <option value="In-person tablet">In-person tablet</option>
                <option value="Client portal">Client portal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              >
                <option value="Sent">Sent</option>
                <option value="Opened">Opened</option>
                <option value="Started">Started</option>
                <option value="Completed">Completed</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">Expires Date</label>
              <input
                value={expires}
                onChange={e => setExpires(e.target.value)}
                placeholder="e.g. 15 Aug"
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Assigned Adviser</label>
            <select
              value={owner}
              onChange={e => setOwner(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
            >
              <option value="J. Okafor">J. Okafor</option>
              <option value="S. Patel">S. Patel</option>
              <option value="A. Brennan">A. Brennan</option>
              <option value="M. Chen">M. Chen</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
          <button
            disabled={isSubmitting || !client.trim() || !email.trim()}
            onClick={handleSave}
            className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteInvitationModal({
  inv,
  onClose,
  onDeleted,
}: {
  inv: Invitation;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await invitationsApi.delete(inv.id);
      await activityApi.log({
        time: "Just now",
        actor: inv.owner,
        action: "Deleted invitation",
        target: `${inv.id} · ${inv.client}`,
        type: "reject",
      });
      onDeleted();
      onClose();
    } catch {
      onDeleted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card w-[440px] rounded-xl p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FCE8EB] text-[#D0021B] flex items-center justify-center shrink-0">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Delete Invitation?</h3>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
              Are you sure you want to delete invitation <span className="font-mono text-[11px] font-semibold text-foreground">{inv.id}</span> for <strong>{inv.client}</strong> ({inv.email})? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 bg-[#D0021B] text-white text-[13px] font-semibold rounded hover:bg-[#B00216] disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {isDeleting ? "Deleting…" : "Delete Invitation"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvitationsScreen() {
  const [showModal, setShowModal] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedInvitation, setSelectedInvitation] = useState<InvitationRow | null>(null);
  const [editingInvitation, setEditingInvitation] = useState<Invitation | null>(null);
  const [deletingInvitation, setDeletingInvitation] = useState<Invitation | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

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
      {showEmailSettings && (
        <EmailSettingsModal
          isOpen={showEmailSettings}
          onClose={() => setShowEmailSettings(false)}
          onSaved={() => { refetch(); }}
        />
      )}
      {editingInvitation && (
        <EditInvitationModal
          inv={editingInvitation}
          onClose={() => setEditingInvitation(null)}
          onSaved={() => { refetch(); }}
        />
      )}
      {deletingInvitation && (
        <DeleteInvitationModal
          inv={deletingInvitation}
          onClose={() => setDeletingInvitation(null)}
          onDeleted={() => { refetch(); }}
        />
      )}
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmailSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-[13px] font-semibold rounded hover:bg-[#EEF2FA] text-[#2855A6] transition-colors shadow-sm"
              title="Configure live outgoing SMTP server"
            >
              <Mail size={14} />
              Email &amp; SMTP Settings
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors"
            >
              <Plus size={14} />New invitation
            </button>
          </div>
        }
      >
        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Sent this month", value: sentCount, icon: <Inbox size={13} className="text-[#2855A6]" />, bg: "bg-[#EEF2FA]" },
            { label: "Opened", value: openedCount, icon: <Eye size={13} className="text-[#F5A623]" />, bg: "bg-[#FEF6E9]" },
            { label: "Started", value: startedCount, icon: <Clock size={13} className="text-[#2855A6]" />, bg: "bg-[#E3F0FB]" },
            { label: "Expiring in 3 days", value: expiringCount, icon: <AlertTriangle size={13} className="text-[#D0021B]" />, bg: "bg-[#FCE8EB]" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg px-2.5 py-1.5 flex items-center gap-2">
              <div className={`p-1 rounded-md ${s.bg}`}>{s.icon}</div>
              <div>
                <div className="text-[15px] font-bold text-foreground leading-tight">{s.value}</div>
                <div className="text-[9.5px] text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search client or email…"
              className="pl-7 pr-2.5 py-1 text-[11.5px] bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] w-[200px] transition-all"
            />
          </div>
          {["All", "Sent", "Opened", "Started", "Expired", "Completed"].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={`px-2.5 py-1 text-[11px] border rounded transition-colors ${statusFilter === s ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6] font-semibold" : "border-border text-muted-foreground hover:border-[#2855A6]/40 hover:text-[#2855A6]"}`}
            >
              {s}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
          >
            <Download size={11} />Export
          </button>
        </div>

        {error && <ApiErrorBanner message={error} onRetry={refetch} />}

        {/* Table */}
        {loading ? <TableSkeleton rows={6} cols={10} /> : (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-[11px] min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-[#FAFAFA]">
                {["Invitation ID", "Client", "Email", "Service", "Channel", "Status", "Sent", "Expires", "Owner", "Actions"].map((h, idx) => (
                  <th key={h} className={`${idx === 9 ? "text-right pr-3" : "text-left"} px-2.5 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedInvitations.map((inv, i) => (
                <tr key={inv.id} onClick={() => setSelectedInvitation(inv)} className={`border-b border-border last:border-0 hover:bg-[#F8FAFF] cursor-pointer transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}>
                  <td className="px-2.5 py-1.5 whitespace-nowrap"><span className="font-mono text-[10.5px] font-semibold text-[#2855A6]">{inv.id}</span></td>
                  <td className="px-2.5 py-1.5 font-medium text-foreground max-w-[140px] truncate text-[11px]">{inv.client}</td>
                  <td className="px-2.5 py-1.5 text-muted-foreground max-w-[160px] truncate text-[10.5px]">{inv.email}</td>
                  <td className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{inv.service}</td>
                  <td className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{inv.channel}</td>
                  <td className="px-2.5 py-1.5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${invStatusColor(inv.status)}`}>{inv.status}</span>
                  </td>
                  <td className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{inv.sent}</td>
                  <td className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{inv.expires}</td>
                  <td className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{inv.owner}</td>
                  <td className="px-2.5 py-1.5 text-right relative pr-3" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === inv.id ? null : inv.id);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center justify-center"
                      title="Actions"
                    >
                      <MoreHorizontal size={13} />
                    </button>

                    {openMenuId === inv.id && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="absolute right-3 top-7 w-36 bg-card border border-border rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 text-left"
                      >
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setSelectedInvitation(inv);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-foreground hover:bg-[#EEF2FA] hover:text-[#2855A6] transition-colors"
                        >
                          <Eye size={12} className="text-[#2855A6]" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setEditingInvitation(inv);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-foreground hover:bg-[#FEF6E9] hover:text-[#B87A1A] transition-colors"
                        >
                          <Pencil size={12} className="text-[#F5A623]" />
                          <span>Edit</span>
                        </button>
                        <div className="my-0.5 border-t border-border" />
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setDeletingInvitation(inv);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#D0021B] hover:bg-[#FCE8EB] transition-colors"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-8 text-center text-[12px] text-muted-foreground">
              No invitations match your filters.
            </div>
          )}

          <div className="px-3 py-1.5 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{filtered.length} invitation{filtered.length !== 1 ? "s" : ""} shown</span>
            <div className="flex items-center gap-2.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="hover:text-foreground disabled:opacity-40 font-medium"
              >
                Previous
              </button>
              <span className="px-1.5 py-0.5 bg-[#EEF2FA] text-[#2855A6] rounded font-semibold">{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="hover:text-foreground disabled:opacity-40 font-medium"
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

interface AdditionalCo {
  id: string;
  name: string;
  role: string;
  abn: string;
  acn: string;
}

function AddEntityModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Individual");
  const [abn, setAbn] = useState("");
  const [acn, setAcn] = useState("");
  const [verified, setVerified] = useState("Document");
  const [additionalCompanies, setAdditionalCompanies] = useState<AdditionalCo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompanyOrTrust = type === "Company" || type === "Trust";

  const addCompanyRow = () => {
    setAdditionalCompanies(prev => [
      ...prev,
      {
        id: `co_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: "",
        role: type === "Trust" ? "Corporate Trustee" : "Subsidiary",
        abn: "",
        acn: "",
      }
    ]);
  };

  const removeCompanyRow = (id: string) => {
    setAdditionalCompanies(prev => prev.filter(c => c.id !== id));
  };

  const updateCompanyRow = (id: string, field: keyof AdditionalCo, value: string) => {
    setAdditionalCompanies(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const primaryId = `${type === "Individual" ? "P" : "E"}-${Math.floor(Math.random() * 90000 + 10000)}`;
      const primaryClient: ClientEntity = {
        id: primaryId,
        name: name.trim(),
        type,
        abn,
        acn,
        verified,
        cases: 0,
        engagements: 0,
        added: "Today",
        status: "Active",
      };

      const validAddCos = isCompanyOrTrust
        ? additionalCompanies.filter(c => c.name.trim().length > 0)
        : [];

      const additionalClients: ClientEntity[] = validAddCos.map((c, i) => ({
        id: `E-${Math.floor(Math.random() * 90000 + 10000 + i)}`,
        name: c.name.trim(),
        type: "Company",
        abn: c.abn || "",
        acn: c.acn || "",
        verified,
        cases: 0,
        engagements: 0,
        added: "Today",
        status: "Active",
      }));

      const allEntities = [primaryClient, ...additionalClients];

      if (allEntities.length > 1) {
        await clientsApi.createBatch(allEntities);
      } else {
        await clientsApi.create(primaryClient);
      }

      await activityApi.log({
        time: "Just now",
        actor: "J. Okafor",
        action: additionalClients.length > 0
          ? `Created ${type} and registered ${additionalClients.length} related companies`
          : "Created entity record",
        target: additionalClients.length > 0
          ? `${name} (${type}) + ${additionalClients.map(c => c.name).join(", ")}`
          : `${name} (${type})`,
        type: "client",
      });

      onCreated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card w-[520px] max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">Add New Client or Entity</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Register entity structures into the practice directory</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><XCircle size={18} /></button>
        </div>

        <div className="space-y-3.5 text-[13px]">
          <div>
            <label className="block font-medium text-foreground mb-1">
              {type === "Trust" ? "Trust Legal Name *" : type === "Company" ? "Primary Company Legal Name *" : "Legal Entity / Person Name *"}
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={type === "Trust" ? "e.g. The Marcelline Family Trust" : type === "Company" ? "e.g. Northfield Holdings Pty Ltd" : "e.g. John Smith"}
              className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Entity Structure</label>
            <select
              value={type}
              onChange={e => {
                setType(e.target.value);
                if (e.target.value !== "Company" && e.target.value !== "Trust") {
                  setAdditionalCompanies([]);
                }
              }}
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

          {/* Multiple Companies Registration - ONLY for Company and Trust */}
          {isCompanyOrTrust && (
            <div className="pt-3 border-t border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Building2 size={15} className="text-[#2855A6]" />
                  <span className="text-[12px] font-semibold text-foreground">
                    {type === "Trust" ? "Associated Companies / Corporate Trustee" : "Multiple Companies in Group"}
                  </span>
                  <span className="text-[10px] bg-[#EEF2FA] text-[#2855A6] font-semibold px-1.5 py-0.5 rounded">
                    {type} only
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addCompanyRow}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#2855A6] hover:text-[#1F4491] hover:underline"
                >
                  <Plus size={12} />
                  Add Company
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {type === "Trust"
                  ? "You can register multiple companies under this trust (e.g. Corporate Trustee company, Operating company, or Beneficiary entities) together."
                  : "You can register multiple subsidiary, sister, or holding companies under this corporate group together."}
              </p>

              {additionalCompanies.length === 0 ? (
                <div className="p-3 bg-[#F9FAFC] border border-dashed border-border rounded-lg text-center">
                  <p className="text-[11px] text-muted-foreground">No additional companies added to this {type.toLowerCase()}.</p>
                  <button
                    type="button"
                    onClick={addCompanyRow}
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#2855A6] font-semibold hover:underline"
                  >
                    <Plus size={12} />
                    {type === "Trust" ? "Add Corporate Trustee Company" : "Add Subsidiary / Group Company"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {additionalCompanies.map((co, idx) => (
                    <div key={co.id} className="p-3 bg-[#F9FAFC] border border-border rounded-lg space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                          <Building2 size={11} className="text-[#2855A6]" />
                          Company #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCompanyRow(co.id)}
                          className="text-muted-foreground hover:text-[#D0021B] p-0.5 transition-colors"
                          title="Remove company"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <input
                            value={co.name}
                            onChange={e => updateCompanyRow(co.id, "name", e.target.value)}
                            placeholder="Company Legal Name * (e.g. Apex Trustee Pty Ltd)"
                            className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <select
                              value={co.role}
                              onChange={e => updateCompanyRow(co.id, "role", e.target.value)}
                              className="w-full px-2 py-1.5 text-[11px] bg-white border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]"
                            >
                              {type === "Trust" ? (
                                <>
                                  <option value="Corporate Trustee">Corporate Trustee</option>
                                  <option value="Trading Entity">Trading Entity</option>
                                  <option value="Beneficiary Co">Beneficiary Co</option>
                                  <option value="Investment Entity">Investment Entity</option>
                                </>
                              ) : (
                                <>
                                  <option value="Subsidiary">Subsidiary</option>
                                  <option value="Holding Company">Holding Company</option>
                                  <option value="Operating Entity">Operating Entity</option>
                                  <option value="Sister Company">Sister Company</option>
                                </>
                              )}
                            </select>
                          </div>
                          <div>
                            <input
                              value={co.abn}
                              onChange={e => updateCompanyRow(co.id, "abn", e.target.value)}
                              placeholder="ABN"
                              className="w-full px-2 py-1.5 text-[11px] bg-white border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]"
                            />
                          </div>
                          <div>
                            <input
                              value={co.acn}
                              onChange={e => updateCompanyRow(co.id, "acn", e.target.value)}
                              placeholder="ACN"
                              className="w-full px-2 py-1.5 text-[11px] bg-white border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
          <button
            disabled={isSubmitting || !name.trim()}
            onClick={handleSave}
            className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {isSubmitting ? "Creating…" : (
              isCompanyOrTrust && additionalCompanies.filter(c => c.name.trim()).length > 0
                ? `Create ${type} + ${additionalCompanies.filter(c => c.name.trim()).length} Companies`
                : "Create Entity"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewEntityModal({
  client,
  onClose,
  onEdit,
  onDelete,
}: {
  client: ClientEntity;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card w-[520px] max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-border flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EEF2FA] text-[#2855A6] flex items-center justify-center font-bold text-[14px]">
              {client.type === "Individual" ? <UserCheck size={20} /> : <Building2 size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-semibold text-foreground">{client.name}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${verifiedBadge(client.verified)}`}>
                  {client.verified}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[11px] text-[#2855A6] font-semibold">{client.id}</span>
                <span className="text-[11px] text-muted-foreground">· {client.type}</span>
                <span className="text-[11px] text-muted-foreground">· Added {client.added}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><XCircle size={18} /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-[12px]">
          {/* Key Properties Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#F9FAFC] border border-border rounded-lg">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Entity Type</span>
              <span className="font-semibold text-foreground text-[13px]">{client.type}</span>
            </div>
            <div className="p-3 bg-[#F9FAFC] border border-border rounded-lg">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Status</span>
              <span className="font-semibold text-[#1E7A31] text-[13px] inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#2EA843]" />
                {client.status || "Active"}
              </span>
            </div>
            <div className="p-3 bg-[#F9FAFC] border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground block mb-0.5">ABN</span>
                {client.abn && (
                  <button
                    onClick={() => copyToClipboard(client.abn!, "abn")}
                    className="text-[10px] text-[#2855A6] hover:underline flex items-center gap-0.5"
                  >
                    {copied === "abn" ? <CheckCircle size={10} className="text-[#2EA843]" /> : <Copy size={10} />}
                    {copied === "abn" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <span className="font-mono font-medium text-foreground text-[12px]">{client.abn || "—"}</span>
            </div>
            <div className="p-3 bg-[#F9FAFC] border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground block mb-0.5">ACN</span>
                {client.acn && (
                  <button
                    onClick={() => copyToClipboard(client.acn!, "acn")}
                    className="text-[10px] text-[#2855A6] hover:underline flex items-center gap-0.5"
                  >
                    {copied === "acn" ? <CheckCircle size={10} className="text-[#2EA843]" /> : <Copy size={10} />}
                    {copied === "acn" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <span className="font-mono font-medium text-foreground text-[12px]">{client.acn || "—"}</span>
            </div>
          </div>

          {/* Activity summary */}
          <div className="p-3.5 border border-border rounded-lg bg-card space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Practice Activity</span>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#EEF2FA] text-[#2855A6]"><Layers size={16} /></div>
                <div>
                  <div className="text-[18px] font-bold text-foreground leading-tight">{client.cases ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">Active Onboarding Cases</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#E8F7EB] text-[#2EA843]"><FileText size={16} /></div>
                <div>
                  <div className="text-[18px] font-bold text-foreground leading-tight">{client.engagements ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">Signed Engagements</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground">
            Verification status: <strong>{client.verified}</strong>. Recorded in practice directory with identifier <code className="font-mono text-[#2855A6] bg-[#EEF2FA] px-1 py-0.5 rounded">{client.id}</code>.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0 bg-[#FAFAFA]">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#D0021B] hover:bg-[#FCE8EB] rounded transition-colors"
          >
            <Trash2 size={13} />Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-[12px] text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2855A6] text-white text-[12px] font-semibold rounded hover:bg-[#1F4491] transition-colors"
            >
              <Pencil size={12} />Edit Entity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditEntityModal({
  client,
  onClose,
  onSaved,
}: {
  client: ClientEntity;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [type, setType] = useState(client.type);
  const [abn, setAbn] = useState(client.abn || "");
  const [acn, setAcn] = useState(client.acn || "");
  const [verified, setVerified] = useState(client.verified || "Document");
  const [status, setStatus] = useState(client.status || "Active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Legal name is required");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await clientsApi.update(client.id, {
        name: name.trim(),
        type,
        abn: abn.trim(),
        acn: acn.trim(),
        verified,
        status,
      });

      await activityApi.log({
        time: "Just now",
        actor: "J. Okafor",
        action: "Updated client entity",
        target: `${client.id} · ${name.trim()}`,
        type: "client",
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update client entity");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card w-[520px] max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">Edit Client / Entity</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Update entity details for {client.id}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><XCircle size={18} /></button>
        </div>

        {error && (
          <div className="p-2.5 bg-[#FCE8EB] border border-[#D0021B]/30 rounded text-[12px] text-[#D0021B]">
            {error}
          </div>
        )}

        <div className="space-y-3.5 text-[13px]">
          <div>
            <label className="block font-medium text-foreground mb-1">Legal / Display Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block font-medium text-foreground mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">ABN</label>
              <input
                value={abn}
                onChange={e => setAbn(e.target.value)}
                placeholder="11-digit ABN"
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">ACN</label>
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

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
          <button
            disabled={isSubmitting || !name.trim()}
            onClick={handleSave}
            className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteEntityModal({
  client,
  onClose,
  onDeleted,
}: {
  client: ClientEntity;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await clientsApi.delete(client.id);
      await activityApi.log({
        time: "Just now",
        actor: "J. Okafor",
        action: "Deleted client entity",
        target: `${client.id} · ${client.name}`,
        type: "client",
      });
      onDeleted();
      onClose();
    } catch {
      onDeleted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card w-[440px] rounded-xl p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FCE8EB] text-[#D0021B] flex items-center justify-center shrink-0">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Delete Client Entity?</h3>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
              Are you sure you want to delete <strong>{client.name}</strong> (<span className="font-mono text-[11px]">{client.id}</span>)? This entity will be removed from your practice directory.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-[#D0021B] text-white text-[13px] font-semibold rounded hover:bg-[#B00217] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete Entity"}
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
  const pageSize = 8;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewingClient, setViewingClient] = useState<ClientEntity | null>(null);
  const [editingClient, setEditingClient] = useState<ClientEntity | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientEntity | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handleWindowClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [openMenuId]);

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
      {viewingClient && (
        <ViewEntityModal
          client={viewingClient}
          onClose={() => setViewingClient(null)}
          onEdit={() => {
            const target = viewingClient;
            setViewingClient(null);
            setEditingClient(target);
          }}
          onDelete={() => {
            const target = viewingClient;
            setViewingClient(null);
            setDeletingClient(target);
          }}
        />
      )}
      {editingClient && (
        <EditEntityModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSaved={() => {
            refetch();
          }}
        />
      )}
      {deletingClient && (
        <DeleteEntityModal
          client={deletingClient}
          onClose={() => setDeletingClient(null)}
          onDeleted={() => {
            refetch();
          }}
        />
      )}
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
        <div className="flex gap-1 p-0.5 bg-card border border-border rounded-lg w-fit">
          {["All types", "Individual", "Company", "Trust", "SMSF", "Partnership"].map(t => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t === "All types" ? "" : t); setCurrentPage(1); }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${(t === "All types" && !typeFilter) || typeFilter === t ? "bg-[#2855A6] text-white" : "text-muted-foreground hover:text-foreground"}`}
            >{t}</button>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search name, ABN or ACN…"
              className="pl-7 pr-2.5 py-1 text-[11.5px] bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] w-[220px] transition-all"
            />
          </div>
          <select
            value={verificationFilter}
            onChange={e => { setVerificationFilter(e.target.value); setCurrentPage(1); }}
            className="text-[11.5px] border border-border rounded px-2.5 py-1 bg-card focus:outline-none appearance-none pr-7 cursor-pointer"
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
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
          >
            <Download size={11} />Export
          </button>
        </div>

        {error && <ApiErrorBanner message={error} onRetry={refetch} />}

        {/* Table */}
        {loading ? <TableSkeleton rows={8} cols={9} /> : (
        <div className="bg-card border border-border rounded-lg overflow-visible">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border bg-[#FAFAFA]">
                {["ID", "Name", "Type", "ABN / ACN", "Verification", "Active cases", "Engagements", "Added", ""].map(h => (
                  <th key={h} className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedClients.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => setViewingClient(c)}
                  className={`border-b border-border last:border-0 hover:bg-[#F8FAFF] cursor-pointer transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}
                >
                  <td className="px-2.5 py-1.5 whitespace-nowrap"><span className="font-mono text-[10.5px] text-[#2855A6] font-semibold">{c.id}</span></td>
                  <td className="px-2.5 py-1.5 font-medium text-foreground text-[11px]">{c.name}</td>
                  <td className="px-2.5 py-1.5 text-muted-foreground text-[10.5px]">{c.type}</td>
                  <td className="px-2.5 py-1.5 text-muted-foreground font-mono text-[10.5px]">{c.abn || c.acn || "—"}</td>
                  <td className="px-2.5 py-1.5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${verifiedBadge(c.verified)}`}>{c.verified}</span>
                  </td>
                  <td className="px-2.5 py-1.5 text-center text-muted-foreground text-[10.5px]">{c.cases}</td>
                  <td className="px-2.5 py-1.5 text-center text-muted-foreground text-[10.5px]">{c.engagements}</td>
                  <td className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{c.added}</td>
                  <td className="px-2.5 py-1.5 relative text-right pr-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === c.id ? null : c.id);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center justify-center"
                      title="Actions"
                    >
                      <MoreHorizontal size={13} />
                    </button>

                    {openMenuId === c.id && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="absolute right-2 top-7 w-36 bg-card border border-border rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 text-left"
                      >
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setViewingClient(c);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-foreground hover:bg-[#EEF2FA] hover:text-[#2855A6] transition-colors"
                        >
                          <Eye size={12} className="text-[#2855A6]" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setEditingClient(c);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-foreground hover:bg-[#FEF6E9] hover:text-[#B87A1A] transition-colors"
                        >
                          <Pencil size={12} className="text-[#F5A623]" />
                          <span>Edit</span>
                        </button>
                        <div className="my-0.5 border-t border-border" />
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setDeletingClient(c);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#D0021B] hover:bg-[#FCE8EB] transition-colors"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-8 text-center text-[12px] text-muted-foreground">
              No clients match your filter criteria.
            </div>
          )}

          <div className="px-3 py-1.5 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{filtered.length} records shown</span>
            <div className="flex items-center gap-2.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="hover:text-foreground disabled:opacity-40 font-medium"
              >
                Previous
              </button>
              <span className="px-1.5 py-0.5 bg-[#EEF2FA] text-[#2855A6] rounded font-semibold">{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="hover:text-foreground disabled:opacity-40 font-medium"
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

type EngagementDraftService = {
  name: string;
  fee: number;
  freq: string;
  gst: boolean;
  scope: string;
  feeOverride: string;
  companyMode?: "single" | "multiple";
  companyCount?: number;
  companyNames?: string[];
  pricingModel?: "group_addon" | "multiplier";
};

type EngagementDraft = {
  clientId: string;
  clientName: string;
  clientType: string;
  adviserId: string;
  adviserName: string;
  services: EngagementDraftService[];
  startDate: string;
  renewalDate: string;
  deliveryMethod: "esign" | "manual";
  notes: string;
};

function computeCompanyTaxFee(baseAmount: number, mode: "single" | "multiple", count: number, pricingModel: "group_addon" | "multiplier") {
  if (mode === "single" || count <= 1) return baseAmount;
  if (pricingModel === "multiplier") {
    return baseAmount * count;
  }
  // Standard ATO group add-on: base $3,850 + $550 per additional entity in group
  return baseAmount + (count - 1) * 550;
}

function getServiceDisplayName(s: EngagementDraftService): string {
  if (s.name === "Company Tax Return" && s.companyMode === "multiple" && (s.companyCount || 1) > 1) {
    return `Company Tax Return (${s.companyCount} Companies)`;
  }
  return s.name;
}

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
      services: relevantFees.map(f => {
        const isCompanyTax = f.service === "Company Tax Return";
        return {
          name: f.service,
          fee: f.amount,
          freq: f.frequency,
          gst: f.gst,
          scope: isCompanyTax ? "Single entity — Turnover < $5M" : "",
          feeOverride: "",
          companyMode: isCompanyTax ? ("single" as const) : undefined,
          companyCount: isCompanyTax ? 1 : undefined,
          companyNames: isCompanyTax ? [c.name] : undefined,
          pricingModel: isCompanyTax ? ("group_addon" as const) : undefined,
        };
      }),
    }));
  };

  const toggleService = (svcName: string) => {
    setDraft(d => {
      const exists = d.services.find(s => s.name === svcName);
      if (exists) return { ...d, services: d.services.filter(s => s.name !== svcName) };
      const fee = INITIAL_FEES.find(f => f.service === svcName);
      const isCompanyTax = svcName === "Company Tax Return";
      return {
        ...d,
        services: [
          ...d.services,
          {
            name: svcName,
            fee: fee?.amount ?? 0,
            freq: fee?.frequency ?? "Annual",
            gst: fee?.gst ?? true,
            scope: isCompanyTax ? "Single entity — Turnover < $5M" : (fee?.notes ?? ""),
            feeOverride: "",
            companyMode: isCompanyTax ? ("single" as const) : undefined,
            companyCount: isCompanyTax ? 1 : undefined,
            companyNames: isCompanyTax ? [d.clientName || "Company 1"] : undefined,
            pricingModel: isCompanyTax ? ("group_addon" as const) : undefined,
          },
        ],
      };
    });
  };

  const totalFeeNote = () => {
    const annualised = draft.services.reduce((sum, s) => {
      const amt = (s.feeOverride && !isNaN(parseFloat(s.feeOverride))) ? parseFloat(s.feeOverride) : s.fee;
      if (s.freq === "Annual") return sum + amt;
      if (s.freq === "Monthly") return sum + amt * 12;
      if (s.freq === "Quarterly") return sum + amt * 4;
      return sum + amt;
    }, 0);
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(annualised) + " pa (excl. GST)";
  };

  const issueDate = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  const handleIssue = async () => {
    const serviceLabel = draft.services.map(s => getServiceDisplayName(s)).join(" + ");
    const totalAnnual = draft.services.reduce((sum, s) => {
      const amt = (s.feeOverride && !isNaN(parseFloat(s.feeOverride))) ? parseFloat(s.feeOverride) : s.fee;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-[680px] max-h-[min(90vh,780px)] rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col my-auto">
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
                              <span className="text-[13px] font-semibold text-foreground">{selected ? getServiceDisplayName(selected) : fee.service}</span>
                              <span className="text-[11px] font-semibold text-[#2855A6]">{selected ? fmtFee(selected.fee, selected.freq) : fmtFee(fee.amount, fee.frequency)}</span>
                              {fee.gst && <span className="text-[10px] text-muted-foreground">+ GST</span>}
                            </div>
                            {fee.notes && <div className="text-[11px] text-muted-foreground mt-0.5">{fee.notes}</div>}
                          </div>
                        </div>
                        {selected && (
                          <div className="px-4 pb-3 pt-0 border-t border-[#2855A6]/10 space-y-3 mt-0">
                            {/* Special Single vs Multiple Companies Option for Company Tax Return */}
                            {fee.service === "Company Tax Return" && (
                              <div className="pt-2.5 space-y-3">
                                <div>
                                  <label className="text-[11px] font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                                    Entity Structure Option
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDraft(d => ({
                                          ...d,
                                          services: d.services.map(s => {
                                            if (s.name !== fee.service) return s;
                                            return {
                                              ...s,
                                              companyMode: "single",
                                              companyCount: 1,
                                              fee: fee.amount,
                                              scope: s.scope && !s.scope.includes("group companies") ? s.scope : "Single entity — Turnover < $5M",
                                            };
                                          }),
                                        }));
                                      }}
                                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                                        (!selected.companyMode || selected.companyMode === "single")
                                          ? "border-[#2855A6] bg-[#2855A6]/5 ring-1 ring-[#2855A6]"
                                          : "border-border bg-white hover:bg-muted/40"
                                      }`}
                                    >
                                      <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                        (!selected.companyMode || selected.companyMode === "single")
                                          ? "border-[#2855A6] bg-[#2855A6]"
                                          : "border-gray-300 bg-white"
                                      }`}>
                                        {(!selected.companyMode || selected.companyMode === "single") && (
                                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="text-[12px] font-semibold text-foreground">Single Company</div>
                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                          1 standalone company · standard base fee ({fmtFee(fee.amount, fee.frequency)})
                                        </div>
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const count = selected.companyCount && selected.companyCount > 1 ? selected.companyCount : 2;
                                        const pricingModel = selected.pricingModel || "group_addon";
                                        const newFee = computeCompanyTaxFee(fee.amount, "multiple", count, pricingModel);
                                        const initialNames = (selected.companyNames && selected.companyNames.length >= count)
                                          ? selected.companyNames
                                          : [draft.clientName || "Company 1", ...Array.from({ length: count - 1 }, (_, i) => `Group Entity ${i + 2} Pty Ltd`)];
                                        setDraft(d => ({
                                          ...d,
                                          services: d.services.map(s => {
                                            if (s.name !== fee.service) return s;
                                            return {
                                              ...s,
                                              companyMode: "multiple",
                                              companyCount: count,
                                              companyNames: initialNames,
                                              pricingModel,
                                              fee: newFee,
                                              scope: `Includes ${count} group companies: ${initialNames.filter(Boolean).join(", ")}`,
                                            };
                                          }),
                                        }));
                                      }}
                                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                                        selected.companyMode === "multiple"
                                          ? "border-[#2855A6] bg-[#2855A6]/5 ring-1 ring-[#2855A6]"
                                          : "border-border bg-white hover:bg-muted/40"
                                      }`}
                                    >
                                      <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                        selected.companyMode === "multiple"
                                          ? "border-[#2855A6] bg-[#2855A6]"
                                          : "border-gray-300 bg-white"
                                      }`}>
                                        {selected.companyMode === "multiple" && (
                                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
                                          <span>Multiple Companies</span>
                                          <span className="px-1.5 py-0.2 bg-[#FEF6E9] text-[#B87A1A] border border-[#F5A623]/30 rounded text-[9px] font-bold uppercase">
                                            Group
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                          Corporate group · 2+ entities (from $4,400 pa)
                                        </div>
                                      </div>
                                    </button>
                                  </div>
                                </div>

                                {selected.companyMode === "multiple" && (
                                  <div className="p-3 bg-white rounded-lg border border-[#2855A6]/20 space-y-3">
                                    {/* Count Selector & Quick Chips */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div>
                                        <label className="text-[11px] font-semibold text-foreground block">
                                          Number of Companies in Group
                                        </label>
                                        <span className="text-[10px] text-muted-foreground">Select total entities to include</span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center border border-border rounded bg-[#F5F5F5] overflow-hidden">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newCount = Math.max(2, (selected.companyCount || 2) - 1);
                                              const pricingModel = selected.pricingModel || "group_addon";
                                              const newFee = computeCompanyTaxFee(fee.amount, "multiple", newCount, pricingModel);
                                              const names = (selected.companyNames || []).slice(0, newCount);
                                              setDraft(d => ({
                                                ...d,
                                                services: d.services.map(s => {
                                                  if (s.name !== fee.service) return s;
                                                  return {
                                                    ...s,
                                                    companyCount: newCount,
                                                    companyNames: names,
                                                    fee: newFee,
                                                    scope: `Includes ${newCount} group companies: ${names.filter(Boolean).join(", ")}`,
                                                  };
                                                }),
                                              }));
                                            }}
                                            disabled={(selected.companyCount || 2) <= 2}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-muted disabled:opacity-30 text-foreground transition-colors"
                                          >
                                            <Minus size={13} />
                                          </button>
                                          <span className="w-8 text-center text-[12px] font-bold text-foreground">
                                            {selected.companyCount || 2}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newCount = Math.min(20, (selected.companyCount || 2) + 1);
                                              const pricingModel = selected.pricingModel || "group_addon";
                                              const newFee = computeCompanyTaxFee(fee.amount, "multiple", newCount, pricingModel);
                                              const names = [...(selected.companyNames || [])];
                                              while (names.length < newCount) {
                                                names.push(`Group Entity ${names.length + 1} Pty Ltd`);
                                              }
                                              setDraft(d => ({
                                                ...d,
                                                services: d.services.map(s => {
                                                  if (s.name !== fee.service) return s;
                                                  return {
                                                    ...s,
                                                    companyCount: newCount,
                                                    companyNames: names,
                                                    fee: newFee,
                                                    scope: `Includes ${newCount} group companies: ${names.filter(Boolean).join(", ")}`,
                                                  };
                                                }),
                                              }));
                                            }}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-muted text-foreground transition-colors"
                                          >
                                            <Plus size={13} />
                                          </button>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          {[2, 3, 4, 5].map(cnt => (
                                            <button
                                              key={cnt}
                                              type="button"
                                              onClick={() => {
                                                const pricingModel = selected.pricingModel || "group_addon";
                                                const newFee = computeCompanyTaxFee(fee.amount, "multiple", cnt, pricingModel);
                                                const names = [...(selected.companyNames || [])].slice(0, cnt);
                                                while (names.length < cnt) {
                                                  names.push(`Group Entity ${names.length + 1} Pty Ltd`);
                                                }
                                                setDraft(d => ({
                                                  ...d,
                                                  services: d.services.map(s => {
                                                    if (s.name !== fee.service) return s;
                                                    return {
                                                      ...s,
                                                      companyCount: cnt,
                                                      companyNames: names,
                                                      fee: newFee,
                                                      scope: `Includes ${cnt} group companies: ${names.filter(Boolean).join(", ")}`,
                                                    };
                                                  }),
                                                }));
                                              }}
                                              className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                                                (selected.companyCount || 2) === cnt
                                                  ? "bg-[#2855A6] text-white"
                                                  : "bg-[#F5F5F5] hover:bg-muted text-muted-foreground"
                                              }`}
                                            >
                                              {cnt} Co
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Pricing Formula */}
                                    <div>
                                      <label className="text-[11px] font-semibold text-foreground block mb-1.5">
                                        Pricing Calculation Method
                                      </label>
                                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <label className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-all ${
                                          (!selected.pricingModel || selected.pricingModel === "group_addon")
                                            ? "border-[#2855A6] bg-[#EEF2FA]/50"
                                            : "border-border bg-white"
                                        }`}>
                                          <input
                                            type="radio"
                                            name="pricingModel"
                                            checked={!selected.pricingModel || selected.pricingModel === "group_addon"}
                                            onChange={() => {
                                              const count = selected.companyCount || 2;
                                              const newFee = computeCompanyTaxFee(fee.amount, "multiple", count, "group_addon");
                                              setDraft(d => ({
                                                ...d,
                                                services: d.services.map(s => s.name === fee.service ? { ...s, pricingModel: "group_addon", fee: newFee } : s),
                                              }));
                                            }}
                                            className="mt-0.5 accent-[#2855A6]"
                                          />
                                          <div>
                                            <span className="font-semibold text-foreground block">Group Add-on Rate</span>
                                            <span className="text-muted-foreground text-[10px]">
                                              $3,850 base + $550/extra entity
                                            </span>
                                            <div className="font-bold text-[#2855A6] mt-0.5">
                                              ${(3850 + ((selected.companyCount || 2) - 1) * 550).toLocaleString("en-AU")} pa
                                            </div>
                                          </div>
                                        </label>

                                        <label className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-all ${
                                          selected.pricingModel === "multiplier"
                                            ? "border-[#2855A6] bg-[#EEF2FA]/50"
                                            : "border-border bg-white"
                                        }`}>
                                          <input
                                            type="radio"
                                            name="pricingModel"
                                            checked={selected.pricingModel === "multiplier"}
                                            onChange={() => {
                                              const count = selected.companyCount || 2;
                                              const newFee = computeCompanyTaxFee(fee.amount, "multiple", count, "multiplier");
                                              setDraft(d => ({
                                                ...d,
                                                services: d.services.map(s => s.name === fee.service ? { ...s, pricingModel: "multiplier", fee: newFee } : s),
                                              }));
                                            }}
                                            className="mt-0.5 accent-[#2855A6]"
                                          />
                                          <div>
                                            <span className="font-semibold text-foreground block">Full Entity Rate</span>
                                            <span className="text-muted-foreground text-[10px]">
                                              $3,850 × {selected.companyCount || 2} entities
                                            </span>
                                            <div className="font-bold text-[#2855A6] mt-0.5">
                                              ${(3850 * (selected.companyCount || 2)).toLocaleString("en-AU")} pa
                                            </div>
                                          </div>
                                        </label>
                                      </div>
                                    </div>

                                    {/* Company Entity Names */}
                                    <div>
                                      <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[11px] font-semibold text-foreground">
                                          Group Company Names ({selected.companyCount || 2})
                                        </label>
                                        <span className="text-[10px] text-muted-foreground">Appears in Engagement Letter</span>
                                      </div>
                                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                        {Array.from({ length: selected.companyCount || 2 }).map((_, idx) => {
                                          const currentName = (selected.companyNames && selected.companyNames[idx]) || "";
                                          return (
                                            <div key={idx} className="flex items-center gap-2">
                                              <span className="text-[10px] font-mono font-semibold text-muted-foreground w-12 shrink-0">
                                                {idx === 0 ? "Holding" : `Co ${idx + 1}`}:
                                              </span>
                                              <input
                                                type="text"
                                                value={currentName}
                                                placeholder={idx === 0 ? (draft.clientName || "Parent Company Pty Ltd") : `Subsidiary ${idx + 1} Pty Ltd`}
                                                onChange={e => {
                                                  const updated = [...(selected.companyNames || [])];
                                                  while (updated.length <= idx) updated.push("");
                                                  updated[idx] = e.target.value;
                                                  setDraft(d => ({
                                                    ...d,
                                                    services: d.services.map(s => {
                                                      if (s.name !== fee.service) return s;
                                                      return {
                                                        ...s,
                                                        companyNames: updated,
                                                        scope: `Includes ${s.companyCount || 2} group companies: ${updated.filter(Boolean).join(", ")}`,
                                                      };
                                                    }),
                                                  }));
                                                }}
                                                className="flex-1 px-2.5 py-1 text-[11px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]/30 focus:border-[#2855A6]"
                                              />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Calculation Summary Pill */}
                                    <div className="p-2 bg-[#EEF2FA] rounded border border-[#2855A6]/20 flex items-center justify-between text-[11px]">
                                      <span className="text-[#2855A6] font-medium">
                                        {selected.pricingModel === "multiplier"
                                          ? `${selected.companyCount || 2} companies × $3,850 base`
                                          : `$3,850 (Base) + ${((selected.companyCount || 2) - 1)} × $550 (Add-on)`}
                                      </span>
                                      <span className="font-bold text-[#2855A6]">
                                        = ${computeCompanyTaxFee(fee.amount, "multiple", selected.companyCount || 2, selected.pricingModel || "group_addon").toLocaleString("en-AU")} pa (excl. GST)
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Standard Fee Override and Scope inputs */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                              <div>
                                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Fee override (blank = standard)</label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">$</span>
                                  <input
                                    type="number"
                                    value={selected.feeOverride}
                                    onChange={e => setDraft(d => ({ ...d, services: d.services.map(s => s.name === fee.service ? { ...s, feeOverride: e.target.value } : s) }))}
                                    placeholder={selected.fee.toString()}
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
                                  placeholder={fee.service === "Company Tax Return" && selected.companyMode === "multiple" ? "Group companies scope" : "e.g. includes 1 rental property"}
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
                              <td className="px-4 py-2.5 font-medium">
                                <div>{getServiceDisplayName(s)}</div>
                                {s.companyMode === "multiple" && s.companyNames && s.companyNames.filter(Boolean).length > 0 && (
                                  <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                    <span className="font-medium text-[#2855A6]">Group Entities ({s.companyCount || 2}):</span>{" "}
                                    {s.companyNames.filter(Boolean).join(", ")}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground">{s.scope || INITIAL_FEES.find(f => f.service === s.name)?.notes || "Standard scope"}</td>
                              <td className="px-4 py-2.5 text-right font-semibold">
                                {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format((s.feeOverride && !isNaN(parseFloat(s.feeOverride))) ? parseFloat(s.feeOverride) : s.fee)}
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
  const [viewingDoc, setViewingDoc] = useState<{ name: string; verified: boolean; source: string; date: string } | null>(null);

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
              <div className="px-4 py-2 border-b border-border bg-[#FAFAFA]">
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
                  <div key={item.label} className="flex items-center gap-4 px-4 py-2.5">
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
              <div className="px-4 py-2 border-b border-border bg-[#FAFAFA] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-foreground">Linked onboarding case</span>
              </div>
              <div className="px-4 py-3 text-[12px] text-muted-foreground">
                This engagement was created from an onboarding case. Historical case records are preserved in the system vault.
              </div>
            </div>
          </div>
        )}

        {tab === "Services" && (
          <div className="max-w-[760px] space-y-4">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-[#FAFAFA] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-foreground">Included services</span>
                <span className="text-[11px] text-muted-foreground">Scope as agreed in letter of engagement</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { name: currentEng.service, fee: currentEng.fee, frequency: "Annual", status: "Active" },
                ].map((svc, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#EEF2FA] flex items-center justify-center shrink-0">
                      <FileText size={13} className="text-[#2855A6]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] font-semibold text-foreground">{svc.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{svc.frequency} engagement · {svc.fee}</div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E8F7EB] text-[#1E7A31]">{svc.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-[#FAFAFA]">
                <span className="text-[12px] font-semibold text-foreground">Fee schedule</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: "Agreed annual fee", value: currentEng.fee },
                  { label: "Billing frequency", value: "Annual — invoiced on renewal" },
                  { label: "Payment method", value: "Direct debit via Square" },
                  { label: "GST", value: "Included" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center px-4 py-2.5">
                    <span className="text-[12px] text-muted-foreground w-[220px] shrink-0">{label}</span>
                    <span className="text-[12px] font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-[#FAFAFA] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-foreground">Out-of-scope work ({variations.length})</span>
                <button
                  onClick={() => setShowAddVariation(true)}
                  className="text-[11px] text-[#2855A6] font-semibold hover:underline"
                >
                  + Add variation
                </button>
              </div>
              {variations.length === 0 ? (
                <div className="px-4 py-4 text-center text-[12px] text-muted-foreground">
                  No out-of-scope variations recorded for this engagement.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {variations.map((v, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center justify-between text-[12px]">
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
                  <div
                    key={i}
                    onClick={() => setViewingDoc({ name: doc.name, verified: !!doc.signed, source: "Engagement Vault", date: doc.date })}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded bg-[#EEF2FA] group-hover:bg-[#2855A6]/10 flex items-center justify-center shrink-0 transition-colors">
                      <FileText size={15} className="text-[#2855A6]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] font-semibold text-foreground group-hover:text-[#2855A6] transition-colors">{doc.name}</div>
                      <div className="text-[11px] text-muted-foreground">{doc.type} · {doc.date}</div>
                    </div>
                    {doc.signed
                      ? <span className="text-[11px] font-semibold text-[#2EA843] bg-[#E8F7EB] px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle size={11} /> Signed</span>
                      : <span className="text-[11px] font-semibold text-[#F5A623] bg-[#FEF6E9] px-2 py-0.5 rounded">Awaiting signature</span>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingDoc({ name: doc.name, verified: !!doc.signed, source: "Engagement Vault", date: doc.date });
                      }}
                      className="px-2.5 py-1 bg-[#EEF2FA] text-[#2855A6] text-[11.5px] font-semibold rounded hover:bg-[#2855A6]/20 transition-colors flex items-center gap-1"
                      title="View Document"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showToast(`Downloading ${doc.name}...`);
                      }}
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

      {viewingDoc && (
        <DocumentViewerModal
          doc={viewingDoc}
          clientName={currentEng.client}
          entityName={currentEng.client}
          onClose={() => setViewingDoc(null)}
        />
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
  const [viewingDoc, setViewingDoc] = useState<{ name: string; verified: boolean; source: string; date: string } | null>(null);
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
              <div
                onClick={() => setViewingDoc({ name: `Letter of Engagement (${currentEng.id})`, verified: true, source: "EnTIQ eSign Vault", date: currentEng.signed || "20 Jul 2026" })}
                className="border border-border rounded-lg p-3 flex items-center justify-between text-[12px] bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#EEF2FA] group-hover:bg-[#2855A6]/10 flex items-center justify-center text-[#2855A6] transition-colors">
                    <FileText size={15} />
                  </div>
                  <span className="font-medium text-foreground group-hover:text-[#2855A6] transition-colors">Letter of Engagement ({currentEng.id}.pdf)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-semibold text-[#1E7A31] bg-[#E8F7EB] px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle size={11} /> eSigned
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingDoc({ name: `Letter of Engagement (${currentEng.id})`, verified: true, source: "EnTIQ eSign Vault", date: currentEng.signed || "20 Jul 2026" });
                    }}
                    className="px-2.5 py-1 bg-[#EEF2FA] text-[#2855A6] text-[11.5px] font-semibold rounded hover:bg-[#2855A6]/20 transition-colors flex items-center gap-1"
                    title="View Document"
                  >
                    <Eye size={12} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showToast("Downloading document...");
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Download"
                  >
                    <Download size={13} />
                  </button>
                </div>
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

      {viewingDoc && (
        <DocumentViewerModal
          doc={viewingDoc}
          clientName={currentEng.client}
          entityName={currentEng.client}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
}

function EditEngagementModal({
  eng,
  onClose,
  onSaved,
}: {
  eng: EngagementRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [client, setClient] = useState(eng.client);
  const [service, setService] = useState(eng.service);
  const [fee, setFee] = useState(eng.fee);
  const [status, setStatus] = useState(eng.status);
  const [renewalDue, setRenewalDue] = useState(eng.renewalDue || "");
  const [adviser, setAdviser] = useState(eng.adviser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!client.trim() || !service.trim()) {
      setError("Client name and service title are required");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await engagementsApi.update(eng.id, {
        client: client.trim(),
        service: service.trim(),
        fee: fee.trim(),
        status,
        renewal_due: renewalDue.trim(),
        adviser,
      });

      await activityApi.log({
        time: "Just now",
        actor: adviser,
        action: "Updated engagement details",
        target: `${eng.id} · ${client.trim()}`,
        type: "proposal",
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update engagement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card w-[520px] max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">Edit Engagement</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Modify contract details for <span className="font-mono text-[#2855A6] font-semibold">{eng.id}</span></p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><XCircle size={18} /></button>
        </div>

        {error && (
          <div className="p-2.5 bg-[#FCE8EB] border border-[#D0021B]/30 rounded text-[12px] text-[#D0021B]">
            {error}
          </div>
        )}

        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block font-medium text-foreground mb-1">Client Name *</label>
            <input
              value={client}
              onChange={e => setClient(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Service Title *</label>
            <input
              value={service}
              onChange={e => setService(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
            />
          </div>

          {service.toLowerCase().includes("company") && (
            <div className="p-3 bg-[#EEF2FA]/60 border border-[#2855A6]/20 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#2855A6] flex items-center gap-1.5">
                  <Building2 size={13} />
                  Company Tax Return Structure
                </span>
                <span className="text-[10px] text-muted-foreground">Click below to auto-calculate</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setService("Company Tax Return");
                    setFee("$3,850 pa");
                  }}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                    service === "Company Tax Return"
                      ? "bg-[#2855A6] text-white border-[#2855A6]"
                      : "bg-white text-[#2855A6] border-[#2855A6]/30 hover:bg-[#EEF2FA]"
                  }`}
                >
                  Single Company ($3,850 pa)
                </button>
                {[2, 3, 4, 5].map(cnt => {
                  const targetTitle = `Company Tax Return (${cnt} Companies)`;
                  const calcFee = 3850 + (cnt - 1) * 550;
                  const isSelected = service.includes(`${cnt} Companies`);
                  return (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        setService(targetTitle);
                        setFee(`$${calcFee.toLocaleString("en-AU")} pa`);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                        isSelected
                          ? "bg-[#2855A6] text-white border-[#2855A6]"
                          : "bg-white text-[#2855A6] border-[#2855A6]/30 hover:bg-[#EEF2FA]"
                      }`}
                    >
                      {cnt} Companies (${calcFee.toLocaleString("en-AU")})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">Annual Fee</label>
              <input
                value={fee}
                onChange={e => setFee(e.target.value)}
                placeholder="e.g. $4,500 pa"
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              >
                <option value="Active">Active</option>
                <option value="Renewal due">Renewal due</option>
                <option value="Proposal issued">Proposal issued</option>
                <option value="Review needed">Review needed</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">Renewal Due Date</label>
              <input
                value={renewalDue}
                onChange={e => setRenewalDue(e.target.value)}
                placeholder="e.g. 15 Aug 2025"
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">Assigned Adviser</label>
              <select
                value={adviser}
                onChange={e => setAdviser(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              >
                <option value="J. Okafor">J. Okafor</option>
                <option value="S. Patel">S. Patel</option>
                <option value="A. Brennan">A. Brennan</option>
                <option value="M. Chen">M. Chen</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
          <button
            disabled={isSubmitting || !client.trim() || !service.trim()}
            onClick={handleSave}
            className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteEngagementModal({
  eng,
  onClose,
  onDeleted,
}: {
  eng: EngagementRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await engagementsApi.delete(eng.id);
      await activityApi.log({
        time: "Just now",
        actor: eng.adviser,
        action: "Deleted engagement",
        target: `${eng.id} · ${eng.client}`,
        type: "reject",
      });
      onDeleted();
      onClose();
    } catch {
      onDeleted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card w-[440px] rounded-xl p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FCE8EB] text-[#D0021B] flex items-center justify-center shrink-0">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Delete Engagement?</h3>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
              Are you sure you want to delete engagement <span className="font-mono text-[11px] font-semibold text-foreground">{eng.id}</span> ({eng.service}) for <strong>{eng.client}</strong>? This contract will be removed.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 bg-[#D0021B] text-white text-[13px] font-semibold rounded hover:bg-[#B00216] disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {isDeleting ? "Deleting…" : "Delete Engagement"}
          </button>
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
  const [editingEngagement, setEditingEngagement] = useState<EngagementRow | null>(null);
  const [deletingEngagement, setDeletingEngagement] = useState<EngagementRow | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

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
      {editingEngagement && (
        <EditEngagementModal
          eng={editingEngagement}
          onClose={() => setEditingEngagement(null)}
          onSaved={() => { refetch(); }}
        />
      )}
      {deletingEngagement && (
        <DeleteEngagementModal
          eng={deletingEngagement}
          onClose={() => setDeletingEngagement(null)}
          onDeleted={() => { refetch(); }}
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
        <div className="flex items-center gap-1.5">
          {["All", "Active", "Renewal due", "Proposal issued", "Terminated"].map(v => (
            <button
              key={v}
              onClick={() => { setStatusFilter(v); setCurrentPage(1); }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${statusFilter === v ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {v}
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => setShowNewEngagement(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#2855A6] text-white text-[11.5px] font-semibold rounded hover:bg-[#1F4491] transition-colors"
          >
            <Plus size={13} />
            New engagement
          </button>
        </div>
      }
    >
      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Active engagements", value: loading ? "—" : allEngagements.filter(e => e.status === "Active").length, color: "text-[#2EA843]" },
          { label: "Renewal due within 60d", value: allEngagements.filter(e => e.status === "Renewal due").length, color: "text-[#F5A623]" },
          { label: "Pending signature", value: allEngagements.filter(e => e.status === "Proposal issued").length, color: "text-[#2855A6]" },
          { label: "Annual fee (active)", value: "$26.1k", color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg px-2.5 py-1.5">
            <div className="text-[9.5px] text-muted-foreground mb-0.5">{s.label}</div>
            <div className={`text-[15px] font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search client or engagement…"
            className="pl-7 pr-2.5 py-1 text-[11.5px] bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] w-[220px] transition-all"
          />
        </div>
        <div className="flex-1" />
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
        >
          <Download size={11} />Export
        </button>
      </div>

      {error && <ApiErrorBanner message={error} onRetry={refetch} />}
      {loading ? <TableSkeleton rows={7} cols={9} /> : (
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-[11px] min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-[#FAFAFA]">
              {["Engagement ID", "Client", "Service", "Annual fee", "Signed", "Renewal due", "Status", "Adviser", "Actions"].map((h, idx) => (
                <th key={h} className={`${idx === 8 ? "text-right pr-3" : "text-left"} px-2.5 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedEngagements.map((e, i) => (
              <tr key={e.id} onClick={() => setSelectedEngagement(e)} className={`border-b border-border last:border-0 hover:bg-[#F8FAFF] cursor-pointer transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}>
                <td className="px-2.5 py-1.5 whitespace-nowrap"><span className="font-mono text-[10.5px] text-[#2855A6] font-semibold">{e.id}</span></td>
                <td className="px-2.5 py-1.5 font-medium text-foreground max-w-[140px] truncate text-[11px]">{e.client}</td>
                <td className="px-2.5 py-1.5 text-muted-foreground max-w-[140px] truncate text-[10.5px]">{e.service}</td>
                <td className="px-2.5 py-1.5 font-semibold text-foreground text-[10.5px]">{e.fee}</td>
                <td className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{e.signed || "—"}</td>
                <td className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{e.renewalDue || "—"}</td>
                <td className="px-2.5 py-1.5 whitespace-nowrap">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${engStatusColor(e.status)}`}>{e.status}</span>
                </td>
                <td className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{e.adviser}</td>
                <td className="px-2.5 py-1.5 text-right relative pr-3" onClick={ev => ev.stopPropagation()}>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setOpenMenuId(openMenuId === e.id ? null : e.id);
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center justify-center"
                    title="Actions"
                  >
                    <MoreHorizontal size={13} />
                  </button>

                  {openMenuId === e.id && (
                    <div
                      onClick={ev => ev.stopPropagation()}
                      className="absolute right-3 top-7 w-36 bg-card border border-border rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 text-left"
                    >
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setSelectedEngagement(e);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-foreground hover:bg-[#EEF2FA] hover:text-[#2855A6] transition-colors"
                      >
                        <Eye size={12} className="text-[#2855A6]" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setEditingEngagement(e);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-foreground hover:bg-[#FEF6E9] hover:text-[#B87A1A] transition-colors"
                      >
                        <Pencil size={12} className="text-[#F5A623]" />
                        <span>Edit</span>
                      </button>
                      <div className="my-0.5 border-t border-border" />
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setDeletingEngagement(e);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[#D0021B] hover:bg-[#FCE8EB] transition-colors"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-8 text-center text-[12px] text-muted-foreground">
            No engagements match your criteria.
          </div>
        )}

        <div className="px-3 py-1.5 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{filtered.length} engagement{filtered.length !== 1 ? "s" : ""} shown</span>
          <div className="flex items-center gap-2.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="hover:text-foreground disabled:opacity-40 font-medium"
            >
              Previous
            </button>
            <span className="px-1.5 py-0.5 bg-[#EEF2FA] text-[#2855A6] rounded font-semibold">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="hover:text-foreground disabled:opacity-40 font-medium"
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

function formatRelativeTime(createdAt?: string, fallbackTime?: string): string {
  if (!createdAt) return fallbackTime || "Just now";
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return fallbackTime || "Just now";

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 120) return "Just now";
  if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))}m ago`;

  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) return `Today, ${timeStr}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return `Yesterday, ${timeStr}`;

  const dayStr = date.toLocaleDateString([], { day: "numeric", month: "short" });
  if (date.getFullYear() === now.getFullYear()) {
    return `${dayStr}, ${timeStr}`;
  }
  return `${dayStr} ${date.getFullYear()}, ${timeStr}`;
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

  const todayEvents = rawEvents.filter(ev => {
    if (ev.createdAt) {
      const d = new Date(ev.createdAt);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    return typeof ev.time === "string" && (
      ev.time.startsWith("Today") ||
      ev.time === "Just now" ||
      ev.time.endsWith("m ago") ||
      ev.time.endsWith("s ago")
    );
  });

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
      <div className="flex gap-3 items-start">
        {/* Main feed */}
        <div className="flex-1 space-y-2.5">
          {/* Filter bar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setQuickFilter(null); }}
                className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${filter === f && !quickFilter ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {f}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
            >
              <Download size={11} />Export audit log
            </button>
          </div>

          {error && <ApiErrorBanner message={error} onRetry={refetch} />}

          {/* Timeline */}
          {loading ? <TableSkeleton rows={8} cols={3} /> : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {events.map((ev, i) => (
              <div key={ev.id} className={`flex gap-2.5 px-3 py-2 ${i < events.length - 1 ? "border-b border-border" : ""} hover:bg-[#F8FAFF] transition-colors`}>
                <div className="flex flex-col items-center gap-0.5 pt-1">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${activityDot(ev.type)}`} />
                  {i < events.length - 1 && <div className="w-px flex-1 bg-border min-h-[14px]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="text-[11.5px] font-semibold text-foreground">{ev.action}</span>
                    <span className="text-[10px] text-muted-foreground">by {ev.actor}</span>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground leading-tight">{ev.target}</p>
                </div>
                <div className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">{formatRelativeTime(ev.createdAt, ev.time)}</div>
              </div>
            ))}

            {events.length === 0 && (
              <div className="py-8 text-center text-[12px] text-muted-foreground">
                No activity logs match your filter criteria.
              </div>
            )}
          </div>
          )}
        </div>

        {/* Right summary */}
        <div className="w-[210px] space-y-2 shrink-0">
          <div className="bg-card border border-border rounded-lg p-2.5">
            <h3 className="text-[11px] font-semibold text-foreground mb-1.5">Today at a glance</h3>
            <div className="space-y-1">
              {[
                { label: "Events recorded today", value: todayEvents.length },
                { label: "Cases updated today", value: todayEvents.filter(e => e.type === "accept" || e.type === "submit").length },
                { label: "Documents received today", value: todayEvents.filter(e => e.type === "upload").length },
                { label: "Exceptions raised today", value: todayEvents.filter(e => e.type === "exception").length },
                { label: "Total audit events", value: rawEvents.length },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  <span className="text-[10.5px] font-semibold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-2.5">
            <h3 className="text-[11px] font-semibold text-foreground mb-1.5">Quick filters</h3>
            <div className="space-y-0.5">
              {["Accepted this week", "Exceptions unresolved", "Proposals overdue", "Identity failures"].map(f => (
                <button
                  key={f}
                  onClick={() => setQuickFilter(f)}
                  className={`w-full text-left px-2 py-0.5 text-[10.5px] rounded transition-colors ${quickFilter === f ? "bg-[#EEF2FA] text-[#2855A6] font-semibold" : "text-[#2855A6] hover:bg-[#EEF2FA]"}`}
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

  const { data: page, loading, error, refetch } = useApiData(
    () => templatesApi.list({ search: search || undefined, type: typeFilter || undefined }),
    [search, typeFilter]
  );
  const allTemplates = [...(page?.items ?? TEMPLATE_ROWS), ...localNew];

  if (builderTemplate) {
    return <DocumentBuilderScreen templateName={builderTemplate.name} templateType={builderTemplate.type} onBack={() => setBuilderTemplate(null)} />;
  }

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
      <div className="flex gap-3">
        {/* Left: type nav */}
        <div className="w-[170px] shrink-0">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-1.5 border-b border-border">
              <span className="text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider">Template type</span>
            </div>
            {["All templates", "Engagement", "Questionnaire", "Consent notice", "Service catalogue"].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t === "All templates" ? "" : t)}
                className={`w-full text-left px-3 py-1.5 text-[11.5px] border-b border-border last:border-0 transition-colors ${(t === "All templates" && !typeFilter) || typeFilter === t ? "bg-[#EEF2FA] text-[#2855A6] font-semibold" : "text-muted-foreground hover:bg-[#F5F5F5]"}`}
              >{t}</button>
            ))}
          </div>
        </div>

        {/* Right: template list */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…" className="pl-7 pr-2.5 py-1 text-[11.5px] bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] w-[200px] transition-all" />
            </div>
            <div className="flex-1" />
            <span className="text-[11px] text-muted-foreground">{loading ? "Loading…" : `${filtered.length} templates`}</span>
          </div>

          {error && <ApiErrorBanner message={error} onRetry={refetch} />}
          {loading ? <TableSkeleton rows={10} cols={9} /> : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-[#FAFAFA]">
                  {["ID", "Name", "Type", "Service", "Version", "Status", "Last updated", "Author", ""].map(h => (
                    <th key={h} className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
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
                    <td className="px-2.5 py-1.5 whitespace-nowrap"><span className="font-mono text-[10.5px] text-[#2855A6] font-semibold">{t.id}</span></td>
                    <td className="px-2.5 py-1.5 font-medium text-foreground max-w-[180px] truncate text-[11px]">{t.name}</td>
                    <td className="px-2.5 py-1.5 text-muted-foreground text-[10.5px]">{t.type}</td>
                    <td className="px-2.5 py-1.5 text-muted-foreground text-[10.5px]">{t.service}</td>
                    <td className="px-2.5 py-1.5 font-mono text-[10.5px] text-muted-foreground whitespace-nowrap">{t.version}</td>
                    <td className="px-2.5 py-1.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${tplStatusColor(t.status)}`}>{t.status}</span>
                    </td>
                    <td className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{t.updated}</td>
                    <td className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap text-[10.5px]">{t.author}</td>
                    <td className="px-2.5 py-1.5 text-right pr-2">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setBuilderTemplate({ name: t.name, type: t.type })} className="px-1.5 py-0.5 rounded text-muted-foreground hover:text-[#2855A6] hover:bg-[#EEF2FA] transition-colors text-[10px] font-semibold">Open</button>
                        <button className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><MoreHorizontal size={13} /></button>
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
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [fullEngagement, setFullEngagement] = useState<EngagementRow | null>(null);
  const [selectedGlobalCase, setSelectedGlobalCase] = useState<OnboardingCase | null>(null);

  const navContextValue: NavigationContextType = {
    activeNav,
    setActiveNav: (id) => {
      setActiveNav(id);
      if (id !== "engagements") setFullEngagement(null);
    },
    openNewInvitation: () => setShowModal(true),
    openApiKeyModal: () => setShowApiKeyModal(true),
    openCaseDetail: (caseItem) => setSelectedGlobalCase(caseItem),
  };

  const screenMap: Record<string, React.ReactNode> = {
    dashboard: <Dashboard onOpenApiKeyModal={() => setShowApiKeyModal(true)} />,
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
    <NavigationContext.Provider value={navContextValue}>
      <div className="flex h-screen w-full bg-background overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
        {showModal && <NewInvitationModal onClose={() => setShowModal(false)} />}
        {showApiKeyModal && <ApiKeyModal isOpen={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} />}
        {selectedGlobalCase && (
          <CaseDetailDrawer
            c={selectedGlobalCase}
            onClose={() => setSelectedGlobalCase(null)}
          />
        )}
        <Sidebar
          active={activeNav}
          setActive={(id) => { setActiveNav(id); if (id !== "engagements") setFullEngagement(null); }}
          onOpenApiKeyModal={() => setShowApiKeyModal(true)}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {screenMap[activeNav]}
        </div>
      </div>
    </NavigationContext.Provider>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

function AppShell() {
  const { isAuthenticated, isLoading } = useAuth();

  // Check if current URL is for public client onboarding
  const searchParams = new URLSearchParams(window.location.search);
  const isClientPortal =
    window.location.pathname.startsWith("/onboard") ||
    searchParams.has("id") ||
    searchParams.has("onboarding");

  if (isClientPortal) {
    const invId = searchParams.get("id") || searchParams.get("onboarding") || undefined;
    return <ClientOnboardingPortal invitationId={invId} />;
  }

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
