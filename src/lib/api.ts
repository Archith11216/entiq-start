import type {
  OnboardingCase,
  ReviewAlert,
  DashboardStats,
  Invitation,
  InvitationStats,
  ClientEntity,
  Engagement,
  ActivityEvent,
  Template,
  CreateInvitationPayload,
  AuthTokens,
  UserProfile,
  PaginatedResponse,
} from "../types/api";

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";
const API_PREFIX = "/api/v1";

// ─── Token storage ────────────────────────────────────────────────────────────

const TOKEN_KEY = "entiq_access_token";
const REFRESH_KEY = "entiq_refresh_token";

export const tokenStore = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (tokens: AuthTokens) => {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ─── Initial Seed Mock Data ───────────────────────────────────────────────────

const SEED_CASES: OnboardingCase[] = [
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

const SEED_ALERTS: ReviewAlert[] = [
  { id: "A-001", type: "identity", severity: "error", case: "C-2024-0889", message: "Entiq KYC: identity check flagged — document expired 14 July. Review result in Entiq KYC.", age: "3d" },
  { id: "A-002", type: "commercial", severity: "warning", case: "C-2024-0890", message: "Proposed fee 18% below recommended price — partner approval required", age: "1d" },
  { id: "A-003", type: "conflict", severity: "warning", case: "C-2024-0891", message: "Potential related-party match detected against existing client Harrington, T.", age: "5h" },
  { id: "A-004", type: "document", severity: "warning", case: "C-2024-0887", message: "Proposal unsigned — 7 days since issue, no client response", age: "7d" },
  { id: "A-005", type: "compliance", severity: "error", case: "C-2024-0889", message: "Trust deed date predates beneficiary relationship record by 4 years", age: "2d" },
];

const SEED_INVITATIONS: Invitation[] = [
  { id: "INV-2024-0120", client: "Manoj Kumar", email: "manoj@manojtech.com.au", service: "Company Tax + Advisory", channel: "Email", status: "Sent", sent: "Today", expires: "18 Sept", owner: "J. Okafor" },
  { id: "INV-2024-0112", client: "Nguyen, Thanh", email: "thanh.nguyen@email.com", service: "Individual Tax", channel: "Email", status: "Sent", sent: "28 Jul", expires: "11 Aug", owner: "S. Patel" },
  { id: "INV-2024-0111", client: "Riverside Developments Pty Ltd", email: "admin@riverside.com.au", service: "Company Tax + BAS", channel: "Email", status: "Opened", sent: "26 Jul", expires: "9 Aug", owner: "A. Brennan" },
  { id: "INV-2024-0110", client: "Morrison, Claire", email: "claire.m@outlook.com", service: "Individual Tax", channel: "SMS + Email", status: "Started", sent: "24 Jul", expires: "7 Aug", owner: "J. Okafor" },
  { id: "INV-2024-0109", client: "Sunfield Unit Trust", email: "trustee@sunfield.com.au", service: "Trust Tax", channel: "QR code", status: "Expired", sent: "10 Jul", expires: "24 Jul", owner: "S. Patel" },
  { id: "INV-2024-0108", client: "Park, Ji-Woo", email: "jwpark@gmail.com", service: "Individual Tax", channel: "Email", status: "Sent", sent: "28 Jul", expires: "11 Aug", owner: "A. Brennan" },
  { id: "INV-2024-0107", client: "Ashworth & Partners", email: "info@ashworth.net.au", service: "Partnership Tax", channel: "Email", status: "Completed", sent: "18 Jul", expires: "1 Aug", owner: "J. Okafor" },
];

const SEED_CLIENTS: ClientEntity[] = [
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

const SEED_ENGAGEMENTS: Engagement[] = [
  { id: "ENG-2024-0450", client: "Manoj Tech Solutions Pty Ltd", service: "Company Tax Return (FY25) + R&D Tax Incentive", signed: "Today", renewalDue: "30 Jun 2027", fee: "$6,350 pa", status: "Active", adviser: "J. Okafor" },
  { id: "ENG-2024-0441", client: "Greenbrook Unit Trust", service: "Trust Tax + Advisory", signed: "18 Jul 2024", renewalDue: "30 Jun 2025", fee: "$8,800 pa", status: "Active", adviser: "J. Okafor" },
  { id: "ENG-2024-0440", client: "Caldwell SMSF", service: "SMSF Administration", signed: "14 Jul 2024", renewalDue: "30 Jun 2025", fee: "$3,300 pa", status: "Active", adviser: "S. Patel" },
  { id: "ENG-2024-0439", client: "Harrington, Sophie", service: "Individual Tax", signed: "2 Jun 2024", renewalDue: "31 May 2025", fee: "$1,650 pa", status: "Active", adviser: "J. Okafor" },
  { id: "ENG-2024-0438", client: "Harrington, Sophie", service: "Business Advisory", signed: "2 Jun 2024", renewalDue: "31 May 2025", fee: "$6,600 pa", status: "Active", adviser: "J. Okafor" },
  { id: "ENG-2024-0430", client: "Apex Ventures Pty Ltd", service: "Company Tax + BAS", signed: "", renewalDue: "", fee: "$4,950 pa", status: "Proposal issued", adviser: "A. Brennan" },
  { id: "ENG-2023-0391", client: "The Marcelline Family Trust", service: "Trust Tax", signed: "14 Aug 2023", renewalDue: "31 Jul 2024", fee: "$5,500 pa", status: "Renewal due", adviser: "J. Okafor" },
  { id: "ENG-2022-0310", client: "Blackwood & Associates", service: "Partnership Tax", signed: "10 Sep 2022", renewalDue: "31 Aug 2024", fee: "$3,850 pa", status: "Terminated", adviser: "A. Brennan" },
];

const SEED_ACTIVITY: ActivityEvent[] = [
  { id: 999, time: "Just now", actor: "J. Okafor", action: "Accepted case & engagement", target: "ENG-2024-0450 · Manoj Tech Solutions Pty Ltd ($6,350 pa)", type: "accept" },
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

const SEED_TEMPLATES: Template[] = [
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

function getStored<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(`entiq_mock_${key}`);
    if (!raw) {
      localStorage.setItem(`entiq_mock_${key}`, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && Array.isArray(seed)) {
      const missingFromSeed = (seed as any[]).filter(
        (sItem) => !parsed.some((pItem: any) => (pItem.id && pItem.id === sItem.id) || (pItem.name && pItem.name === sItem.name) || (pItem.client && pItem.client === sItem.client))
      );
      if (missingFromSeed.length > 0) {
        const merged = [...missingFromSeed, ...parsed];
        localStorage.setItem(`entiq_mock_${key}`, JSON.stringify(merged));
        return merged as unknown as T;
      }
    }
    return parsed;
  } catch {
    return seed;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`entiq_mock_${key}`, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

// ─── Base fetch with seamless offline fallback ───────────────────────────────

let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;

  try {
    const res = await fetch(`${BASE_URL}${API_PREFIX}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!res.ok) {
      tokenStore.clear();
      return null;
    }

    const data: AuthTokens = await res.json();
    tokenStore.set(data);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = tokenStore.getAccess();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401 && retry) {
      if (isRefreshing) {
        const newToken = await new Promise<string>((resolve) =>
          refreshQueue.push(resolve)
        );
        return apiFetch<T>(path, options, false);
      }

      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        return apiFetch<T>(path, options, false);
      } else {
        window.dispatchEvent(new Event("entiq:auth:expired"));
        throw new ApiError("Session expired. Please sign in again.", "AUTH_EXPIRED");
      }
    }

    if (!res.ok) {
      let detail = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        detail = body.detail ?? detail;
      } catch {
        // Non-JSON
      }
      throw new ApiError(detail, String(res.status));
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    return handleLocalFallback<T>(path, options);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Local Mock Handler ───────────────────────────────────────────────────────

function handleLocalFallback<T>(path: string, options: RequestInit): Promise<T> {
  const [cleanPath, query] = path.split("?");
  const qs = new URLSearchParams(query || "");
  const method = options.method?.toUpperCase() || "GET";

  // /cases
  if (cleanPath === "/cases") {
    let items = getStored<OnboardingCase[]>("cases", SEED_CASES);
    const status = qs.get("status");
    const search = qs.get("search")?.toLowerCase();
    if (status) items = items.filter((c) => c.status === status);
    if (search) items = items.filter((c) => c.client.toLowerCase().includes(search) || c.entity.toLowerCase().includes(search));
    return Promise.resolve({
      items,
      total: items.length,
      page: 1,
      pageSize: 50,
      hasMore: false,
    } as unknown as T);
  }

  // /cases/:id
  if (cleanPath.startsWith("/cases/")) {
    const id = cleanPath.replace("/cases/", "");
    const items = getStored<OnboardingCase[]>("cases", SEED_CASES);
    const match = items.find((c) => c.id === id);
    if (!match) return Promise.reject(new ApiError("Case not found", "404"));
    return Promise.resolve(match as unknown as T);
  }

  // /alerts
  if (cleanPath === "/alerts") {
    const items = getStored<ReviewAlert[]>("alerts", SEED_ALERTS);
    return Promise.resolve(items as unknown as T);
  }

  // /alerts/:id/dismiss
  if (cleanPath.startsWith("/alerts/") && cleanPath.endsWith("/dismiss") && method === "POST") {
    const id = cleanPath.split("/")[2];
    const items = getStored<ReviewAlert[]>("alerts", SEED_ALERTS);
    setStored("alerts", items.filter((a) => a.id !== id));
    return Promise.resolve(undefined as unknown as T);
  }

  // /dashboard/stats
  if (cleanPath === "/dashboard/stats") {
    const casesArr = getStored<OnboardingCase[]>("cases", SEED_CASES);
    const alertsArr = getStored<ReviewAlert[]>("alerts", SEED_ALERTS);
    const stats: DashboardStats = {
      active: casesArr.filter((c) => ["In progress", "Awaiting others", "Internal review", "Proposal issued", "Acceptance review"].includes(c.status)).length,
      overdue: casesArr.filter((c) => c.status !== "Accepted" && c.status !== "Rejected").slice(0, 2).length,
      accepted: casesArr.filter((c) => c.status === "Accepted").length,
      exceptions: alertsArr.filter((a) => a.severity === "error").length,
      conversionData: [
        { stage: "Invited", count: 48 },
        { stage: "Opened", count: 41 },
        { stage: "In progress", count: 35 },
        { stage: "Submitted", count: 29 },
        { stage: "Signed", count: 24 },
        { stage: "Accepted", count: 21 },
      ],
      completionTrend: [
        { week: "W1", time: 18 },
        { week: "W2", time: 16 },
        { week: "W3", time: 19 },
        { week: "W4", time: 14 },
        { week: "W5", time: 12 },
        { week: "W6", time: 11 },
      ],
    };
    return Promise.resolve(stats as unknown as T);
  }

  // /invitations
  if (cleanPath === "/invitations" && method === "GET") {
    let items = getStored<Invitation[]>("invitations", SEED_INVITATIONS);
    const status = qs.get("status");
    const search = qs.get("search")?.toLowerCase();
    if (status) items = items.filter((i) => i.status === status);
    if (search) items = items.filter((i) => i.client.toLowerCase().includes(search) || i.email.toLowerCase().includes(search));
    return Promise.resolve({
      items,
      total: items.length,
      page: 1,
      pageSize: 50,
      hasMore: false,
    } as unknown as T);
  }

  // /invitations POST
  if (cleanPath === "/invitations" && method === "POST") {
    const payload: CreateInvitationPayload = JSON.parse(options.body as string || "{}");
    const items = getStored<Invitation[]>("invitations", SEED_INVITATIONS);
    const now = new Date();
    const expiry = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const newInv: Invitation = {
      id: `INV-2024-0${Math.floor(Math.random() * 900 + 100)}`,
      client: payload.clientName || "New Client",
      email: payload.email || "client@example.com",
      service: payload.service || "Individual Tax",
      channel: payload.channel || "Email",
      status: "Sent",
      sent: `${now.getDate()} ${now.toLocaleString("en-AU", { month: "short" })}`,
      expires: `${expiry.getDate()} ${expiry.toLocaleString("en-AU", { month: "short" })}`,
      owner: payload.assignTo || "J. Okafor",
    };
    setStored("invitations", [newInv, ...items]);

    const casesArr = getStored<OnboardingCase[]>("cases", SEED_CASES);
    const newCase: OnboardingCase = {
      id: `C-2024-0${Math.floor(Math.random() * 900 + 100)}`,
      client: newInv.client,
      entity: payload.clientType || "Individual",
      service: newInv.service,
      status: "Invited",
      risk: "Low",
      owner: newInv.owner,
      created: newInv.sent,
      due: newInv.expires,
      channel: newInv.channel,
      progress: 0,
    };
    setStored("cases", [newCase, ...casesArr]);

    return Promise.resolve(newInv as unknown as T);
  }

  // /invitations/stats
  if (cleanPath === "/invitations/stats") {
    const items = getStored<Invitation[]>("invitations", SEED_INVITATIONS);
    const stats: InvitationStats = {
      sentThisMonth: items.length,
      opened: items.filter((i) => ["Opened", "Started", "Completed"].includes(i.status)).length,
      started: items.filter((i) => ["Started", "Completed"].includes(i.status)).length,
      expiringIn3Days: items.filter((i) => i.status === "Sent" || i.status === "Opened").slice(0, 3).length,
    };
    return Promise.resolve(stats as unknown as T);
  }

  // /clients
  if (cleanPath === "/clients") {
    let rawItems = getStored<ClientEntity[]>("clients", SEED_CLIENTS);
    let items = rawItems.map((c, i) => ({
      ...c,
      id: c.id || `${c.type === "Individual" ? "P" : "E"}-${10000 + i}`,
      cases: c.cases ?? 0,
      engagements: c.engagements ?? 0,
      added: c.added || "Today",
    }));
    const type = qs.get("type");
    const search = qs.get("search")?.toLowerCase();
    if (type) items = items.filter((c) => c.type === type);
    if (search) items = items.filter((c) => c.name.toLowerCase().includes(search) || (c.abn && c.abn.includes(search)) || (c.acn && c.acn.includes(search)));
    return Promise.resolve({
      items,
      total: items.length,
      page: 1,
      pageSize: 50,
      hasMore: false,
    } as unknown as T);
  }

  // /engagements
  if (cleanPath === "/engagements") {
    let items = getStored<Engagement[]>("engagements", SEED_ENGAGEMENTS);
    const status = qs.get("status");
    const search = qs.get("search")?.toLowerCase();
    if (status) items = items.filter((e) => e.status === status);
    if (search) items = items.filter((e) => e.client.toLowerCase().includes(search) || e.service.toLowerCase().includes(search));
    return Promise.resolve({
      items,
      total: items.length,
      page: 1,
      pageSize: 50,
      hasMore: false,
    } as unknown as T);
  }

  // /activity
  if (cleanPath === "/activity") {
    let items = getStored<ActivityEvent[]>("activity", SEED_ACTIVITY);
    const filter = qs.get("filter");
    if (filter && filter !== "All") {
      const typeMap: Record<string, string[]> = {
        Cases: ["accept", "reject", "assign"],
        Invitations: ["invite", "open"],
        Documents: ["upload", "reject"],
        Identity: ["verify"],
        Exceptions: ["exception"],
      };
      const allowed = typeMap[filter];
      if (allowed) items = items.filter((e) => allowed.includes(e.type));
    }
    return Promise.resolve({
      items,
      total: items.length,
      page: 1,
      pageSize: 50,
      hasMore: false,
    } as unknown as T);
  }

  // /templates
  if (cleanPath === "/templates") {
    let items = getStored<Template[]>("templates", SEED_TEMPLATES);
    const type = qs.get("type");
    const search = qs.get("search")?.toLowerCase();
    if (type) items = items.filter((t) => t.type === type);
    if (search) items = items.filter((t) => t.name.toLowerCase().includes(search) || t.service.toLowerCase().includes(search));
    return Promise.resolve({
      items,
      total: items.length,
      page: 1,
      pageSize: 50,
      hasMore: false,
    } as unknown as T);
  }

  return Promise.resolve({} as unknown as T);
}

// ─── CSV Export Utility ───────────────────────────────────────────────────────

export function exportToCsv(filename: string, rows: Record<string, unknown>[], headers?: string[]) {
  if (!rows || !rows.length) return;
  const cols = headers || Object.keys(rows[0]);
  const headerLine = cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(",");
  const rowLines = rows.map((r) =>
    cols.map((c) => {
      const val = r[c] ?? "";
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",")
  );
  const csvContent = [headerLine, ...rowLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const DEFAULT_USER: UserProfile = {
  id: "usr-001",
  email: "j.okafor@growadvisory.com.au",
  firstName: "James",
  lastName: "Okafor",
  displayName: "J. Okafor",
  initials: "JO",
  role: "Partner",
  firmName: "Grow Advisory Group",
};

export const auth = {
  login: async (email: string, password: string): Promise<AuthTokens> => {
    try {
      const res = await fetch(`${BASE_URL}${API_PREFIX}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const tokens: AuthTokens = await res.json();
        tokenStore.set(tokens);
        return tokens;
      }
    } catch {
      // Offline fallback
    }

    const mockTokens: AuthTokens = {
      accessToken: `mock_jwt_access_${Date.now()}`,
      refreshToken: `mock_jwt_refresh_${Date.now()}`,
      tokenType: "Bearer",
      expiresIn: 86400,
    };
    tokenStore.set(mockTokens);
    return mockTokens;
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      tokenStore.clear();
    }
  },

  me: async (): Promise<UserProfile> => {
    try {
      return await apiFetch("/auth/me");
    } catch {
      return DEFAULT_USER;
    }
  },
};

// ─── Cases ────────────────────────────────────────────────────────────────────

export const cases = {
  list: (params?: { status?: string; search?: string; page?: number }): Promise<PaginatedResponse<OnboardingCase>> => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    return apiFetch(`/cases${qs.toString() ? `?${qs}` : ""}`);
  },

  get: (id: string): Promise<OnboardingCase> => apiFetch(`/cases/${id}`),

  updateStatus: (id: string, status: OnboardingCase["status"]): Promise<OnboardingCase> => {
    const list = getStored<OnboardingCase[]>("cases", SEED_CASES);
    const updated = list.map((c) => (c.id === id ? { ...c, status, progress: status === "Accepted" ? 100 : c.progress } : c));
    setStored("cases", updated);
    
    // If case is accepted, auto-create an active engagement if not already present
    if (status === "Accepted") {
      const engList = getStored<Engagement[]>("engagements", SEED_ENGAGEMENTS);
      const targetCase = list.find((c) => c.id === id);
      if (targetCase && !engList.some((e) => e.client.toLowerCase() === targetCase.client.toLowerCase())) {
        const now = new Date();
        const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        const newEng: Engagement = {
          id: `ENG-2024-0${Math.floor(Math.random() * 900 + 100)}`,
          client: targetCase.client,
          service: targetCase.service,
          signed: `${now.getDate()} ${now.toLocaleString("en-AU", { month: "short", year: "numeric" })}`,
          renewalDue: `${nextYear.getDate()} ${nextYear.toLocaleString("en-AU", { month: "short", year: "numeric" })}`,
          fee: "$4,950 pa",
          status: "Active",
          adviser: targetCase.owner,
        };
        setStored("engagements", [newEng, ...engList]);
      }
    }

    return Promise.resolve(updated.find((c) => c.id === id)!);
  },
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const alerts = {
  list: (): Promise<ReviewAlert[]> => apiFetch("/alerts"),
  dismiss: (id: string): Promise<void> => apiFetch(`/alerts/${id}/dismiss`, { method: "POST" }),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboard = {
  stats: (): Promise<DashboardStats> => apiFetch("/dashboard/stats"),
};

// ─── Invitations ──────────────────────────────────────────────────────────────

export const invitations = {
  list: (params?: { search?: string; status?: string }): Promise<PaginatedResponse<Invitation>> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    return apiFetch(`/invitations${qs.toString() ? `?${qs}` : ""}`);
  },

  stats: (): Promise<InvitationStats> => apiFetch("/invitations/stats"),

  create: (payload: CreateInvitationPayload): Promise<Invitation> =>
    apiFetch("/invitations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  resend: (id: string): Promise<void> => {
    const list = getStored<Invitation[]>("invitations", SEED_INVITATIONS);
    const updated = list.map((i) => (i.id === id ? { ...i, status: "Sent", expires: "14 Aug" } : i));
    setStored("invitations", updated);
    return Promise.resolve();
  },

  cancel: (id: string): Promise<void> => {
    const list = getStored<Invitation[]>("invitations", SEED_INVITATIONS);
    const updated = list.map((i) => (i.id === id ? { ...i, status: "Cancelled" } : i));
    setStored("invitations", updated);
    return Promise.resolve();
  },
};

// ─── Clients / Entities ───────────────────────────────────────────────────────

export const clients = {
  list: (params?: { search?: string; type?: string; verification?: string }): Promise<PaginatedResponse<ClientEntity>> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.type) qs.set("type", params.type);
    if (params?.verification) qs.set("verification", params.verification);
    return apiFetch(`/clients${qs.toString() ? `?${qs}` : ""}`);
  },

  create: (client: ClientEntity): Promise<ClientEntity> => {
    const list = getStored<ClientEntity[]>("clients", SEED_CLIENTS);
    const fullClient: ClientEntity = {
      id: client.id || `${client.type === "Individual" ? "P" : "E"}-${Math.floor(Math.random() * 90000 + 10000)}`,
      name: client.name,
      type: client.type,
      abn: client.abn || "",
      acn: client.acn || "",
      verified: client.verified || "Document",
      cases: client.cases ?? 0,
      engagements: client.engagements ?? 0,
      added: client.added || "Today",
    };
    setStored("clients", [fullClient, ...list]);
    return Promise.resolve(fullClient);
  },
};

// ─── Engagements ───────────────────────────────────────────────────────

export const engagements = {
  list: (params?: { search?: string; status?: string }): Promise<PaginatedResponse<Engagement>> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    return apiFetch(`/engagements${qs.toString() ? `?${qs}` : ""}`);
  },

  create: (engagement: Engagement): Promise<Engagement> => {
    const list = getStored<Engagement[]>("engagements", SEED_ENGAGEMENTS);
    setStored("engagements", [engagement, ...list]);
    return Promise.resolve(engagement);
  },

  updateStatus: (id: string, status: string): Promise<void> => {
    const list = getStored<Engagement[]>("engagements", SEED_ENGAGEMENTS);
    setStored("engagements", list.map((e) => (e.id === id ? { ...e, status } : e)));
    return Promise.resolve();
  },
};

// ─── Activity ─────────────────────────────────────────────────────────────────

export const activity = {
  list: (params?: { filter?: string; page?: number }): Promise<PaginatedResponse<ActivityEvent>> => {
    const qs = new URLSearchParams();
    if (params?.filter && params.filter !== "All") qs.set("filter", params.filter);
    if (params?.page) qs.set("page", String(params.page));
    return apiFetch(`/activity${qs.toString() ? `?${qs}` : ""}`);
  },

  log: (event: Omit<ActivityEvent, "id">): Promise<void> => {
    const list = getStored<ActivityEvent[]>("activity", SEED_ACTIVITY);
    const newEv: ActivityEvent = { ...event, id: Date.now() };
    setStored("activity", [newEv, ...list]);
    return Promise.resolve();
  },
};

// ─── Templates ────────────────────────────────────────────────────────────────

export const templates = {
  list: (params?: { search?: string; type?: string }): Promise<PaginatedResponse<Template>> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.type) qs.set("type", params.type);
    return apiFetch(`/templates${qs.toString() ? `?${qs}` : ""}`);
  },
};
