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

export interface CreateInvitationPayload {
  clientName: string;
  email: string;
  phone?: string;
  clientType: string;
  service: string;
  channel: string;
  dueDate?: string;
  assignTo: string;
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
