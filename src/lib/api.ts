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
  BillingSchedule,
  Invoice,
  Payment,
  BillingStats,
  ServiceItem,
  FeeItem,
  StaffMember,
  WorkflowProcess,
  ApiKeyItem,
  EmailConfig,
  EmailConfigUpdate,
  TestEmailPayload,
  EmailSendResult,
  CaseInfoRequestPayload,
  CaseInfoRequestResponse,
} from "../types/api";

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
const API_PREFIX = "/api/v1";

// ─── Token & API Key storage ───────────────────────────────────────────────────

const TOKEN_KEY = "entiq_access_token";
const REFRESH_KEY = "entiq_refresh_token";
const API_KEY_STORAGE = "entiq_api_key";
export const DEFAULT_MASTER_API_KEY = "entiq_live_sec_7f9c2d1b8e4a3f0";

export const apiKeyStore = {
  get: (): string => localStorage.getItem(API_KEY_STORAGE) || (import.meta.env.VITE_API_KEY as string | undefined) || DEFAULT_MASTER_API_KEY,
  set: (key: string): void => localStorage.setItem(API_KEY_STORAGE, key),
  clear: (): void => localStorage.removeItem(API_KEY_STORAGE),
};

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

const SEED_SCHEDULES: BillingSchedule[] = [
  { id: "SCH-000", client: "Manoj Tech Solutions Pty Ltd", engagementId: "ENG-2024-0450", service: "Company Tax Return & Advisory", type: "Monthly", amount: 529.17, gst: true, nextDue: "1 Oct 2026", adviser: "J. Okafor", status: "Active", squareSubscriptionId: "sub_Mn9k4Lx" },
  { id: "SCH-001", client: "Harrington, Sophie", engagementId: "ENG-2024-0439", service: "Individual Tax Return", type: "Annual", amount: 1650, gst: true, nextDue: "1 Jun 2025", adviser: "J. Okafor", status: "Active", squareSubscriptionId: "sub_Hq7k2Lm" },
  { id: "SCH-002", client: "Harrington, Sophie", engagementId: "ENG-2024-0438", service: "Business Advisory", type: "Monthly", amount: 1100, gst: true, nextDue: "1 Aug 2024", adviser: "J. Okafor", status: "Active", squareSubscriptionId: "sub_Bb3f8Pn" },
  { id: "SCH-003", client: "Greenbrook Unit Trust", engagementId: "ENG-2024-0441", service: "Trust Tax Return", type: "Annual", amount: 4400, gst: true, nextDue: "1 Jul 2025", adviser: "J. Okafor", status: "Active", squareSubscriptionId: "sub_Ty5m1Qr" },
  { id: "SCH-004", client: "Greenbrook Unit Trust", engagementId: "ENG-2024-0441", service: "Business Advisory", type: "Monthly", amount: 1100, gst: true, nextDue: "1 Aug 2024", adviser: "J. Okafor", status: "Active", squareSubscriptionId: "sub_Vc9n4Ws" },
  { id: "SCH-005", client: "Caldwell SMSF", engagementId: "ENG-2024-0440", service: "SMSF Administration", type: "Annual", amount: 3300, gst: true, nextDue: "1 May 2025", adviser: "S. Patel", status: "Active", squareSubscriptionId: "sub_Xd2p7Jt" },
  { id: "SCH-006", client: "Caldwell SMSF", engagementId: "ENG-2024-0440", service: "BAS Preparation", type: "Quarterly", amount: 550, gst: true, nextDue: "28 Oct 2024", adviser: "S. Patel", status: "Active", squareSubscriptionId: "sub_Ze6q0Ku" },
  { id: "SCH-007", client: "Apex Ventures Pty Ltd", engagementId: "ENG-2024-0430", service: "Company Tax Return", type: "Annual", amount: 3850, gst: true, nextDue: "—", adviser: "A. Brennan", status: "Paused", squareSubscriptionId: "" },
  { id: "SCH-008", client: "The Marcelline Family Trust", engagementId: "ENG-2023-0391", service: "Trust Tax Return", type: "Job-based", amount: 4400, gst: true, nextDue: "On completion", adviser: "J. Okafor", status: "Active", squareSubscriptionId: "" },
];

const SEED_INVOICES: Invoice[] = [
  { id: "INV-2024-0313", scheduleId: "SCH-000", client: "Manoj Tech Solutions Pty Ltd", service: "Company Tax Return & Advisory — Sept 2026", amount: 529.17, gst: 52.92, issued: "1 Sept 2026", due: "15 Sept 2026", status: "Paid", xeroStatus: "Synced", xeroInvoiceNo: "INV-0313", squareStatus: "Paid", squarePaymentId: "sqp_Mn9k4Lx" },
  { id: "INV-2024-0312", scheduleId: "SCH-002", client: "Harrington, Sophie", service: "Business Advisory — July 2024", amount: 1100, gst: 110, issued: "1 Jul 2024", due: "15 Jul 2024", status: "Paid", xeroStatus: "Synced", xeroInvoiceNo: "INV-0312", squareStatus: "Paid", squarePaymentId: "sqp_Hq7k2Lm" },
  { id: "INV-2024-0311", scheduleId: "SCH-004", client: "Greenbrook Unit Trust", service: "Business Advisory — July 2024", amount: 1100, gst: 110, issued: "1 Jul 2024", due: "15 Jul 2024", status: "Paid", xeroStatus: "Synced", xeroInvoiceNo: "INV-0311", squareStatus: "Paid", squarePaymentId: "sqp_Vc9n4Ws" },
  { id: "INV-2024-0310", scheduleId: "SCH-002", client: "Harrington, Sophie", service: "Business Advisory — June 2024", amount: 1100, gst: 110, issued: "1 Jun 2024", due: "15 Jun 2024", status: "Paid", xeroStatus: "Synced", xeroInvoiceNo: "INV-0310", squareStatus: "Paid", squarePaymentId: "sqp_Mn1a5Fb" },
  { id: "INV-2024-0309", scheduleId: "SCH-001", client: "Harrington, Sophie", service: "Individual Tax Return 2023–24", amount: 1650, gst: 165, issued: "2 Jun 2024", due: "16 Jun 2024", status: "Paid", xeroStatus: "Synced", xeroInvoiceNo: "INV-0309", squareStatus: "Paid", squarePaymentId: "sqp_Pk8b3Gc" },
  { id: "INV-2024-0308", scheduleId: "SCH-005", client: "Caldwell SMSF", service: "SMSF Administration 2023–24", amount: 3300, gst: 330, issued: "14 Jul 2024", due: "28 Jul 2024", status: "Due", xeroStatus: "Synced", xeroInvoiceNo: "INV-0308", squareStatus: "Pending", squarePaymentId: "" },
  { id: "INV-2024-0307", scheduleId: "SCH-006", client: "Caldwell SMSF", service: "BAS Preparation Q4 FY2024", amount: 550, gst: 55, issued: "28 Jun 2024", due: "12 Jul 2024", status: "Overdue", xeroStatus: "Synced", xeroInvoiceNo: "INV-0307", squareStatus: "Failed", squarePaymentId: "" },
  { id: "INV-2024-0306", scheduleId: "SCH-003", client: "Greenbrook Unit Trust", service: "Trust Tax Return 2022–23", amount: 4400, gst: 440, issued: "18 Jul 2024", due: "1 Aug 2024", status: "Sent", xeroStatus: "Synced", xeroInvoiceNo: "INV-0306", squareStatus: "—", squarePaymentId: "" },
  { id: "INV-2024-0305", scheduleId: "SCH-007", client: "Apex Ventures Pty Ltd", service: "Company Tax Return 2022–23", amount: 3850, gst: 385, issued: "—", due: "—", status: "Draft", xeroStatus: "Not synced", xeroInvoiceNo: "", squareStatus: "—", squarePaymentId: "" },
];

const SEED_PAYMENTS: Payment[] = [
  { id: "PAY-000", invoiceId: "INV-2024-0313", client: "Manoj Tech Solutions Pty Ltd", amount: 582.09, method: "Visa •••• 8841", date: "4 Sept 2026", squareTxId: "sqp_Mn9k4Lx", xeroReconciled: true, status: "Settled" },
  { id: "PAY-001", invoiceId: "INV-2024-0312", client: "Harrington, Sophie", amount: 1210, method: "Visa •••• 4242", date: "8 Jul 2024", squareTxId: "sqp_Hq7k2Lm", xeroReconciled: true, status: "Settled" },
  { id: "PAY-002", invoiceId: "INV-2024-0311", client: "Greenbrook Unit Trust", amount: 1210, method: "Bank transfer", date: "10 Jul 2024", squareTxId: "sqp_Vc9n4Ws", xeroReconciled: true, status: "Settled" },
  { id: "PAY-003", invoiceId: "INV-2024-0310", client: "Harrington, Sophie", amount: 1210, method: "Visa •••• 4242", date: "8 Jun 2024", squareTxId: "sqp_Mn1a5Fb", xeroReconciled: true, status: "Settled" },
  { id: "PAY-004", invoiceId: "INV-2024-0309", client: "Harrington, Sophie", amount: 1815, method: "Visa •••• 4242", date: "10 Jun 2024", squareTxId: "sqp_Pk8b3Gc", xeroReconciled: true, status: "Settled" },
  { id: "PAY-005", invoiceId: "INV-2024-0308", client: "Caldwell SMSF", amount: 3630, method: "Mastercard •••• 7701", date: "Processing", squareTxId: "", xeroReconciled: false, status: "Processing" },
  { id: "PAY-006", invoiceId: "INV-2024-0307", client: "Caldwell SMSF", amount: 605, method: "Mastercard •••• 7701", date: "12 Jul 2024", squareTxId: "", xeroReconciled: false, status: "Failed" },
];

const SEED_SERVICES: ServiceItem[] = [
  { id: "SVC-001", name: "Individual Tax Return", description: "Annual income tax return preparation and lodgement", entityTypes: ["Individual"], scope: "Includes one rental property, up to $20k investments", status: "Active" },
  { id: "SVC-002", name: "Company Tax Return", description: "Corporate income tax return and financial statements", entityTypes: ["Company"], scope: "Standard small business — excludes R&D or transfer pricing", status: "Active" },
  { id: "SVC-003", name: "Trust Tax Return", description: "Trust income tax return and distribution statements", entityTypes: ["Trust"], scope: "Discretionary and unit trusts", status: "Active" },
  { id: "SVC-004", name: "SMSF Administration", description: "Full SMSF audit, compliance and tax return", entityTypes: ["SMSF"], scope: "Up to 4 members, standard investment strategy", status: "Active" },
  { id: "SVC-005", name: "BAS Preparation", description: "Quarterly Business Activity Statement preparation", entityTypes: ["Company", "Partnership", "Trust"], scope: "GST, PAYG withholding, fuel tax credits", status: "Active" },
  { id: "SVC-006", name: "Business Advisory", description: "Strategic financial advice and management reporting", entityTypes: ["Company", "Partnership"], scope: "Monthly meetings, management accounts, KPI dashboard", status: "Active" },
  { id: "SVC-007", name: "Partnership Tax Return", description: "Partnership tax return and distribution schedule", entityTypes: ["Partnership"], scope: "Standard partnership — excludes foreign partners", status: "Active" },
];

const SEED_FEES: FeeItem[] = [
  { id: "FEE-001", service: "Individual Tax Return", basis: "Fixed", amount: 1650, frequency: "Annual", gst: true, notes: "Base rate — complex returns quoted separately" },
  { id: "FEE-002", service: "Company Tax Return", amount: 3850, basis: "Fixed", frequency: "Annual", gst: true, notes: "Turnover < $5M. Additional $550 per entity in group." },
  { id: "FEE-003", service: "Trust Tax Return", amount: 4400, basis: "Fixed", frequency: "Annual", gst: true, notes: "Discretionary trust base rate" },
  { id: "FEE-004", service: "SMSF Administration", amount: 3300, basis: "Fixed", frequency: "Annual", gst: true, notes: "Full admin + audit. Audit conducted by external auditor." },
  { id: "FEE-005", service: "BAS Preparation", amount: 550, basis: "Fixed", frequency: "Quarterly", gst: true, notes: "Per quarter — IAS lodgement included" },
  { id: "FEE-006", service: "Business Advisory", amount: 1100, basis: "Fixed", frequency: "Monthly", gst: true, notes: "Retainer. Additional project work at charge-out rate." },
  { id: "FEE-007", service: "Partnership Tax Return", amount: 2750, basis: "Fixed", frequency: "Annual", gst: true, notes: "" },
];

const SEED_STAFF: StaffMember[] = [
  { id: "STF-001", name: "James Okafor", role: "Partner", rate: 520, currency: "AUD", unit: "hour", email: "j.okafor@growadvisory.com.au", status: "Active" },
  { id: "STF-002", name: "Amelia Brennan", role: "Senior Manager", rate: 380, currency: "AUD", unit: "hour", email: "a.brennan@growadvisory.com.au", status: "Active" },
  { id: "STF-003", name: "Sanjay Patel", role: "Senior Accountant", rate: 280, currency: "AUD", unit: "hour", email: "s.patel@growadvisory.com.au", status: "Active" },
  { id: "STF-004", name: "Chloe Richardson", role: "Accountant", rate: 195, currency: "AUD", unit: "hour", email: "c.richardson@growadvisory.com.au", status: "Active" },
  { id: "STF-005", name: "Marcus Webb", role: "Graduate Accountant", rate: 130, currency: "AUD", unit: "hour", email: "m.webb@growadvisory.com.au", status: "Active" },
  { id: "STF-006", name: "Linda Tran", role: "Practice Manager", rate: 165, currency: "AUD", unit: "hour", email: "l.tran@growadvisory.com.au", status: "Active" },
];

const SEED_WORKFLOWS: WorkflowProcess[] = [
  {
    id: "default-client-onboarding",
    name: "Default Client Onboarding Flow",
    description: "End-to-end automated client onboarding with KYC, Engagement Letter, and Square Direct Debit",
    nodesJson: "[]",
    edgesJson: "[]",
    status: "Active",
  },
];

const SEED_API_KEYS: ApiKeyItem[] = [
  {
    id: "key-master-001",
    key: "entiq_live_sec_7f9c2d1b8e4a3f0",
    name: "Master Practice API Key",
    isActive: true,
  },
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
  const apiKey = apiKeyStore.get();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
    ...(apiKey ? { "X-API-Key": apiKey } : {}),
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

  // /cases/:id/status or /cases/:id PATCH
  if (cleanPath.startsWith("/cases/") && (cleanPath.endsWith("/status") || method === "PATCH")) {
    const id = cleanPath.replace("/cases/", "").replace("/status", "");
    const body = JSON.parse((options.body as string) || "{}");
    const status = body.status;
    const list = getStored<OnboardingCase[]>("cases", SEED_CASES);
    const updated = list.map((c) => (c.id === id ? { ...c, status, progress: status === "Accepted" ? 100 : c.progress } : c));
    setStored("cases", updated);
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
    return Promise.resolve(updated.find((c) => c.id === id)! as unknown as T);
  }

  // /cases/:id
  if (cleanPath.startsWith("/cases/")) {
    if (cleanPath.endsWith("/request-info") && method === "POST") {
      const payload: CaseInfoRequestPayload = JSON.parse((options.body as string) || "{}");
      return Promise.resolve({
        delivered: false,
        message: `Information request simulated for ${payload.recipientEmail}`,
        recipientEmail: payload.recipientEmail,
        status: "simulated",
        simulated: true,
      } as unknown as T);
    }
    const id = cleanPath.replace("/cases/", "");
    if (method === "DELETE") {
      const items = getStored<OnboardingCase[]>("cases", SEED_CASES);
      const filtered = items.filter((c) => c.id !== id);
      setStored("cases", filtered);
      const alertList = getStored<ReviewAlert[]>("alerts", SEED_ALERTS);
      setStored("alerts", alertList.filter((a) => a.case !== id));
      return Promise.resolve(undefined as unknown as T);
    }
    if (method === "PUT") {
      const body = JSON.parse((options.body as string) || "{}");
      const items = getStored<OnboardingCase[]>("cases", SEED_CASES);
      const updated = items.map((c) => (c.id === id ? { ...c, ...body, ...(body.status === "Accepted" ? { progress: 100 } : {}) } : c));
      setStored("cases", updated);
      return Promise.resolve(updated.find((c) => c.id === id)! as unknown as T);
    }
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
    if (payload.additionalCompanies && (payload.clientType === "Company" || payload.clientType === "Trust")) {
      payload.additionalCompanies.forEach((co, idx) => {
        if (!co.name.trim()) return;
        const addCase: OnboardingCase = {
          id: `C-2024-0${Math.floor(Math.random() * 900 + 100 + idx)}`,
          client: co.name.trim(),
          entity: "Company",
          service: payload.clientType === "Trust" ? "Company Tax + Advisory" : payload.service,
          status: "Invited",
          risk: "Low",
          owner: newInv.owner,
          created: newInv.sent,
          due: newInv.expires,
          channel: newInv.channel,
          progress: 0,
        };
        casesArr.unshift(addCase);
      });
    }
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

  // /invitations/email-config
  if (cleanPath === "/invitations/email-config") {
    const defaultConfig: EmailConfig = {
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpUser: "",
      smtpPasswordSet: false,
      smtpFromEmail: "",
      smtpFromName: "Grow Advisory Group",
      frontendUrl: "http://localhost:5173",
      isConfigured: false,
    };
    if (method === "PUT") {
      const payload: EmailConfigUpdate = JSON.parse(options.body as string || "{}");
      const current = getStored<EmailConfig>("smtp_config", defaultConfig);
      const updated: EmailConfig = {
        ...current,
        ...payload,
        smtpPasswordSet: Boolean(payload.smtpPassword || current.smtpPasswordSet),
        isConfigured: Boolean((payload.smtpUser || current.smtpUser) && (payload.smtpPassword || current.smtpPasswordSet)),
      };
      setStored("smtp_config", updated);
      return Promise.resolve(updated as unknown as T);
    }
    const current = getStored<EmailConfig>("smtp_config", defaultConfig);
    return Promise.resolve(current as unknown as T);
  }

  // /invitations/test-email
  if (cleanPath === "/invitations/test-email" && method === "POST") {
    const payload: TestEmailPayload = JSON.parse(options.body as string || "{}");
    const result: EmailSendResult = {
      status: "sent",
      delivered: true,
      message: `Test email simulated for ${payload.toEmail} (offline mode)`,
      simulated: true,
    };
    return Promise.resolve(result as unknown as T);
  }

  // /invitations/public/:id/accept
  if (cleanPath.startsWith("/invitations/public/") && cleanPath.endsWith("/accept") && method === "POST") {
    const id = cleanPath.replace("/invitations/public/", "").replace("/accept", "");
    const items = getStored<Invitation[]>("invitations", SEED_INVITATIONS);
    const existing = items.find((i) => i.id === id);
    if (existing) {
      existing.status = "Completed";
      setStored("invitations", items);
    }
    const casesArr = getStored<OnboardingCase[]>("cases", SEED_CASES);
    const matchedCase = casesArr.find((c) => existing && c.client === existing.client);
    if (matchedCase) {
      matchedCase.status = "Accepted";
      matchedCase.progress = 100;
      setStored("cases", casesArr);
    }
    return Promise.resolve({ status: "ok", message: "Onboarding completed successfully" } as unknown as T);
  }

  // /invitations/public/:id
  if (cleanPath.startsWith("/invitations/public/") && method === "GET") {
    const id = cleanPath.replace("/invitations/public/", "");
    const items = getStored<Invitation[]>("invitations", SEED_INVITATIONS);
    const existing = items.find((i) => i.id === id);
    if (!existing) return Promise.reject(new ApiError("Invitation not found", "404"));
    if (existing.status === "Sent") {
      existing.status = "Opened";
      setStored("invitations", items);
    }
    return Promise.resolve(existing as unknown as T);
  }

  // /invitations/:id
  if (cleanPath.startsWith("/invitations/") && !cleanPath.endsWith("/resend") && !cleanPath.endsWith("/cancel") && !cleanPath.endsWith("/stats") && !cleanPath.endsWith("/email-config") && !cleanPath.endsWith("/test-email")) {
    const id = cleanPath.replace("/invitations/", "");
    const items = getStored<Invitation[]>("invitations", SEED_INVITATIONS);
    const existingIndex = items.findIndex((i) => i.id === id);

    if (method === "DELETE") {
      if (existingIndex !== -1) {
        items.splice(existingIndex, 1);
        setStored("invitations", items);
      }
      return Promise.resolve(undefined as unknown as T);
    }

    if (method === "PUT" || method === "PATCH") {
      if (existingIndex === -1) {
        return Promise.reject(new ApiError("Invitation not found", "404"));
      }
      const payload: Partial<Invitation> = JSON.parse(options.body as string || "{}");
      const updated = { ...items[existingIndex], ...payload };
      items[existingIndex] = updated;
      setStored("invitations", items);
      return Promise.resolve(updated as unknown as T);
    }

    if (existingIndex !== -1) {
      return Promise.resolve(items[existingIndex] as unknown as T);
    }
  }

  // /clients
  if (cleanPath === "/clients") {
    if (method === "POST") {
      const payload: ClientEntity = JSON.parse(options.body as string || "{}");
      const items = getStored<ClientEntity[]>("clients", SEED_CLIENTS);
      const prefix = payload.type === "Individual" ? "P" : "E";
      const newClient: ClientEntity = {
        id: payload.id || `${prefix}-${Math.floor(Math.random() * 90000 + 10000)}`,
        name: payload.name || "Unnamed Entity",
        type: payload.type || "Company",
        abn: payload.abn || "",
        acn: payload.acn || "",
        status: payload.status || "Active",
        verified: payload.verified || "Document",
        cases: payload.cases ?? 0,
        engagements: payload.engagements ?? 0,
        added: payload.added || "Today",
      };
      setStored("clients", [newClient, ...items]);
      return Promise.resolve(newClient as unknown as T);
    }

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

  // /clients/:id
  if (cleanPath.startsWith("/clients/")) {
    const id = cleanPath.replace("/clients/", "");
    const items = getStored<ClientEntity[]>("clients", SEED_CLIENTS);
    const existingIndex = items.findIndex((c) => c.id === id);

    if (method === "DELETE") {
      if (existingIndex !== -1) {
        items.splice(existingIndex, 1);
        setStored("clients", items);
      }
      return Promise.resolve(undefined as unknown as T);
    }

    if (method === "PUT" || method === "PATCH") {
      if (existingIndex === -1) {
        return Promise.reject(new ApiError("Client not found", "404"));
      }
      const payload: Partial<ClientEntity> = JSON.parse(options.body as string || "{}");
      const updated = { ...items[existingIndex], ...payload };
      items[existingIndex] = updated;
      setStored("clients", items);
      return Promise.resolve(updated as unknown as T);
    }

    if (existingIndex === -1) {
      return Promise.reject(new ApiError("Client not found", "404"));
    }
    return Promise.resolve(items[existingIndex] as unknown as T);
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

  // /invitations/:id/resend
  if (cleanPath.startsWith("/invitations/") && cleanPath.endsWith("/resend") && method === "POST") {
    const id = cleanPath.split("/")[2];
    const list = getStored<Invitation[]>("invitations", SEED_INVITATIONS);
    const updated = list.map((i) => (i.id === id ? { ...i, status: "Sent", expires: "14 Aug" } : i));
    setStored("invitations", updated);
    return Promise.resolve(undefined as unknown as T);
  }

  // /invitations/:id/cancel
  if (cleanPath.startsWith("/invitations/") && cleanPath.endsWith("/cancel") && method === "POST") {
    const id = cleanPath.split("/")[2];
    const list = getStored<Invitation[]>("invitations", SEED_INVITATIONS);
    const updated = list.map((i) => (i.id === id ? { ...i, status: "Cancelled" } : i));
    setStored("invitations", updated);
    return Promise.resolve(undefined as unknown as T);
  }

  // /clients POST
  if (cleanPath === "/clients" && method === "POST") {
    const client = JSON.parse((options.body as string) || "{}");
    const list = getStored<ClientEntity[]>("clients", SEED_CLIENTS);
    const fullClient: ClientEntity = {
      id: client.id || `${client.type === "Individual" ? "P" : "E"}-${Math.floor(Math.random() * 90000 + 10000)}`,
      name: client.name,
      type: client.type,
      abn: client.abn || "",
      acn: client.acn || "",
      verified: client.verified || "Document",
      cases: client.cases ?? 1,
      engagements: client.engagements ?? 1,
      added: client.added || "Today",
      status: client.status || "Active",
    };
    setStored("clients", [fullClient, ...list]);
    return Promise.resolve(fullClient as unknown as T);
  }

  // /clients/batch POST
  if (cleanPath === "/clients/batch" && method === "POST") {
    const listPayload: ClientEntity[] = JSON.parse((options.body as string) || "[]");
    const currentList = getStored<ClientEntity[]>("clients", SEED_CLIENTS);
    const addedEntities: ClientEntity[] = listPayload.map((client, i) => ({
      id: client.id || `${client.type === "Individual" ? "P" : "E"}-${Math.floor(Math.random() * 90000 + 10000 + i)}`,
      name: client.name,
      type: client.type,
      abn: client.abn || "",
      acn: client.acn || "",
      verified: client.verified || "Document",
      cases: client.cases ?? 1,
      engagements: client.engagements ?? 1,
      added: client.added || "Today",
      status: client.status || "Active",
    }));
    setStored("clients", [...addedEntities, ...currentList]);
    return Promise.resolve(addedEntities as unknown as T);
  }

  // /engagements POST
  if (cleanPath === "/engagements" && method === "POST") {
    const engagement = JSON.parse((options.body as string) || "{}");
    const list = getStored<Engagement[]>("engagements", SEED_ENGAGEMENTS);
    const fullEng: Engagement = {
      id: engagement.id || `ENG-2024-0${Math.floor(Math.random() * 900 + 100)}`,
      client: engagement.client,
      service: engagement.service,
      signed: engagement.signed || "Today",
      renewalDue: engagement.renewalDue || "",
      fee: engagement.fee || "$0 pa",
      status: engagement.status || "Active",
      adviser: engagement.adviser || "J. Okafor",
    };
    setStored("engagements", [fullEng, ...list]);
    return Promise.resolve(fullEng as unknown as T);
  }

  // /engagements/:id/status
  if (cleanPath.startsWith("/engagements/") && (cleanPath.endsWith("/status") || method === "PATCH")) {
    const id = cleanPath.split("/")[2];
    const body = JSON.parse((options.body as string) || "{}");
    const status = body.status;
    const list = getStored<Engagement[]>("engagements", SEED_ENGAGEMENTS);
    setStored("engagements", list.map((e) => (e.id === id ? { ...e, status } : e)));
    return Promise.resolve(list.find((e) => e.id === id)! as unknown as T);
  }

  // /engagements/:id
  if (cleanPath.startsWith("/engagements/") && !cleanPath.endsWith("/status")) {
    const id = cleanPath.replace("/engagements/", "");
    const items = getStored<Engagement[]>("engagements", SEED_ENGAGEMENTS);
    const existingIndex = items.findIndex((e) => e.id === id);

    if (method === "DELETE") {
      if (existingIndex !== -1) {
        items.splice(existingIndex, 1);
        setStored("engagements", items);
      }
      return Promise.resolve(undefined as unknown as T);
    }

    if (method === "PUT") {
      if (existingIndex === -1) {
        return Promise.reject(new ApiError("Engagement not found", "404"));
      }
      const payload: Partial<Engagement> = JSON.parse(options.body as string || "{}");
      const updated = { ...items[existingIndex], ...payload };
      items[existingIndex] = updated;
      setStored("engagements", items);
      return Promise.resolve(updated as unknown as T);
    }

    if (existingIndex !== -1) {
      return Promise.resolve(items[existingIndex] as unknown as T);
    }
  }

  // /activity POST
  if (cleanPath === "/activity" && method === "POST") {
    const event = JSON.parse((options.body as string) || "{}");
    const list = getStored<ActivityEvent[]>("activity", SEED_ACTIVITY);
    const now = new Date();
    const newEv: ActivityEvent = {
      ...event,
      id: Date.now(),
      createdAt: event.createdAt || now.toISOString(),
      time: event.time || "Just now",
    };
    setStored("activity", [newEv, ...list]);
    return Promise.resolve(newEv as unknown as T);
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

  // /billing/stats
  if (cleanPath === "/billing/stats") {
    const schedules = getStored<BillingSchedule[]>("schedules", SEED_SCHEDULES);
    const invoices = getStored<Invoice[]>("invoices", SEED_INVOICES);
    const payments = getStored<Payment[]>("payments", SEED_PAYMENTS);
    const active_schedules = schedules.filter((s) => s.status === "Active").length;
    const overdue_count = invoices.filter((i) => i.status === "Overdue").length;
    const settled_payments = payments.filter((p) => p.status === "Settled");
    const total_revenue_ytd = settled_payments.reduce((sum, p) => sum + p.amount, 0);
    const collected_this_month = settled_payments.slice(0, 4).reduce((sum, p) => sum + p.amount, 0);
    const outstanding = invoices
      .filter((i) => ["Due", "Overdue", "Sent"].includes(i.status))
      .reduce((sum, i) => sum + (i.amount + i.gst), 0);

    const stats: BillingStats = {
      totalRevenueYtd: Math.round(total_revenue_ytd * 100) / 100,
      collectedThisMonth: Math.round(collected_this_month * 100) / 100,
      outstandingInvoices: Math.round(outstanding * 100) / 100,
      activeSchedules: active_schedules,
      overdueCount: overdue_count,
      settledPaymentsCount: settled_payments.length,
    };
    return Promise.resolve(stats as unknown as T);
  }

  // /billing/schedules
  if (cleanPath === "/billing/schedules") {
    let items = getStored<BillingSchedule[]>("schedules", SEED_SCHEDULES);
    if (method === "POST") {
      const payload: Partial<BillingSchedule> = JSON.parse(options.body as string || "{}");
      const newSch: BillingSchedule = {
        id: payload.id || `SCH-${Math.floor(Math.random() * 900 + 100)}`,
        client: payload.client || "Client",
        engagementId: payload.engagementId || "",
        service: payload.service || "Tax Service",
        type: payload.type || "Monthly",
        amount: payload.amount || 0,
        gst: payload.gst !== undefined ? payload.gst : true,
        nextDue: payload.nextDue || "1st Next Month",
        adviser: payload.adviser || "J. Okafor",
        status: payload.status || "Active",
        squareSubscriptionId: payload.squareSubscriptionId || `sub_${Math.floor(Math.random() * 90000 + 10000)}`,
      };
      setStored("schedules", [newSch, ...items]);
      return Promise.resolve(newSch as unknown as T);
    }
    const client = qs.get("client")?.toLowerCase();
    const status = qs.get("status");
    if (client) items = items.filter((s) => s.client.toLowerCase().includes(client));
    if (status && status !== "All") items = items.filter((s) => s.status === status);
    return Promise.resolve({
      items,
      total: items.length,
      page: 1,
      pageSize: 50,
      hasMore: false,
    } as unknown as T);
  }

  // /billing/schedules/:id
  if (cleanPath.startsWith("/billing/schedules/")) {
    const id = cleanPath.replace("/billing/schedules/", "");
    const items = getStored<BillingSchedule[]>("schedules", SEED_SCHEDULES);
    const idx = items.findIndex((s) => s.id === id);

    if (method === "DELETE") {
      if (idx !== -1) {
        items.splice(idx, 1);
        setStored("schedules", items);
      }
      return Promise.resolve(undefined as unknown as T);
    }

    if (method === "PUT" || method === "PATCH") {
      if (idx === -1) return Promise.reject(new ApiError("Schedule not found", "404"));
      const payload = JSON.parse(options.body as string || "{}");
      const updated = { ...items[idx], ...payload };
      items[idx] = updated;
      setStored("schedules", items);
      return Promise.resolve(updated as unknown as T);
    }
  }

  // /billing/invoices
  if (cleanPath === "/billing/invoices") {
    let items = getStored<Invoice[]>("invoices", SEED_INVOICES);
    if (method === "POST") {
      const payload: Partial<Invoice> = JSON.parse(options.body as string || "{}");
      const newInv: Invoice = {
        id: payload.id || `INV-2024-${Math.floor(Math.random() * 900 + 100)}`,
        scheduleId: payload.scheduleId || "",
        client: payload.client || "Client",
        service: payload.service || "Service",
        amount: payload.amount || 0,
        gst: payload.gst ?? Math.round((payload.amount || 0) * 0.1 * 100) / 100,
        issued: payload.issued || "Today",
        due: payload.due || "In 14 days",
        status: payload.status || "Draft",
        xeroStatus: payload.xeroStatus || "Synced",
        xeroInvoiceNo: payload.xeroInvoiceNo || `INV-${Math.floor(Math.random() * 9000 + 1000)}`,
        squareStatus: payload.squareStatus || "—",
        squarePaymentId: payload.squarePaymentId || "",
      };
      setStored("invoices", [newInv, ...items]);
      return Promise.resolve(newInv as unknown as T);
    }
    const client = qs.get("client")?.toLowerCase();
    const status = qs.get("status");
    if (client) items = items.filter((i) => i.client.toLowerCase().includes(client));
    if (status && status !== "All") items = items.filter((i) => i.status === status);
    return Promise.resolve({
      items,
      total: items.length,
      page: 1,
      pageSize: 50,
      hasMore: false,
    } as unknown as T);
  }

  // /billing/invoices/:id/status
  if (cleanPath.startsWith("/billing/invoices/") && cleanPath.endsWith("/status")) {
    const id = cleanPath.split("/")[3];
    const newStatus = qs.get("new_status") || "Paid";
    const items = getStored<Invoice[]>("invoices", SEED_INVOICES);
    const updated = items.map((inv) =>
      inv.id === id ? { ...inv, status: newStatus as any, squareStatus: newStatus === "Paid" ? "Paid" : inv.squareStatus } : inv
    );
    setStored("invoices", updated);
    return Promise.resolve(updated.find((i) => i.id === id)! as unknown as T);
  }

  // /billing/invoices/:id
  if (cleanPath.startsWith("/billing/invoices/") && !cleanPath.endsWith("/status")) {
    const id = cleanPath.replace("/billing/invoices/", "");
    const items = getStored<Invoice[]>("invoices", SEED_INVOICES);
    const existingIndex = items.findIndex((i) => i.id === id);

    if (method === "DELETE") {
      if (existingIndex !== -1) {
        items.splice(existingIndex, 1);
        setStored("invoices", items);
      }
      return Promise.resolve(undefined as unknown as T);
    }

    if (method === "PUT" || method === "PATCH") {
      if (existingIndex === -1) {
        return Promise.reject(new ApiError("Invoice not found", "404"));
      }
      const payload: Partial<Invoice> = JSON.parse(options.body as string || "{}");
      const updated = { ...items[existingIndex], ...payload };
      items[existingIndex] = updated;
      setStored("invoices", items);
      return Promise.resolve(updated as unknown as T);
    }

    if (existingIndex !== -1) {
      return Promise.resolve(items[existingIndex] as unknown as T);
    }
  }

  // /billing/payments
  if (cleanPath === "/billing/payments") {
    let items = getStored<Payment[]>("payments", SEED_PAYMENTS);
    if (method === "POST") {
      const payload: Partial<Payment> = JSON.parse(options.body as string || "{}");
      const newPay: Payment = {
        id: payload.id || `PAY-${Math.floor(Math.random() * 900 + 100)}`,
        invoiceId: payload.invoiceId || "",
        client: payload.client || "Client",
        amount: payload.amount || 0,
        method: payload.method || "Credit Card",
        date: payload.date || "Today",
        squareTxId: payload.squareTxId || `sqp_${Math.floor(Math.random() * 90000 + 10000)}`,
        xeroReconciled: payload.xeroReconciled !== undefined ? payload.xeroReconciled : true,
        status: payload.status || "Settled",
      };
      setStored("payments", [newPay, ...items]);
      if (payload.invoiceId) {
        const invs = getStored<Invoice[]>("invoices", SEED_INVOICES);
        setStored("invoices", invs.map((i) => i.id === payload.invoiceId ? { ...i, status: "Paid", squareStatus: "Paid", squarePaymentId: newPay.squareTxId } : i));
      }
      return Promise.resolve(newPay as unknown as T);
    }
    const client = qs.get("client")?.toLowerCase();
    const status = qs.get("status");
    if (client) items = items.filter((p) => p.client.toLowerCase().includes(client));
    if (status && status !== "All") items = items.filter((p) => p.status === status);
    return Promise.resolve({
      items,
      total: items.length,
      page: 1,
      pageSize: 50,
      hasMore: false,
    } as unknown as T);
  }

  // /billing/payments/:id
  if (cleanPath.startsWith("/billing/payments/")) {
    const id = cleanPath.replace("/billing/payments/", "");
    const items = getStored<Payment[]>("payments", SEED_PAYMENTS);
    const existingIndex = items.findIndex((p) => p.id === id);

    if (method === "DELETE") {
      if (existingIndex !== -1) {
        items.splice(existingIndex, 1);
        setStored("payments", items);
      }
      return Promise.resolve(undefined as unknown as T);
    }

    if (method === "PUT" || method === "PATCH") {
      if (existingIndex === -1) {
        return Promise.reject(new ApiError("Payment not found", "404"));
      }
      const payload: Partial<Payment> = JSON.parse(options.body as string || "{}");
      const updated = { ...items[existingIndex], ...payload };
      items[existingIndex] = updated;
      setStored("payments", items);
      return Promise.resolve(updated as unknown as T);
    }

    if (existingIndex !== -1) {
      return Promise.resolve(items[existingIndex] as unknown as T);
    }
  }

  // /services
  if (cleanPath === "/services") {
    let items = getStored<ServiceItem[]>("services", SEED_SERVICES);
    if (method === "POST") {
      const payload: Partial<ServiceItem> = JSON.parse(options.body as string || "{}");
      const newSvc: ServiceItem = {
        id: payload.id || `SVC-${Math.floor(Math.random() * 900 + 100)}`,
        name: payload.name || "New Service",
        description: payload.description || "",
        entityTypes: payload.entityTypes || [],
        scope: payload.scope || "",
        status: payload.status || "Active",
      };
      setStored("services", [...items, newSvc]);
      return Promise.resolve(newSvc as unknown as T);
    }
    const status = qs.get("status");
    if (status && status !== "All") items = items.filter((s) => s.status === status);
    return Promise.resolve(items as unknown as T);
  }

  // /services/:id
  if (cleanPath.startsWith("/services/")) {
    const id = cleanPath.replace("/services/", "");
    const items = getStored<ServiceItem[]>("services", SEED_SERVICES);
    const idx = items.findIndex((s) => s.id === id);

    if (method === "DELETE") {
      if (idx !== -1) {
        items.splice(idx, 1);
        setStored("services", items);
      }
      return Promise.resolve(undefined as unknown as T);
    }

    if (method === "PUT") {
      if (idx === -1) return Promise.reject(new ApiError("Service not found", "404"));
      const payload = JSON.parse(options.body as string || "{}");
      const updated = { ...items[idx], ...payload };
      items[idx] = updated;
      setStored("services", items);
      return Promise.resolve(updated as unknown as T);
    }
  }

  // /fees
  if (cleanPath === "/fees") {
    let items = getStored<FeeItem[]>("fees", SEED_FEES);
    if (method === "POST") {
      const payload: Partial<FeeItem> = JSON.parse(options.body as string || "{}");
      const newFee: FeeItem = {
        id: payload.id || `FEE-${Math.floor(Math.random() * 900 + 100)}`,
        service: payload.service || "Service",
        amount: payload.amount || 0,
        basis: payload.basis || "Fixed",
        frequency: payload.frequency || "Annual",
        gst: payload.gst !== undefined ? payload.gst : true,
        notes: payload.notes || "",
      };
      setStored("fees", [...items, newFee]);
      return Promise.resolve(newFee as unknown as T);
    }
    return Promise.resolve(items as unknown as T);
  }

  // /fees/:id
  if (cleanPath.startsWith("/fees/")) {
    const id = cleanPath.replace("/fees/", "");
    const items = getStored<FeeItem[]>("fees", SEED_FEES);
    const idx = items.findIndex((f) => f.id === id);

    if (method === "DELETE") {
      if (idx !== -1) {
        items.splice(idx, 1);
        setStored("fees", items);
      }
      return Promise.resolve(undefined as unknown as T);
    }

    if (method === "PUT") {
      if (idx === -1) return Promise.reject(new ApiError("Fee not found", "404"));
      const payload = JSON.parse(options.body as string || "{}");
      const updated = { ...items[idx], ...payload };
      items[idx] = updated;
      setStored("fees", items);
      return Promise.resolve(updated as unknown as T);
    }
  }

  // /staff
  if (cleanPath === "/staff") {
    let items = getStored<StaffMember[]>("staff", SEED_STAFF);
    if (method === "POST") {
      const payload: Partial<StaffMember> = JSON.parse(options.body as string || "{}");
      const newStaff: StaffMember = {
        id: payload.id || `STF-${Math.floor(Math.random() * 900 + 100)}`,
        name: payload.name || "Staff Name",
        role: payload.role || "Accountant",
        rate: payload.rate || 150,
        currency: payload.currency || "AUD",
        unit: payload.unit || "hour",
        email: payload.email || "",
        status: payload.status || "Active",
      };
      setStored("staff", [...items, newStaff]);
      return Promise.resolve(newStaff as unknown as T);
    }
    return Promise.resolve(items as unknown as T);
  }

  // /staff/:id
  if (cleanPath.startsWith("/staff/")) {
    const id = cleanPath.replace("/staff/", "");
    const items = getStored<StaffMember[]>("staff", SEED_STAFF);
    const idx = items.findIndex((s) => s.id === id);

    if (method === "DELETE") {
      if (idx !== -1) {
        items.splice(idx, 1);
        setStored("staff", items);
      }
      return Promise.resolve(undefined as unknown as T);
    }

    if (method === "PUT") {
      if (idx === -1) return Promise.reject(new ApiError("Staff not found", "404"));
      const payload = JSON.parse(options.body as string || "{}");
      const updated = { ...items[idx], ...payload };
      items[idx] = updated;
      setStored("staff", items);
      return Promise.resolve(updated as unknown as T);
    }
  }

  // /workflows
  if (cleanPath === "/workflows") {
    let items = getStored<WorkflowProcess[]>("workflows", SEED_WORKFLOWS);
    if (method === "POST") {
      const payload: Partial<WorkflowProcess> = JSON.parse(options.body as string || "{}");
      const newWf: WorkflowProcess = {
        id: payload.id || `WF-${Math.floor(Math.random() * 900 + 100)}`,
        name: payload.name || "Workflow",
        description: payload.description || "",
        nodesJson: payload.nodesJson || "[]",
        edgesJson: payload.edgesJson || "[]",
        status: payload.status || "Active",
      };
      setStored("workflows", [newWf, ...items]);
      return Promise.resolve(newWf as unknown as T);
    }
    return Promise.resolve(items as unknown as T);
  }

  // /workflows/:id
  if (cleanPath.startsWith("/workflows/")) {
    const id = cleanPath.replace("/workflows/", "");
    const items = getStored<WorkflowProcess[]>("workflows", SEED_WORKFLOWS);
    const match = items.find((w) => w.id === id) || items[0];

    if (method === "PUT") {
      const payload = JSON.parse(options.body as string || "{}");
      const existingIdx = items.findIndex((w) => w.id === id);
      const updated: WorkflowProcess = {
        ...(existingIdx !== -1 ? items[existingIdx] : items[0]),
        ...payload,
        id,
      };
      if (existingIdx !== -1) {
        items[existingIdx] = updated;
      } else {
        items.unshift(updated);
      }
      setStored("workflows", items);
      return Promise.resolve(updated as unknown as T);
    }

    if (!match) return Promise.reject(new ApiError("Workflow not found", "404"));
    return Promise.resolve(match as unknown as T);
  }

  // /api-keys
  if (cleanPath === "/api-keys") {
    let items = getStored<ApiKeyItem[]>("api_keys", SEED_API_KEYS);
    if (method === "POST") {
      const payload = JSON.parse(options.body as string || "{}");
      const newKey: ApiKeyItem = {
        id: `key-${Math.floor(Math.random() * 90000 + 10000)}`,
        key: payload.key || `entiq_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
        name: payload.name || "API Key",
        isActive: true,
      };
      setStored("api_keys", [newKey, ...items]);
      return Promise.resolve(newKey as unknown as T);
    }
    return Promise.resolve(items as unknown as T);
  }

  // /api-keys/:id
  if (cleanPath.startsWith("/api-keys/") && method === "DELETE") {
    const id = cleanPath.replace("/api-keys/", "");
    const items = getStored<ApiKeyItem[]>("api_keys", SEED_API_KEYS);
    const updated = items.map((k) => (k.id === id ? { ...k, isActive: false } : k));
    setStored("api_keys", updated);
    return Promise.resolve(undefined as unknown as T);
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

  updateStatus: (id: string, status: OnboardingCase["status"]): Promise<OnboardingCase> =>
    apiFetch(`/cases/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  update: (id: string, payload: Partial<OnboardingCase>): Promise<OnboardingCase> =>
    apiFetch(`/cases/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch(`/cases/${id}`, {
      method: "DELETE",
    }),

  requestInfo: (id: string, payload: CaseInfoRequestPayload): Promise<CaseInfoRequestResponse> =>
    apiFetch(`/cases/${id}/request-info`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
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

  resend: (id: string, payload?: { toEmail?: string }): Promise<{ emailDelivered: boolean; message: string; emailMessage?: string; simulated?: boolean; link?: string }> =>
    apiFetch(`/invitations/${id}/resend`, {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    }),

  cancel: (id: string): Promise<void> =>
    apiFetch(`/invitations/${id}/cancel`, { method: "POST" }),

  update: (id: string, inv: Partial<Invitation>): Promise<Invitation> =>
    apiFetch(`/invitations/${id}`, {
      method: "PUT",
      body: JSON.stringify(inv),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch(`/invitations/${id}`, {
      method: "DELETE",
    }),

  getEmailConfig: (): Promise<EmailConfig> => apiFetch("/invitations/email-config"),

  updateEmailConfig: (data: EmailConfigUpdate): Promise<EmailConfig> =>
    apiFetch("/invitations/email-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  testEmail: (payload: TestEmailPayload): Promise<EmailSendResult> =>
    apiFetch("/invitations/test-email", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getPublic: (id: string): Promise<Invitation> =>
    apiFetch(`/invitations/public/${id}`),

  acceptPublic: (id: string): Promise<{ status: string; message: string }> =>
    apiFetch(`/invitations/public/${id}/accept`, {
      method: "POST",
    }),
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

  create: (client: ClientEntity): Promise<ClientEntity> =>
    apiFetch("/clients", {
      method: "POST",
      body: JSON.stringify(client),
    }),

  createBatch: (clientList: ClientEntity[]): Promise<ClientEntity[]> =>
    apiFetch("/clients/batch", {
      method: "POST",
      body: JSON.stringify(clientList),
    }),

  update: (id: string, client: Partial<ClientEntity>): Promise<ClientEntity> =>
    apiFetch(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(client),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch(`/clients/${id}`, {
      method: "DELETE",
    }),
};

// ─── Engagements ───────────────────────────────────────────────────────

export const engagements = {
  list: (params?: { search?: string; status?: string }): Promise<PaginatedResponse<Engagement>> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    return apiFetch(`/engagements${qs.toString() ? `?${qs}` : ""}`);
  },

  create: (engagement: Engagement): Promise<Engagement> =>
    apiFetch("/engagements", {
      method: "POST",
      body: JSON.stringify(engagement),
    }),

  update: (id: string, eng: Partial<Engagement>): Promise<Engagement> =>
    apiFetch(`/engagements/${id}`, {
      method: "PUT",
      body: JSON.stringify(eng),
    }),

  updateStatus: (id: string, status: string): Promise<void> =>
    apiFetch(`/engagements/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch(`/engagements/${id}`, {
      method: "DELETE",
    }),
};

// ─── Activity ─────────────────────────────────────────────────────────────────

export const activity = {
  list: (params?: { filter?: string; page?: number }): Promise<PaginatedResponse<ActivityEvent>> => {
    const qs = new URLSearchParams();
    if (params?.filter && params.filter !== "All") qs.set("filter", params.filter);
    if (params?.page) qs.set("page", String(params.page));
    return apiFetch(`/activity${qs.toString() ? `?${qs}` : ""}`);
  },

  log: (event: Omit<ActivityEvent, "id">): Promise<void> =>
    apiFetch("/activity", {
      method: "POST",
      body: JSON.stringify(event),
    }),
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

// ─── Billing & Payments ───────────────────────────────────────────────────────

export const billing = {
  getStats: (): Promise<BillingStats> => apiFetch("/billing/stats"),

  listSchedules: (params?: { client?: string; status?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<BillingSchedule>> => {
    const qs = new URLSearchParams();
    if (params?.client) qs.set("client", params.client);
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
    return apiFetch(`/billing/schedules${qs.toString() ? `?${qs}` : ""}`);
  },

  createSchedule: (payload: Partial<BillingSchedule>): Promise<BillingSchedule> =>
    apiFetch("/billing/schedules", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateSchedule: (id: string, payload: Partial<BillingSchedule>): Promise<BillingSchedule> =>
    apiFetch(`/billing/schedules/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteSchedule: (id: string): Promise<void> =>
    apiFetch(`/billing/schedules/${id}`, {
      method: "DELETE",
    }),

  listInvoices: (params?: { client?: string; status?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Invoice>> => {
    const qs = new URLSearchParams();
    if (params?.client) qs.set("client", params.client);
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
    return apiFetch(`/billing/invoices${qs.toString() ? `?${qs}` : ""}`);
  },

  createInvoice: (payload: Partial<Invoice>): Promise<Invoice> =>
    apiFetch("/billing/invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateInvoiceStatus: (id: string, status: string): Promise<Invoice> =>
    apiFetch(`/billing/invoices/${id}/status?new_status=${encodeURIComponent(status)}`, {
      method: "PATCH",
    }),

  updateInvoice: (id: string, payload: Partial<Invoice>): Promise<Invoice> =>
    apiFetch(`/billing/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteInvoice: (id: string): Promise<void> =>
    apiFetch(`/billing/invoices/${id}`, {
      method: "DELETE",
    }),

  listPayments: (params?: { client?: string; status?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Payment>> => {
    const qs = new URLSearchParams();
    if (params?.client) qs.set("client", params.client);
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
    return apiFetch(`/billing/payments${qs.toString() ? `?${qs}` : ""}`);
  },

  recordPayment: (payload: Partial<Payment>): Promise<Payment> =>
    apiFetch("/billing/payments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updatePayment: (id: string, payload: Partial<Payment>): Promise<Payment> =>
    apiFetch(`/billing/payments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deletePayment: (id: string): Promise<void> =>
    apiFetch(`/billing/payments/${id}`, {
      method: "DELETE",
    }),
};

// ─── Services & Pricing ───────────────────────────────────────────────────────

export const services = {
  listServices: (status?: string): Promise<ServiceItem[]> => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiFetch(`/services${qs}`);
  },

  createService: (payload: Partial<ServiceItem>): Promise<ServiceItem> =>
    apiFetch("/services", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateService: (id: string, payload: Partial<ServiceItem>): Promise<ServiceItem> =>
    apiFetch(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteService: (id: string): Promise<void> =>
    apiFetch(`/services/${id}`, {
      method: "DELETE",
    }),

  listFees: (): Promise<FeeItem[]> => apiFetch("/fees"),

  createFee: (payload: Partial<FeeItem>): Promise<FeeItem> =>
    apiFetch("/fees", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateFee: (id: string, payload: Partial<FeeItem>): Promise<FeeItem> =>
    apiFetch(`/fees/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteFee: (id: string): Promise<void> =>
    apiFetch(`/fees/${id}`, {
      method: "DELETE",
    }),

  listStaff: (): Promise<StaffMember[]> => apiFetch("/staff"),

  createStaff: (payload: Partial<StaffMember>): Promise<StaffMember> =>
    apiFetch("/staff", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateStaff: (id: string, payload: Partial<StaffMember>): Promise<StaffMember> =>
    apiFetch(`/staff/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteStaff: (id: string): Promise<void> =>
    apiFetch(`/staff/${id}`, {
      method: "DELETE",
    }),
};

// ─── Process Workflows ────────────────────────────────────────────────────────

export const workflows = {
  list: (): Promise<WorkflowProcess[]> => apiFetch("/workflows"),

  get: (id: string): Promise<WorkflowProcess> => apiFetch(`/workflows/${id}`),

  save: (workflow: Partial<WorkflowProcess> & { id: string; name: string }): Promise<WorkflowProcess> =>
    apiFetch(`/workflows/${workflow.id}`, {
      method: "PUT",
      body: JSON.stringify(workflow),
    }),
};

// ─── API Keys Management ──────────────────────────────────────────────────────

export const apiKeys = {
  list: (): Promise<ApiKeyItem[]> => apiFetch("/api-keys"),

  create: (name: string, key?: string): Promise<ApiKeyItem> =>
    apiFetch("/api-keys", {
      method: "POST",
      body: JSON.stringify({ name, key }),
    }),

  revoke: (id: string): Promise<void> =>
    apiFetch(`/api-keys/${id}`, {
      method: "DELETE",
    }),
};

