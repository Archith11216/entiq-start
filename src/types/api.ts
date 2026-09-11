// API response types — mirrors FastAPI Pydantic schemas

export type CaseStatus =
  | "Draft"
  | "Invited"
  | "In progress"
  | "Awaiting others"
  | "Submitted"
  | "Internal review"
  | "Proposal issued"
  | "Signed"
  | "Acceptance review"
  | "Accepted"
  | "Conditional"
  | "Rejected";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface OnboardingCase {
  id: string;
  client: string;
  entity: string;
  service: string;
  status: CaseStatus;
  risk: RiskLevel;
  owner: string;
  created: string;
  due: string;
  channel: string;
  progress: number;
}

export interface CaseInfoRequestPayload {
  recipientEmail: string;
  message: string;
  subject?: string;
}

export interface CaseInfoRequestResponse {
  delivered: boolean;
  message: string;
  recipientEmail: string;
  status: string;
  simulated?: boolean;
}

export interface ReviewAlert {
  id: string;
  type: "identity" | "document" | "commercial" | "conflict" | "compliance";
  severity: "warning" | "error" | "info";
  case: string;
  message: string;
  age: string;
}

export interface DashboardStats {
  active: number;
  overdue: number;
  accepted: number;
  exceptions: number;
  conversionData: { stage: string; count: number }[];
  completionTrend: { week: string; time: number }[];
}

export interface Invitation {
  id: string;
  client: string;
  email: string;
  service: string;
  channel: string;
  status: string;
  sent: string;
  expires: string;
  owner: string;
  emailDelivered?: boolean;
  emailMessage?: string;
  portalLink?: string;
}

export interface InvitationStats {
  sentThisMonth: number;
  opened: number;
  started: number;
  expiringIn3Days: number;
}

export interface ClientEntity {
  id: string;
  name: string;
  type: string;
  abn: string;
  acn: string;
  status: string;
  verified: string;
  cases: number;
  engagements: number;
  added: string;
}

export interface Engagement {
  id: string;
  client: string;
  service: string;
  signed: string;
  renewalDue: string;
  fee: string;
  status: string;
  adviser: string;
}

export interface ActivityEvent {
  id: number;
  time: string;
  actor: string;
  action: string;
  target: string;
  type: string;
  createdAt?: string;
}

export interface Template {
  id: string;
  name: string;
  type: string;
  service: string;
  version: string;
  status: string;
  updated: string;
  author: string;
}

export interface AdditionalCompany {
  name: string;
  abn?: string;
  acn?: string;
  role?: string;
}

export interface CreateInvitationPayload {
  clientName: string;
  email: string;
  phone?: string;
  clientType: string;
  service: string;
  channel: string;
  dueDate?: string;
  assignTo: string;
  additionalCompanies?: AdditionalCompany[];
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPasswordSet: boolean;
  smtpFromEmail: string;
  smtpFromName: string;
  frontendUrl: string;
  isConfigured: boolean;
}

export interface EmailConfigUpdate {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  frontendUrl?: string;
}

export interface TestEmailPayload {
  toEmail: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
}

export interface EmailSendResult {
  status: string;
  delivered: boolean;
  message?: string;
  simulated?: boolean;
  link?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  initials: string;
  role: string;
  firmName: string;
  avatarUrl?: string;
}

export interface ApiError {
  detail: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Billing & Payments Types ──────────────────────────────────────────────────

export type ScheduleType =
  | "Monthly"
  | "Quarterly"
  | "Annual"
  | "Job-based"
  | "On completion"
  | "Weekly"
  | "Fortnightly";

export type InvoiceStatus = "Draft" | "Sent" | "Due" | "Overdue" | "Paid" | "Voided";
export type XeroStatus = "Synced" | "Pending" | "Error" | "Not synced";
export type SquareStatus = "Paid" | "Pending" | "Failed" | "Refunded" | "—";

export interface BillingSchedule {
  id: string;
  client: string;
  engagementId?: string;
  service: string;
  type: ScheduleType;
  amount: number;
  gst: boolean;
  nextDue: string;
  adviser: string;
  status: "Active" | "Paused" | "Completed";
  squareSubscriptionId?: string;
}

export interface Invoice {
  id: string;
  scheduleId?: string;
  client: string;
  service: string;
  amount: number;
  gst: number;
  issued: string;
  due: string;
  status: InvoiceStatus;
  xeroStatus: XeroStatus;
  xeroInvoiceNo: string;
  squareStatus: SquareStatus;
  squarePaymentId?: string;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  client: string;
  amount: number;
  method: string;
  date: string;
  squareTxId?: string;
  xeroReconciled: boolean;
  status: "Settled" | "Processing" | "Failed" | "Refunded";
}

export interface BillingStats {
  totalRevenueYtd: number;
  collectedThisMonth: number;
  outstandingInvoices: number;
  activeSchedules: number;
  overdueCount: number;
  settledPaymentsCount: number;
}

// ─── Services & Pricing Types ──────────────────────────────────────────────────

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  entityTypes: string[];
  scope: string;
  status: string;
}

export interface FeeItem {
  id: string;
  service: string;
  amount: number;
  basis: string;
  frequency: string;
  gst: boolean;
  notes: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  rate: number;
  currency: string;
  unit: string;
  email: string;
  status: string;
}

// ─── Process Builder Workflow Types ───────────────────────────────────────────

export interface WorkflowProcess {
  id: string;
  name: string;
  description?: string;
  nodesJson: string;
  edgesJson: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
}

// ─── API Key Types ─────────────────────────────────────────────────────────────

export interface ApiKeyItem {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  lastUsedAt?: string;
}

// ─── EnTIQ Start 11-Stage Onboarding Lifecycle & Handoff Types ───────────────────

export type OnboardingStageId =
  | "invitation"
  | "entity_details"
  | "questionnaire"
  | "document_requests"
  | "related_parties"
  | "service_selection"
  | "proposal"
  | "engagement_preparation"
  | "external_module_checks"
  | "internal_acceptance"
  | "client_activated";

export interface OnboardingStageDef {
  id: OnboardingStageId;
  stepNumber: number;
  label: string;
  description: string;
  ownerModule: "EnTIQ Start";
}

export interface ExternalModuleStatuses {
  kyc: {
    status: "Not Started" | "In Progress" | "Review Required" | "Complete";
    provider: string;
    verifiedAt?: string;
    referenceId?: string;
    details?: string;
  };
  compliance: {
    status: "Pending" | "Cleared" | "Alert / Action Required";
    pepCheck: "Clear" | "Match" | "Pending";
    sanctionsCheck: "Clear" | "Match" | "Pending";
    riskRating: RiskLevel;
  };
  esign: {
    status: "Draft" | "Dispatched" | "Viewed" | "Signed";
    documentName?: string;
    dispatchedAt?: string;
    signedAt?: string;
    documentId?: string;
  };
  billingMandate: {
    status: "Pending Client Mandate" | "Direct Debit Authorised" | "Credit Card Mandate On File" | "Invoice on Activation";
    frequency: ScheduleType;
    firstBillingDate?: string;
    mandateReference?: string;
  };
}

export interface PracticeHandoverPayload {
  clientId: string;
  clientName: string;
  entityType: string;
  abn?: string;
  primaryContact: { name: string; email: string; phone?: string };
  acceptedServices: string[];
  engagementDocId?: string;
  billingFrequency: string;
  activatedAt: string;
  activatedBy: string;
  status: "Provisioned in EnTIQ Practice";
}

