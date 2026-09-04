import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Plus, Search, ChevronDown, ChevronRight, ChevronLeft, Trash2, Copy, GitBranch, Fingerprint, ScanFace, FileCheck, CreditCard, MessageSquare, UserCog, Network, Pen, ZoomIn, ZoomOut, Maximize2, Play, Save, RotateCcw, Sparkles, Wand2, Pencil, BookOpen, Scale, Briefcase, Hash, List, PenLine, CheckSquare, X, Users, FileText, Shield, CheckCircle, UserCheck, Layers, Workflow, AlertTriangle, Building2, Eye } from "lucide-react";

// ─── Process Builder ─────────────────────────────────────────────────────────

const STEP_W = 210;
const STEP_H = 82;

interface PaletteItem {
  type: string;
  label: string;
  category: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  description: string;
  price?: string;
  hasCondition?: boolean;
  integration?: "entiq-kyc" | "esign";
}

interface FlowNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  color: string;
  bg: string;
  icon: React.ReactNode;
  description: string;
  config: Record<string, unknown>;
  integration?: "entiq-kyc" | "esign";
}

interface FlowEdge {
  id: string;
  fromId: string;
  toId: string;
  condition: "always" | "pass" | "fail";
}

const PALETTE: PaletteItem[] = [
  // Entry
  { type: "welcome", label: "Welcome", category: "Entry", color: "#2855A6", bg: "#EEF2FA", icon: <Layers size={14} />, description: "Practice intro and steps overview", price: "Free" },
  { type: "auth", label: "Authentication", category: "Entry", color: "#2855A6", bg: "#EEF2FA", icon: <UserCog size={14} />, description: "Account creation or passkey sign-in", price: "Free" },
  // Identity — routed through Entiq KYC
  { type: "contact-verify", label: "Contact Verification", category: "Identity", color: "#20BCA4", bg: "#E3F8F5", icon: <CheckCircle size={14} />, description: "Verify email and mobile number", price: "Free" },
  { type: "id-document", label: "ID Document Check", category: "Identity", color: "#20BCA4", bg: "#E3F8F5", icon: <FileCheck size={14} />, description: "Passport, licence or national ID — via Entiq KYC", price: "$0.25", hasCondition: true, integration: "entiq-kyc" },
  { type: "biometric", label: "Biometric Check", category: "Identity", color: "#20BCA4", bg: "#E3F8F5", icon: <ScanFace size={14} />, description: "Liveness detection and face match — via Entiq KYC", price: "$0.20", hasCondition: true, integration: "entiq-kyc" },
  { type: "nfc-verify", label: "NFC Verification", category: "Identity", color: "#20BCA4", bg: "#E3F8F5", icon: <Fingerprint size={14} />, description: "Chip-based NFC passport read — via Entiq KYC", price: "$0.15", hasCondition: true, integration: "entiq-kyc" },
  { type: "manual-verify", label: "Manual Verification", category: "Identity", color: "#20BCA4", bg: "#E3F8F5", icon: <UserCheck size={14} />, description: "Staff-reviewed fallback path (no KYC session)", price: "Free" },
  // Information
  { type: "personal-info", label: "Personal Information", category: "Information", color: "#6B7280", bg: "#F3F4F6", icon: <Users size={14} />, description: "Name, DOB, address, residency", price: "Free" },
  { type: "entity-info", label: "Entity Information", category: "Information", color: "#6B7280", bg: "#F3F4F6", icon: <Building2 size={14} />, description: "Company, trust, SMSF details", price: "Free" },
  { type: "ownership", label: "Beneficial Ownership", category: "Information", color: "#6B7280", bg: "#F3F4F6", icon: <Network size={14} />, description: "Ownership and control mapping", price: "Free" },
  { type: "questionnaire", label: "Questionnaire", category: "Information", color: "#6B7280", bg: "#F3F4F6", icon: <MessageSquare size={14} />, description: "Conditional dynamic questions", price: "Free" },
  { type: "doc-request", label: "Document Request", category: "Information", color: "#6B7280", bg: "#F3F4F6", icon: <FileText size={14} />, description: "Collect and classify evidence", price: "Free" },
  // Commercial
  { type: "service-select", label: "Service Selection", category: "Commercial", color: "#D97706", bg: "#FEF3C7", icon: <Layers size={14} />, description: "Client selects required services", price: "Free" },
  { type: "proposal", label: "Proposal Review", category: "Commercial", color: "#D97706", bg: "#FEF3C7", icon: <FileText size={14} />, description: "Fee schedule and engagement terms", price: "Free" },
  { type: "consent", label: "Consent Centre", category: "Commercial", color: "#D97706", bg: "#FEF3C7", icon: <Shield size={14} />, description: "Privacy and marketing permissions", price: "Free" },
  { type: "signing", label: "E-Signature", category: "Commercial", color: "#D97706", bg: "#FEF3C7", icon: <Pen size={14} />, description: "Sign engagement letter — via eSign", price: "Free", integration: "esign" },
  { type: "payment", label: "Payment Authority", category: "Commercial", color: "#D97706", bg: "#FEF3C7", icon: <CreditCard size={14} />, description: "Direct debit or card mandate", price: "Free" },
  // Internal
  { type: "internal-review", label: "Internal Review", category: "Internal", color: "#D0021B", bg: "#FCE8EB", icon: <Eye size={14} />, description: "Practice completeness and risk checks", price: "Free" },
  { type: "decision", label: "Acceptance Decision", category: "Internal", color: "#D0021B", bg: "#FCE8EB", icon: <GitBranch size={14} />, description: "Accept, condition or reject", price: "Free", hasCondition: true },
];

const CATEGORY_ORDER = ["Entry", "Identity", "Information", "Commercial", "Internal"];
const CATEGORY_COLORS: Record<string, string> = {
  Entry: "#2855A6", Identity: "#20BCA4", Information: "#6B7280", Commercial: "#D97706", Internal: "#D0021B", Custom: "#7C3AED",
};

// Right panel config fields per step type
const STEP_CONFIG: Record<string, { label: string; type: string; options?: string[]; default?: unknown; note?: string }[]> = {
  "id-document": [
    { label: "Accepted document types", type: "multicheck", options: ["Passport", "Driver licence", "National ID card", "Birth certificate"], default: ["Passport", "Driver licence"] },
    { label: "KYC provider", type: "select", options: ["Entiq KYC", "Manual fallback"], default: "Entiq KYC" },
    { label: "Allow manual fallback", type: "toggle", default: true },
  ],
  "biometric": [
    { label: "Checks required", type: "multicheck", options: ["Liveness", "Face match", "NFC chip"], default: ["Liveness", "Face match"] },
    { label: "KYC provider", type: "select", options: ["Entiq KYC", "Internal review"], default: "Entiq KYC" },
    { label: "Fail action", type: "select", options: ["Route to manual verification", "Block progress", "Flag for review"], default: "Route to manual verification" },
  ],
  "nfc-verify": [
    { label: "KYC provider", type: "select", options: ["Entiq KYC"], default: "Entiq KYC" },
    { label: "Require face match after NFC", type: "toggle", default: true },
  ],
  "questionnaire": [
    { label: "Questionnaire template", type: "select", options: ["Individual Onboarding Questions v7", "Company Onboarding Questions v5", "AML/CTF Risk Questions v3", "Tax Information Questions v2", "Legal Matter Intake v1", "Custom"], default: "Individual Onboarding Questions v7" },
    { label: "Allow delegate", type: "toggle", default: false },
    { label: "Require declaration", type: "toggle", default: true },
    { label: "Save progress between sessions", type: "toggle", default: true },
  ],
  "doc-request": [
    { label: "Required documents", type: "multicheck", options: ["Trust deed", "Company constitution", "SMSF establishment deed", "Proof of address", "Bank statement", "Financial statements", "Tax return (prior year)", "Partnership agreement", "Shareholder register"], default: [] },
    { label: "Allow multiple uploads per type", type: "toggle", default: true },
    { label: "Run Document AI analysis", type: "toggle", default: true },
  ],
  "signing": [
    { label: "Engagement template", type: "select", options: ["Individual Tax Engagement v4", "Company Tax + BAS Engagement v3", "Trust Tax Engagement v2", "SMSF Administration Engagement v2", "Legal Retainer Agreement v1", "Advisory Engagement v1"], default: "Individual Tax Engagement v4" },
    { label: "eSign provider", type: "select", options: ["eSign", "Manual (PDF)"], default: "eSign" },
    { label: "Require all signatories", type: "toggle", default: true },
    { label: "Notify firm on signature", type: "toggle", default: true },
  ],
  "decision": [
    { label: "Auto-accept if no exceptions", type: "toggle", default: false },
    { label: "Required approver", type: "select", options: ["Any staff", "Accountant or adviser", "Partner or principal", "Compliance officer"], default: "Partner or principal" },
    { label: "Allow conditional acceptance", type: "toggle", default: true },
  ],
  "ownership": [
    { label: "Ownership threshold (%)", type: "select", options: ["25% or more", "10% or more", "Any interest"], default: "25% or more" },
    { label: "Require UBO declaration", type: "toggle", default: true },
    { label: "Include controllers", type: "toggle", default: true },
  ],
  "proposal": [
    { label: "Fee display", type: "select", options: ["Annual fee only", "Monthly breakdown", "Hourly + estimate", "Custom"], default: "Annual fee only" },
    { label: "Allow client to counter-propose", type: "toggle", default: false },
    { label: "Show comparable services", type: "toggle", default: false },
  ],
  "consent": [
    { label: "Consent items", type: "multicheck", options: ["Privacy collection notice", "Marketing communications", "Third-party sharing", "ATO data exchange", "Referral to related parties"], default: ["Privacy collection notice"] },
    { label: "Require explicit opt-in for each", type: "toggle", default: true },
  ],
};

function makeInitialConfig(type: string): Record<string, unknown> {
  const fields = STEP_CONFIG[type] ?? [];
  const cfg: Record<string, unknown> = { required: true, allowSkip: false, saveResume: true, notes: "" };
  for (const f of fields) {
    if (f.default !== undefined) cfg[f.label] = f.default;
  }
  return cfg;
}

function makePaletteNode(type: string, x: number, y: number, id?: string): FlowNode {
  const p = PALETTE.find(p => p.type === type)!;
  return {
    id: id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: p.type,
    label: p.label,
    x,
    y,
    color: p.color,
    bg: p.bg,
    icon: p.icon,
    description: p.description,
    config: makeInitialConfig(p.type),
    integration: p.integration,
  };
}

const TEMPLATES: Record<string, { label: string; description: string; nodes: FlowNode[]; edges: FlowEdge[] }> = (() => {
  const individual = [
    makePaletteNode("welcome", 320, 30, "t1-1"),
    makePaletteNode("contact-verify", 320, 150, "t1-2"),
    makePaletteNode("id-document", 320, 270, "t1-3"),
    makePaletteNode("biometric", 320, 390, "t1-4"),
    makePaletteNode("personal-info", 320, 510, "t1-5"),
    makePaletteNode("questionnaire", 320, 630, "t1-6"),
    makePaletteNode("consent", 320, 750, "t1-7"),
    makePaletteNode("signing", 320, 870, "t1-8"),
  ];
  const iEdges: FlowEdge[] = individual.slice(0, -1).map((n, i) => ({
    id: `e1-${i}`, fromId: n.id, toId: individual[i + 1].id, condition: "always"
  }));
  // biometric pass/fail branches
  const company = [
    makePaletteNode("welcome", 320, 30, "t2-1"),
    makePaletteNode("contact-verify", 320, 150, "t2-2"),
    makePaletteNode("id-document", 320, 270, "t2-3"),
    makePaletteNode("biometric", 320, 390, "t2-4"),
    makePaletteNode("manual-verify", 560, 390, "t2-4b"),
    makePaletteNode("personal-info", 320, 510, "t2-5"),
    makePaletteNode("entity-info", 320, 630, "t2-6"),
    makePaletteNode("ownership", 320, 750, "t2-7"),
    makePaletteNode("doc-request", 320, 870, "t2-8"),
    makePaletteNode("service-select", 320, 990, "t2-9"),
    makePaletteNode("proposal", 320, 1110, "t2-10"),
    makePaletteNode("consent", 320, 1230, "t2-11"),
    makePaletteNode("signing", 320, 1350, "t2-12"),
    makePaletteNode("internal-review", 320, 1470, "t2-13"),
    makePaletteNode("decision", 320, 1590, "t2-14"),
  ];
  const cEdges: FlowEdge[] = [
    { id: "ce1", fromId: "t2-1", toId: "t2-2", condition: "always" },
    { id: "ce2", fromId: "t2-2", toId: "t2-3", condition: "always" },
    { id: "ce3", fromId: "t2-3", toId: "t2-4", condition: "always" },
    { id: "ce4", fromId: "t2-4", toId: "t2-5", condition: "pass" },
    { id: "ce4b", fromId: "t2-4", toId: "t2-4b", condition: "fail" },
    { id: "ce4c", fromId: "t2-4b", toId: "t2-5", condition: "always" },
    { id: "ce5", fromId: "t2-5", toId: "t2-6", condition: "always" },
    { id: "ce6", fromId: "t2-6", toId: "t2-7", condition: "always" },
    { id: "ce7", fromId: "t2-7", toId: "t2-8", condition: "always" },
    { id: "ce8", fromId: "t2-8", toId: "t2-9", condition: "always" },
    { id: "ce9", fromId: "t2-9", toId: "t2-10", condition: "always" },
    { id: "ce10", fromId: "t2-10", toId: "t2-11", condition: "always" },
    { id: "ce11", fromId: "t2-11", toId: "t2-12", condition: "always" },
    { id: "ce12", fromId: "t2-12", toId: "t2-13", condition: "always" },
    { id: "ce13", fromId: "t2-13", toId: "t2-14", condition: "always" },
  ];
  const docNodes = [
    makePaletteNode("doc-request", 320, 30, "t3-1"),
    makePaletteNode("questionnaire", 320, 150, "t3-2"),
    makePaletteNode("internal-review", 320, 270, "t3-3"),
    makePaletteNode("decision", 320, 390, "t3-4"),
  ];
  const docEdges: FlowEdge[] = docNodes.slice(0, -1).map((n, i) => ({
    id: `de${i}`, fromId: n.id, toId: docNodes[i + 1].id, condition: "always"
  }));
  const engNodes = [
    makePaletteNode("service-select", 320, 30, "t4-1"),
    makePaletteNode("proposal", 320, 150, "t4-2"),
    makePaletteNode("consent", 320, 270, "t4-3"),
    makePaletteNode("signing", 320, 390, "t4-4"),
    makePaletteNode("payment", 320, 510, "t4-5"),
    makePaletteNode("internal-review", 320, 630, "t4-6"),
    makePaletteNode("decision", 320, 750, "t4-7"),
  ];
  const engEdges: FlowEdge[] = engNodes.slice(0, -1).map((n, i) => ({
    id: `ee${i}`, fromId: n.id, toId: engNodes[i + 1].id, condition: "always"
  }));
  return {
    individual: { label: "Individual Onboarding", description: "Standard individual client onboarding with ID and biometric verification", nodes: individual, edges: iEdges },
    company: { label: "Company + KYC/AML", description: "Full company onboarding with beneficial ownership and staff review — includes Entiq KYC identity checks", nodes: company, edges: cEdges },
    documents: { label: "Document Collection", description: "Targeted evidence collection and internal review", nodes: docNodes, edges: docEdges },
    engagement: { label: "Engagement Process", description: "Service selection through to signed engagement and payment", nodes: engNodes, edges: engEdges },
  };
})();

function edgeColor(condition: FlowEdge["condition"]) {
  if (condition === "pass") return "#2EA843";
  if (condition === "fail") return "#D0021B";
  return "#9CA3AF";
}

function getPortPos(node: FlowNode, port: "in" | "out") {
  return {
    x: node.x + STEP_W / 2,
    y: port === "in" ? node.y : node.y + STEP_H,
  };
}

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const cy = Math.max(60, Math.abs(y2 - y1) * 0.5);
  return `M ${x1} ${y1} C ${x1} ${y1 + cy}, ${x2} ${y2 - cy}, ${x2} ${y2}`;
}

// ─── AI prompt → flow generator ──────────────────────────────────────────────

function generateFlowFromPrompt(prompt: string): { nodes: FlowNode[]; edges: FlowEdge[]; explanation: string; stepCount: number } {
  const p = prompt.toLowerCase();

  const isLegal = /\b(legal|law|matter|retainer|litigation|contract|conveyancing|estate|probate|will|solicitor|barrister|dispute)\b/.test(p);
  const isAccounting = /\b(tax|accounting|bas|gst|ato|smsf|audit|financial|bookkeeping|accountant)\b/.test(p);
  const isKyc = /\b(kyc|aml|ctf|identity|id check|verify|compliance|pep|sanction|anti.?money)\b/.test(p);
  const isCompany = /\b(company|companies|corporate|corporation|pty|ltd|inc|business entity)\b/.test(p);
  const isTrust = /\b(trust|trustee|beneficiar|family trust|unit trust)\b/.test(p);
  const isSmsf = /\b(smsf|self.?managed|super fund)\b/.test(p);
  const isIndividual = /\b(individual|person|personal|sole.?trader|human|client person)\b/.test(p) && !isCompany && !isTrust && !isSmsf;
  const needsAuth = /\b(account|portal|secure|register|login|sign.?in)\b/.test(p);
  const needsOwnership = isCompany || isTrust || /\b(ownership|ubo|beneficial.?owner|controller|director|shareholder)\b/.test(p);
  const needsDocs = isCompany || isTrust || isSmsf || isLegal || /\b(document|upload|deed|constitution|evidence|certificate|statement|file)\b/.test(p);
  const needsEngagement = /\b(engage|engagement|letter|proposal|fee|quote|retainer|scope|agreement|service|sign|sign up)\b/.test(p);
  const needsPayment = /\b(payment|debit|card|direct.?debit|billing|upfront|mandate)\b/.test(p);
  const needsReview = isKyc || isCompany || isTrust || /\b(review|compliance|risk|accept|decision|approve|internal|reject)\b/.test(p);

  const steps: string[] = ["welcome"];
  if (needsAuth) steps.push("auth");
  if (isKyc || isCompany || isTrust || /\b(contact|verify.?email|email verify)\b/.test(p)) steps.push("contact-verify");
  if (isKyc || /\b(id|identity|passport|licence|document.?check|photo.?id)\b/.test(p)) {
    steps.push("id-document");
    if (isKyc || /\b(biometric|face|liveness|facial)\b/.test(p)) steps.push("biometric");
  }
  if (isIndividual || (!isCompany && !isTrust && !isSmsf)) steps.push("personal-info");
  if (isCompany || isTrust || isSmsf) steps.push("entity-info");
  if (needsOwnership) steps.push("ownership");
  steps.push("questionnaire");
  if (needsDocs) steps.push("doc-request");
  if (needsEngagement) {
    if (/\b(choose|select|multiple service|scope of work|pick service)\b/.test(p)) steps.push("service-select");
    steps.push("proposal");
  }
  if (!steps.includes("consent")) steps.push("consent");
  if (needsEngagement) steps.push("signing");
  if (needsPayment) steps.push("payment");
  if (needsReview) {
    steps.push("internal-review");
    steps.push("decision");
  }

  const unique = [...new Set(steps)];
  const nodes = unique.map((type, i) => makePaletteNode(type, 340, 30 + i * 120, `ai-${Date.now()}-${i}`));
  const edges = nodes.slice(0, -1).map((n, i) => ({
    id: `ae-${Date.now()}-${i}`, fromId: n.id, toId: nodes[i + 1].id, condition: "always" as const,
  }));

  const context = [
    isLegal ? "legal" : isAccounting ? "accounting" : "professional services",
    isKyc ? "with KYC/AML identity checks" : "",
    isCompany ? "for a company" : isTrust ? "for a trust" : isSmsf ? "for an SMSF" : isIndividual ? "for an individual" : "",
  ].filter(Boolean).join(" ");

  const explanation = `Generated a ${unique.length}-step ${context} flow. Adjust any step by clicking it, or drag new steps from the palette.`;
  return { nodes, edges, explanation, stepCount: unique.length };
}

const AI_SUGGESTIONS = [
  "Individual tax client onboarding with identity verification",
  "Company KYC/AML onboarding with beneficial ownership",
  "Legal retainer intake for a new commercial matter",
  "SMSF client onboarding with document collection",
  "Trust setup with AML compliance and engagement letter",
  "Quick document collection and internal review only",
];

const CUSTOM_STEP_ICONS: { key: string; el: React.ReactNode; label: string }[] = [
  { key: "file-text", el: <FileText size={14} />, label: "Document" },
  { key: "message", el: <MessageSquare size={14} />, label: "Message" },
  { key: "users", el: <Users size={14} />, label: "People" },
  { key: "shield", el: <Shield size={14} />, label: "Shield" },
  { key: "check", el: <CheckCircle size={14} />, label: "Check" },
  { key: "pen", el: <PenLine size={14} />, label: "Pen" },
  { key: "book", el: <BookOpen size={14} />, label: "Book" },
  { key: "scale", el: <Scale size={14} />, label: "Scale" },
  { key: "briefcase", el: <Briefcase size={14} />, label: "Briefcase" },
  { key: "hash", el: <Hash size={14} />, label: "Number" },
  { key: "list", el: <List size={14} />, label: "List" },
  { key: "check-square", el: <CheckSquare size={14} />, label: "Checkbox" },
  { key: "eye", el: <Eye size={14} />, label: "Review" },
  { key: "credit", el: <CreditCard size={14} />, label: "Payment" },
  { key: "network", el: <Network size={14} />, label: "Network" },
  { key: "building", el: <Building2 size={14} />, label: "Entity" },
];

const CUSTOM_STEP_COLORS = [
  { key: "blue", color: "#2855A6", bg: "#EEF2FA" },
  { key: "teal", color: "#20BCA4", bg: "#E3F8F5" },
  { key: "gray", color: "#6B7280", bg: "#F3F4F6" },
  { key: "amber", color: "#D97706", bg: "#FEF3C7" },
  { key: "red", color: "#D0021B", bg: "#FCE8EB" },
  { key: "purple", color: "#7C3AED", bg: "#EDE9FE" },
  { key: "green", color: "#1E7A31", bg: "#E8F7EB" },
  { key: "indigo", color: "#3730A3", bg: "#E0E7FF" },
];

function getIconEl(key: string): React.ReactNode {
  return CUSTOM_STEP_ICONS.find(i => i.key === key)?.el ?? <FileText size={14} />;
}

function ProcessBuilderScreen() {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [templateKey, setTemplateKey] = useState<string>("individual");
  const [nodes, setNodes] = useState<FlowNode[]>(() => TEMPLATES.individual.nodes);
  const [edges, setEdges] = useState<FlowEdge[]>(() => TEMPLATES.individual.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processName, setProcessName] = useState("Individual Onboarding");
  const [editingName, setEditingName] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectCond, setConnectCond] = useState<FlowEdge["condition"]>("always");
  const [zoom, setZoom] = useState(1);
  const [preview, setPreview] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // ── [5] Undo/Redo ────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] }[]>([]);
  const [future, setFuture] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] }[]>([]);

  // ── [7] Canvas panning ───────────────────────────────────────────────────────
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [spaceDown, setSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // ── [13] Publish / Draft ─────────────────────────────────────────────────────
  const [isDraft, setIsDraft] = useState(true);
  const [version, setVersion] = useState(1);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // ── [25] Applied-to client types ─────────────────────────────────────────────
  const [appliedTypes, setAppliedTypes] = useState<string[]>(["Individual"]);

  // ── [14] Palette search / [16] Collapse ──────────────────────────────────────
  const [paletteSearch, setPaletteSearch] = useState("");
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [configCollapsed, setConfigCollapsed] = useState(false);

  // ── [12] Validation ──────────────────────────────────────────────────────────
  const [showValidation, setShowValidation] = useState(false);

  // ── [23] Edge hover (safe delete) ────────────────────────────────────────────
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  // ── [21] Minimap ─────────────────────────────────────────────────────────────
  const [showMinimap, setShowMinimap] = useState(true);

  // AI builder
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{ nodes: FlowNode[]; edges: FlowEdge[]; explanation: string; stepCount: number } | null>(null);

  // Custom step creator
  const [showCreateStep, setShowCreateStep] = useState(false);
  const [customSteps, setCustomSteps] = useState<PaletteItem[]>([]);
  const [newStep, setNewStep] = useState({ name: "", description: "", category: "Custom", iconKey: "file-text", colorKey: "gray" });

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Stable refs for keyboard handler (avoid stale closures)
  const nodesRef = useRef(nodes); nodesRef.current = nodes;
  const edgesRef = useRef(edges); edgesRef.current = edges;
  const selectedIdRef = useRef(selectedId); selectedIdRef.current = selectedId;
  const historyRef = useRef(history); historyRef.current = history;
  const futureRef = useRef(future); futureRef.current = future;

  // ── [8] Grid snap ─────────────────────────────────────────────────────────────
  const SNAP = 20;
  function snapV(v: number) { return Math.round(v / SNAP) * SNAP; }

  // ── [5] History helpers ───────────────────────────────────────────────────────
  function pushHistory(ns = nodesRef.current, es = edgesRef.current) {
    setHistory(prev => [...prev.slice(-29), { nodes: ns.map(n => ({ ...n })), edges: es.map(e => ({ ...e })) }]);
    setFuture([]);
  }

  function undo() {
    const h = historyRef.current;
    if (!h.length) return;
    const prev = h[h.length - 1];
    setFuture(f => [{ nodes: nodesRef.current.map(n => ({ ...n })), edges: edgesRef.current.map(e => ({ ...e })) }, ...f.slice(0, 29)]);
    setHistory(h2 => h2.slice(0, -1));
    setNodes(prev.nodes);
    setEdges(prev.edges);
  }

  function redo() {
    const f = futureRef.current;
    if (!f.length) return;
    const next = f[0];
    setHistory(prev => [...prev.slice(-29), { nodes: nodesRef.current.map(n => ({ ...n })), edges: edgesRef.current.map(e => ({ ...e })) }]);
    setFuture(prev => prev.slice(1));
    setNodes(next.nodes);
    setEdges(next.edges);
  }

  // ── Config helper ─────────────────────────────────────────────────────────────
  function updateNodeConfig(id: string, key: string, value: unknown) {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, config: { ...n.config, [key]: value } } : n));
  }

  // ── [20] Step numbers via BFS ─────────────────────────────────────────────────
  const stepNumbers = useMemo(() => {
    const map: Record<string, number> = {};
    const entryIds = nodes.filter(n => !edges.some(e => e.toId === n.id)).map(n => n.id);
    const visited = new Set<string>();
    const queue = [...entryIds];
    let num = 1;
    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      map[id] = num++;
      edges.filter(e => e.fromId === id).forEach(e => queue.push(e.toId));
    }
    return map;
  }, [nodes, edges]);

  // ── [12] Validation ───────────────────────────────────────────────────────────
  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (!nodes.length) return issues;
    const entryNodes = nodes.filter(n => !edges.some(e => e.toId === n.id));
    const orphans = nodes.filter(n => !edges.some(e => e.fromId === n.id || e.toId === n.id));
    if (entryNodes.length > 1) issues.push(`${entryNodes.length} separate entry points — consider merging`);
    if (orphans.length) issues.push(`${orphans.length} step${orphans.length > 1 ? "s" : ""} with no connections`);
    if (!nodes.filter(n => !edges.some(e => e.fromId === n.id)).length) issues.push("No terminal step — one step should have no outgoing connections");
    return issues;
  }, [nodes, edges]);

  // ── [11] Branch map for preview ───────────────────────────────────────────────
  const branchMap = useMemo(() => {
    const map: Record<string, { pass?: string; fail?: string }> = {};
    edges.forEach(e => {
      if (e.condition === "pass" || e.condition === "fail") {
        if (!map[e.fromId]) map[e.fromId] = {};
        const target = nodes.find(n => n.id === e.toId);
        if (target) map[e.fromId][e.condition] = target.label;
      }
    });
    return map;
  }, [edges, nodes]);

  // ── [6] Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const inInput = !!(e.target as HTMLElement).closest("input, textarea, select");
      if (e.code === "Space" && !inInput) { e.preventDefault(); setSpaceDown(true); }
      if (e.key === "Escape") { setPreview(false); setShowAiPanel(false); setConnectingFrom(null); setSelectedId(null); }
      if ((e.key === "Delete" || e.key === "Backspace") && !inInput && selectedIdRef.current) {
        pushHistory(nodesRef.current, edgesRef.current);
        setNodes(prev => prev.filter(n => n.id !== selectedIdRef.current));
        setEdges(prev => prev.filter(ed => ed.fromId !== selectedIdRef.current && ed.toId !== selectedIdRef.current));
        setSelectedId(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "d" && selectedIdRef.current) {
        e.preventDefault();
        const orig = nodesRef.current.find(n => n.id === selectedIdRef.current);
        if (orig) {
          pushHistory(nodesRef.current, edgesRef.current);
          const dup: FlowNode = { ...orig, id: `n-${Date.now()}-${Math.random().toString(36).slice(2)}`, x: orig.x + 40, y: orig.y + 40 };
          setNodes(prev => [...prev, dup]);
          setSelectedId(dup.id);
        }
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") { setSpaceDown(false); setIsPanning(false); panStart.current = null; }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => { document.removeEventListener("keydown", onKeyDown); document.removeEventListener("keyup", onKeyUp); };
  }, []); // eslint-disable-line

  // ── [4] Template loading with confirmation ────────────────────────────────────
  function loadTemplate(key: string, skipConfirm = false) {
    if (!skipConfirm && nodes.length > 0 && !window.confirm("Load template? This will replace your current canvas.")) return;
    const t = TEMPLATES[key];
    setTemplateKey(key);
    setNodes(t.nodes.map(n => ({ ...n })));
    setEdges(t.edges.map(e => ({ ...e })));
    setProcessName(t.label);
    setSelectedId(null);
    setConnectingFrom(null);
    setPanOffset({ x: 0, y: 0 });
    setHistory([]);
    setFuture([]);
  }

  // ── Drag from palette ─────────────────────────────────────────────────────────
  function handlePaletteDragStart(e: React.DragEvent, type: string) {
    e.dataTransfer.setData("paletteType", type);
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData("paletteType");
    if (!type || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // [1] Correct coord calc accounting for pan and zoom
    const x = snapV(Math.max(0, (e.clientX - rect.left - panOffset.x) / zoom - STEP_W / 2));
    const y = snapV(Math.max(0, (e.clientY - rect.top - panOffset.y) / zoom - STEP_H / 2));
    const customItem = customSteps.find(c => c.type === type);
    let node: FlowNode;
    if (customItem) {
      node = {
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: customItem.type, label: customItem.label, x, y,
        color: customItem.color, bg: customItem.bg, icon: customItem.icon,
        description: customItem.description,
        config: { required: true, allowSkip: false, saveResume: true, notes: "" },
      };
    } else {
      node = makePaletteNode(type, x, y);
    }
    pushHistory();
    setNodes(prev => [...prev, node]);
    setSelectedId(node.id);
  }

  // ── [7] Node dragging ─────────────────────────────────────────────────────────
  function handleStepMouseDown(e: React.MouseEvent, id: string) {
    if (connectingFrom || spaceDown) return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === id)!;
    dragging.current = { id, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y };
    if (id !== selectedId) setSelectedId(id);
  }

  function handleContainerMouseDown(e: React.MouseEvent) {
    if (spaceDown) {
      panStart.current = { x: e.clientX, y: e.clientY, px: panOffset.x, py: panOffset.y };
      setIsPanning(true);
    }
  }

  const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && panStart.current) {
      setPanOffset({ x: panStart.current.px + e.clientX - panStart.current.x, y: panStart.current.py + e.clientY - panStart.current.y });
    }
    if (!dragging.current) return;
    const dx = (e.clientX - dragging.current.startX) / zoom;
    const dy = (e.clientY - dragging.current.startY) / zoom;
    setNodes(prev => prev.map(n => n.id === dragging.current!.id
      ? { ...n, x: snapV(Math.max(0, dragging.current!.origX + dx)), y: snapV(Math.max(0, dragging.current!.origY + dy)) }
      : n));
  }, [zoom, isPanning]);

  function handleContainerMouseUp() {
    dragging.current = null;
    if (isPanning) { setIsPanning(false); panStart.current = null; }
  }

  function handleCanvasClick(e: React.MouseEvent) {
    if (spaceDown) return;
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    setSelectedId(null);
    setConnectingFrom(null);
  }

  // ── Connection ports ──────────────────────────────────────────────────────────
  function handleOutputPort(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setConnectingFrom(connectingFrom ? null : id);
  }

  function handleInputPort(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!connectingFrom || connectingFrom === id) { setConnectingFrom(null); return; }
    if (!edges.some(ed => ed.fromId === connectingFrom && ed.toId === id)) {
      pushHistory();
      setEdges(prev => [...prev, { id: `e-${Date.now()}`, fromId: connectingFrom, toId: id, condition: connectCond }]);
    }
    setConnectingFrom(null);
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  function deleteSelected() {
    if (!selectedId) return;
    pushHistory();
    setNodes(prev => prev.filter(n => n.id !== selectedId));
    setEdges(prev => prev.filter(e => e.fromId !== selectedId && e.toId !== selectedId));
    setSelectedId(null);
  }

  function deleteEdge(edgeId: string) {
    pushHistory();
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    setHoveredEdge(null);
  }

  // ── [10] Duplicate ────────────────────────────────────────────────────────────
  function duplicateNode() {
    if (!selectedId) return;
    const orig = nodes.find(n => n.id === selectedId);
    if (!orig) return;
    pushHistory();
    const dup: FlowNode = { ...orig, id: `n-${Date.now()}-${Math.random().toString(36).slice(2)}`, x: orig.x + 40, y: orig.y + 40 };
    setNodes(prev => [...prev, dup]);
    setSelectedId(dup.id);
  }

  // ── [9] Auto-layout ───────────────────────────────────────────────────────────
  function autoLayout() {
    if (!nodes.length) return;
    pushHistory();
    const entryIds = nodes.filter(n => !edges.some(e => e.toId === n.id)).map(n => n.id);
    const levels = new Map<string, number>();
    const queue: [string, number][] = entryIds.map(id => [id, 0]);
    while (queue.length) {
      const [id, lv] = queue.shift()!;
      if (levels.has(id) && levels.get(id)! >= lv) continue;
      levels.set(id, lv);
      edges.filter(e => e.fromId === id).forEach(e => queue.push([e.toId, lv + 1]));
    }
    nodes.forEach(n => { if (!levels.has(n.id)) levels.set(n.id, 0); });
    const byLevel = new Map<number, string[]>();
    for (const [id, lv] of levels) {
      if (!byLevel.has(lv)) byLevel.set(lv, []);
      byLevel.get(lv)!.push(id);
    }
    const newNodes = nodes.map(n => {
      const lv = levels.get(n.id) ?? 0;
      const levelIds = byLevel.get(lv) ?? [n.id];
      const idx = levelIds.indexOf(n.id);
      const colCount = levelIds.length;
      const totalW = colCount * STEP_W + (colCount - 1) * 80;
      const baseX = Math.max(40, 420 - totalW / 2);
      return { ...n, x: snapV(baseX + idx * (STEP_W + 80)), y: snapV(40 + lv * (STEP_H + 60)) };
    });
    setNodes(newNodes);
    setPanOffset({ x: 0, y: 0 });
  }

  // ── [13] Save / Publish ───────────────────────────────────────────────────────
  function handleSave() {
    setSavedMsg(true);
    setVersion(v => v + 1);
    setLastSaved(new Date());
    setTimeout(() => setSavedMsg(false), 2500);
  }

  function handlePublish() {
    setIsDraft(false);
    handleSave();
  }

  // ── AI ────────────────────────────────────────────────────────────────────────
  function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiResult(null);
    setTimeout(() => {
      const result = generateFlowFromPrompt(aiPrompt);
      setAiResult(result);
      setAiGenerating(false);
    }, 1600);
  }

  function handleAiApply() {
    if (!aiResult) return;
    pushHistory();
    setNodes(aiResult.nodes);
    setEdges(aiResult.edges);
    setProcessName(aiPrompt.length > 50 ? aiPrompt.slice(0, 47) + "…" : aiPrompt);
    setSelectedId(null);
    setShowAiPanel(false);
    setAiResult(null);
    setAiPrompt("");
    setPanOffset({ x: 0, y: 0 });
  }

  // ── [22] Custom steps survive template change ─────────────────────────────────
  function handleCreateStep() {
    if (!newStep.name.trim()) return;
    const colorPreset = CUSTOM_STEP_COLORS.find(c => c.key === newStep.colorKey) ?? CUSTOM_STEP_COLORS[2];
    const item: PaletteItem = {
      type: `custom-${Date.now()}`,
      label: newStep.name,
      category: newStep.category,
      color: colorPreset.color,
      bg: colorPreset.bg,
      icon: getIconEl(newStep.iconKey),
      description: newStep.description || "Custom step",
      price: "Free",
    };
    setCustomSteps(prev => [...prev, item]);
    setNewStep({ name: "", description: "", category: "Custom", iconKey: "file-text", colorKey: "gray" });
    setShowCreateStep(false);
  }

  // ── Computed values ───────────────────────────────────────────────────────────
  const selectedNode = nodes.find(n => n.id === selectedId) ?? null;
  const canvasW = Math.max(900, ...nodes.map(n => n.x + STEP_W + 160));
  const canvasH = Math.max(700, ...nodes.map(n => n.y + STEP_H + 160));

  const allPaletteItems = [...PALETTE, ...customSteps];
  const grouped = [
    ...CATEGORY_ORDER.map(cat => ({
      cat,
      items: allPaletteItems.filter(p => p.category === cat && (!paletteSearch || p.label.toLowerCase().includes(paletteSearch.toLowerCase()) || p.description.toLowerCase().includes(paletteSearch.toLowerCase()))),
    })),
    ...(customSteps.filter(c => c.category === "Custom").length > 0
      ? [{ cat: "Custom", items: customSteps.filter(c => c.category === "Custom" && (!paletteSearch || c.label.toLowerCase().includes(paletteSearch.toLowerCase()))) }]
      : []),
  ].filter(g => g.items.length > 0);

  // Preview: main-path steps
  const previewSteps = (() => {
    const visited = new Set<string>();
    const result: FlowNode[] = [];
    const entryIds = nodes.filter(n => !edges.some(e => e.toId === n.id)).map(n => n.id);
    const queue = [...entryIds];
    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodes.find(n => n.id === id);
      if (node) result.push(node);
      edges.filter(e => e.fromId === id && e.condition !== "fail").forEach(e => queue.push(e.toId));
    }
    return result;
  })();

  // ── [11] Preview with branching ───────────────────────────────────────────────
  if (preview) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-[#F5F5F5]">
        <div className="h-[52px] bg-card border-b border-border flex items-center px-6 gap-4">
          <button onClick={() => setPreview(false)} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} />Back to builder
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#2EA843]" />Client preview — {processName}
          </div>
          <span className="text-[11px] bg-[#EEF2FA] text-[#2855A6] px-2 py-1 rounded font-semibold">{previewSteps.length} steps · main path</span>
        </div>
        <div className="flex-1 flex items-start justify-center gap-8 p-8 overflow-y-auto">
          {/* Phone mockup */}
          <div className="w-[360px] bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
            <div className="bg-[#2855A6] px-5 pt-8 pb-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-[9px] font-bold">EN</div>
                  <span className="text-[12px] font-semibold">EnTIQ · Grow Advisory Group</span>
                </div>
                <span className="text-[11px] text-white/70">Secure</span>
              </div>
              <h2 className="text-[20px] font-bold">{processName}</h2>
              <p className="text-[12px] text-white/70 mt-1">{previewSteps.length} steps to complete</p>
            </div>
            <div className="p-4 space-y-2">
              {previewSteps.map((node, i) => (
                <div key={node.id}>
                  <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${i === 0 ? "border-[#2855A6] bg-[#EEF2FA]" : "border-border bg-[#FAFAFA]"}`}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: node.color, color: "#fff" }}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] font-semibold ${i === 0 ? "text-[#2855A6]" : "text-foreground"}`}>{node.label}</div>
                      <div className="text-[11px] text-muted-foreground">{node.description}</div>
                    </div>
                    {i === 0 && <span className="text-[11px] text-[#2855A6] font-semibold">Active</span>}
                    {i > 0 && <ChevronRight size={13} className="text-muted-foreground shrink-0" />}
                  </div>
                  {/* [11] Branch indicators */}
                  {branchMap[node.id] && (
                    <div className="ml-10 mt-1 mb-1 flex gap-2 text-[10px]">
                      {branchMap[node.id].pass && <span className="px-1.5 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31] font-semibold">Pass → {branchMap[node.id].pass}</span>}
                      {branchMap[node.id].fail && <span className="px-1.5 py-0.5 rounded bg-[#FCE8EB] text-[#A80016] font-semibold">Fail → {branchMap[node.id].fail}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="px-4 pb-6">
              <button className="w-full py-3 bg-[#2855A6] text-white text-[14px] font-semibold rounded-lg hover:bg-[#1F4491] transition-colors">Get started</button>
            </div>
          </div>

          {/* Right summary */}
          <div className="w-[300px] space-y-4">
            <h3 className="text-[15px] font-semibold text-foreground">Flow summary</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Steps", value: nodes.length },
                { label: "Branches", value: edges.filter(e => e.condition !== "always").length },
                { label: "Connections", value: edges.length },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
                  <div className="text-[20px] font-bold text-foreground">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-[12px] font-semibold text-foreground mb-3">Main path ({previewSteps.length} steps)</p>
              {previewSteps.map((node, i) => (
                <div key={node.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: node.color }}>{i + 1}</div>
                    {i < previewSteps.length - 1 && <div className="w-px flex-1 bg-border mt-1 min-h-[12px]" />}
                  </div>
                  <div className="pb-3 flex-1">
                    <div className="text-[13px] font-semibold text-foreground">{node.label}</div>
                    <div className="text-[11px] text-muted-foreground">{node.description}</div>
                    {branchMap[node.id] && (
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {branchMap[node.id].pass && <span className="text-[9px] px-1 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31] font-semibold">✓ {branchMap[node.id].pass}</span>}
                        {branchMap[node.id].fail && <span className="text-[9px] px-1 py-0.5 rounded bg-[#FCE8EB] text-[#A80016] font-semibold">✗ {branchMap[node.id].fail}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {validationIssues.length > 0 && (
              <div className="bg-[#FEF6E9] border border-[#F5A623]/30 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-[#B87A1A] mb-1">Flow warnings</p>
                {validationIssues.map((issue, i) => <p key={i} className="text-[11px] text-[#B87A1A]">· {issue}</p>)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top bar ── */}
      <div className="h-[52px] min-h-[52px] bg-card border-b border-border flex items-center px-5 gap-3 overflow-x-auto">
        {/* [24] Process name + version + save time */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[12px] text-muted-foreground">Process Builder</span>
          <ChevronRight size={12} className="text-muted-foreground" />
          {editingName ? (
            <input autoFocus value={processName}
              onChange={e => setProcessName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === "Enter" && setEditingName(false)}
              className="text-[14px] font-semibold text-foreground bg-transparent border-b border-[#2855A6] outline-none px-0.5 min-w-[180px]"
            />
          ) : (
            <button onClick={() => setEditingName(true)} className="flex items-center gap-1.5 text-[14px] font-semibold text-foreground hover:text-[#2855A6] transition-colors">
              {processName}<Pencil size={11} className="text-muted-foreground" />
            </button>
          )}
          {/* [13] Draft/Published badge */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isDraft ? "bg-[#FEF6E9] text-[#B87A1A]" : "bg-[#E8F7EB] text-[#1E7A31]"}`}>
            {isDraft ? "Draft" : "Published"}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">v{version}</span>
          {lastSaved && <span className="text-[10px] text-muted-foreground shrink-0">· {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>

        {/* [25] Applied-to type chips */}
        <div className="flex items-center gap-1 shrink-0">
          {appliedTypes.map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0F0F0] text-muted-foreground font-medium">{t}</span>
          ))}
        </div>

        {/* Template loader */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-muted-foreground">Template:</span>
          <select value={templateKey} onChange={e => loadTemplate(e.target.value, true)}
            className="text-[12px] border border-border rounded px-2 py-1 bg-card focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] appearance-none pr-6 cursor-pointer"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236F6F6F' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
          >
            <option value="individual">Individual Onboarding</option>
            <option value="company">Company + KYC/AML</option>
            <option value="documents">Document Collection</option>
            <option value="engagement">Engagement Process</option>
          </select>
        </div>

        <div className="flex-1" />

        {/* [5] Undo / Redo */}
        <div className="flex items-center gap-0.5 border border-border rounded px-0.5 shrink-0">
          <button onClick={undo} disabled={!history.length} title="Undo (Cmd+Z)"
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30"><RotateCcw size={13} /></button>
          <button onClick={redo} disabled={!future.length} title="Redo (Cmd+Shift+Z)"
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30" style={{ transform: "scaleX(-1)" }}><RotateCcw size={13} /></button>
        </div>

        {/* [9] Auto-layout */}
        <button onClick={autoLayout} title="Auto-arrange nodes vertically"
          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
          <Layers size={12} />Auto-layout
        </button>

        {/* Connecting mode indicator */}
        {connectingFrom && (
          <div className="flex items-center gap-2 text-[12px] text-[#2855A6] bg-[#EEF2FA] px-3 py-1 rounded-full shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#2855A6] animate-pulse" />
            Click input port to connect ·
            <select value={connectCond} onChange={e => setConnectCond(e.target.value as FlowEdge["condition"])}
              className="text-[11px] border-0 bg-transparent font-semibold focus:outline-none cursor-pointer text-[#2855A6]">
              <option value="always">always</option>
              <option value="pass">on pass</option>
              <option value="fail">on fail</option>
            </select>
            <button onClick={() => setConnectingFrom(null)} className="ml-1 text-muted-foreground hover:text-foreground"><X size={13} /></button>
          </div>
        )}

        {/* Zoom */}
        <div className="flex items-center gap-1 border border-border rounded px-1 shrink-0">
          <button title="Zoom out" onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"><ZoomOut size={13} /></button>
          <span className="text-[11px] text-muted-foreground w-9 text-center">{Math.round(zoom * 100)}%</span>
          <button title="Zoom in" onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"><ZoomIn size={13} /></button>
          <button title="Reset zoom" onClick={() => setZoom(1)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"><Maximize2 size={13} /></button>
        </div>

        {/* [12] Validation badge */}
        {validationIssues.length > 0 && (
          <button onClick={() => setShowValidation(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#F5A623]/40 rounded text-[11px] font-semibold text-[#B87A1A] bg-[#FEF6E9] hover:bg-[#FEE9B5] transition-colors shrink-0">
            <AlertTriangle size={12} />{validationIssues.length} issue{validationIssues.length > 1 ? "s" : ""}
          </button>
        )}

        <button onClick={() => { setShowAiPanel(true); setAiResult(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold bg-gradient-to-r from-[#7C3AED] to-[#2855A6] text-white hover:opacity-90 transition-opacity shrink-0">
          <Sparkles size={13} />Build with AI
        </button>
        <button onClick={() => setPreview(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
          <Play size={13} />Preview
        </button>
        {/* [13] Publish vs Save */}
        {isDraft ? (
          <button onClick={handlePublish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold bg-[#2855A6] text-white hover:bg-[#1F4491] transition-colors shrink-0">
            <CheckCircle size={13} />Publish
          </button>
        ) : (
          <button onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold transition-colors shrink-0 ${savedMsg ? "bg-[#E8F7EB] text-[#1E7A31] border border-[#2EA843]/40" : "bg-[#2855A6] text-white hover:bg-[#1F4491]"}`}>
            {savedMsg ? <><CheckCircle size={13} />Saved</> : <><Save size={13} />Save</>}
          </button>
        )}
      </div>

      {/* [12] Validation banner */}
      {showValidation && validationIssues.length > 0 && (
        <div className="bg-[#FEF6E9] border-b border-[#F5A623]/30 px-5 py-2.5 flex items-start gap-3">
          <AlertTriangle size={14} className="text-[#B87A1A] shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            {validationIssues.map((issue, i) => <p key={i} className="text-[12px] text-[#B87A1A]">{issue}</p>)}
          </div>
          <button onClick={() => setShowValidation(false)} className="text-[#B87A1A] hover:text-[#8A5A0D]"><X size={14} /></button>
        </div>
      )}

      {/* AI Builder Modal */}
      {showAiPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card w-[640px] rounded-2xl shadow-2xl overflow-hidden border border-border">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-[#7C3AED]/5 to-[#2855A6]/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2855A6] flex items-center justify-center shadow-sm">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">Build with AI</h2>
                  <p className="text-[11px] text-muted-foreground">Describe your process and AI will generate the flow</p>
                </div>
              </div>
              <button onClick={() => setShowAiPanel(false)} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-2">Describe your process</label>
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAiGenerate(); }}
                  placeholder="e.g. Individual tax client onboarding with identity verification, questionnaire and engagement letter signing…"
                  rows={3}
                  className="w-full px-3 py-2.5 text-[13px] bg-[#F5F5F5] border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all resize-none placeholder:text-muted-foreground"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Press Cmd+Enter to generate</p>
              </div>
              {!aiResult && !aiGenerating && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-2">Quick starts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => setAiPrompt(s)}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-[#7C3AED]/40 hover:text-[#7C3AED] hover:bg-[#EDE9FE]/40 transition-colors">{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {aiGenerating && (
                <div className="flex flex-col items-center py-8 gap-4">
                  <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full border-2 border-[#7C3AED]/20 border-t-[#7C3AED] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center"><Sparkles size={16} className="text-[#7C3AED]" /></div>
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold text-foreground">Building your flow…</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Analysing your process description</p>
                  </div>
                </div>
              )}
              {aiResult && !aiGenerating && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 bg-[#EDE9FE]/50 border border-[#7C3AED]/20 rounded-lg px-3 py-2.5">
                    <Wand2 size={13} className="text-[#7C3AED] shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#5B21B6] leading-snug">{aiResult.explanation}</p>
                  </div>
                  <div className="bg-[#F5F5F5] rounded-lg p-3 max-h-[200px] overflow-y-auto">
                    <p className="text-[11px] font-semibold text-muted-foreground mb-2">{aiResult.stepCount} steps in order</p>
                    <div className="space-y-1.5">
                      {aiResult.nodes.map((node, i) => (
                        <div key={node.id} className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ background: node.color }}>{i + 1}</div>
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[12px] font-medium text-foreground">{node.label}</span>
                            {node.integration === "entiq-kyc" && <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[#E3F8F5] text-[#20BCA4] border border-[#20BCA4]/20">KYC</span>}
                            {node.integration === "esign" && <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[#EEF2FA] text-[#2855A6] border border-[#2855A6]/20">eSign</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <button onClick={() => setShowAiPanel(false)} className="px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <div className="flex items-center gap-2">
                {/* [3] Fixed: Regenerate actually re-runs generation */}
                {aiResult && (
                  <button onClick={handleAiGenerate}
                    className="px-4 py-2 text-[13px] font-semibold border border-border rounded-lg hover:bg-muted transition-colors">Regenerate</button>
                )}
                {aiResult ? (
                  <button onClick={handleAiApply}
                    className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#7C3AED] to-[#2855A6] text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity">
                    <Wand2 size={13} />Apply to canvas
                  </button>
                ) : (
                  <button onClick={handleAiGenerate} disabled={!aiPrompt.trim() || aiGenerating}
                    className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#7C3AED] to-[#2855A6] text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                    <Sparkles size={13} />Generate flow
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main 3-pane layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── [16] Left palette (collapsible) ── */}
        {!paletteCollapsed ? (
          <div className="w-[220px] min-w-[220px] bg-card border-r border-border flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Step palette</p>
                <button onClick={() => setPaletteCollapsed(true)} className="text-muted-foreground hover:text-foreground transition-colors" title="Collapse palette">
                  <ChevronLeft size={13} />
                </button>
              </div>
              {/* [14] Palette search */}
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={paletteSearch} onChange={e => setPaletteSearch(e.target.value)} placeholder="Search steps…"
                  className="w-full pl-6 pr-6 py-1 text-[11px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]/20" />
                {paletteSearch && <button onClick={() => setPaletteSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={9} /></button>}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#E3F8F5] text-[#20BCA4] border border-[#20BCA4]/20">KYC</span>
                <span className="text-[9px] text-muted-foreground">Entiq KYC</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#EEF2FA] text-[#2855A6] border border-[#2855A6]/20">eSign</span>
                <span className="text-[9px] text-muted-foreground">eSign</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {grouped.length === 0 && paletteSearch ? (
                <div className="px-4 py-8 text-center text-[11px] text-muted-foreground">No steps match "{paletteSearch}"</div>
              ) : (
                grouped.map(({ cat, items }) => (
                  <div key={cat}>
                    <div className="px-4 py-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{cat}</span>
                    </div>
                    {items.map(item => (
                      <div key={item.type} draggable onDragStart={e => handlePaletteDragStart(e, item.type)}
                        title={item.price && item.price !== "Free" ? `Cost: ${item.price} per check — ${item.description}` : item.description}
                        className="mx-3 mb-1.5 flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-[#FAFAFA] cursor-grab hover:border-[#2855A6]/40 hover:bg-[#EEF2FA]/50 hover:shadow-sm transition-all active:cursor-grabbing">
                        <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: item.bg, color: item.color }}>{item.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-foreground leading-tight">{item.label}</span>
                            {item.integration === "entiq-kyc" && <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-[#E3F8F5] text-[#20BCA4] border border-[#20BCA4]/20 shrink-0">KYC</span>}
                            {item.integration === "esign" && <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-[#EEF2FA] text-[#2855A6] border border-[#2855A6]/20 shrink-0">eSign</span>}
                            {/* [15] Price shown inline */}
                            {item.price && item.price !== "Free" && <span className="text-[8px] text-[#D97706] font-semibold shrink-0">{item.price}</span>}
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.description.split(" — ")[0]}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
            {/* Create custom step */}
            <div className="border-t border-border">
              {!showCreateStep ? (
                <button onClick={() => setShowCreateStep(true)} className="w-full flex items-center gap-2 px-4 py-3 text-[12px] font-semibold text-[#2855A6] hover:bg-[#EEF2FA] transition-colors">
                  <Plus size={13} />Create custom step
                </button>
              ) : (
                <div className="px-3 py-3 space-y-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-foreground">New step</span>
                    <button onClick={() => setShowCreateStep(false)} className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
                  </div>
                  <input placeholder="Step name *" value={newStep.name} onChange={e => setNewStep(s => ({ ...s, name: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-[12px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]" />
                  <input placeholder="Short description" value={newStep.description} onChange={e => setNewStep(s => ({ ...s, description: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-[12px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]" />
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Category</p>
                    <div className="flex flex-wrap gap-1">
                      {["Entry", "Identity", "Information", "Commercial", "Internal", "Custom"].map(cat => (
                        <button key={cat} onClick={() => setNewStep(s => ({ ...s, category: cat }))}
                          className={`text-[10px] px-2 py-0.5 rounded border font-medium transition-colors ${newStep.category === cat ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6]" : "border-border text-muted-foreground hover:border-[#2855A6]/30"}`}>{cat}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Icon</p>
                    <div className="grid grid-cols-8 gap-1">
                      {CUSTOM_STEP_ICONS.map(ico => (
                        <button key={ico.key} title={ico.label} onClick={() => setNewStep(s => ({ ...s, iconKey: ico.key }))}
                          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${newStep.iconKey === ico.key ? "bg-[#2855A6] text-white" : "bg-[#F0F0F0] text-[#6F6F6F] hover:bg-[#EEF2FA] hover:text-[#2855A6]"}`}>{ico.el}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Colour</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {CUSTOM_STEP_COLORS.map(c => (
                        <button key={c.key} onClick={() => setNewStep(s => ({ ...s, colorKey: c.key }))}
                          className={`w-5 h-5 rounded-full border-2 transition-transform ${newStep.colorKey === c.key ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
                          style={{ background: c.color }} />
                      ))}
                    </div>
                  </div>
                  {newStep.name && (
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-[#FAFAFA]">
                      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        style={{ background: CUSTOM_STEP_COLORS.find(c => c.key === newStep.colorKey)?.bg, color: CUSTOM_STEP_COLORS.find(c => c.key === newStep.colorKey)?.color }}>
                        {getIconEl(newStep.iconKey)}
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-foreground">{newStep.name}</div>
                        {newStep.description && <div className="text-[10px] text-muted-foreground">{newStep.description}</div>}
                      </div>
                    </div>
                  )}
                  <button onClick={handleCreateStep} disabled={!newStep.name.trim()}
                    className="w-full py-2 text-[12px] font-semibold bg-[#2855A6] text-white rounded hover:bg-[#1F4491] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Add to palette
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* [16] Collapsed palette strip */
          <div className="w-8 bg-card border-r border-border flex flex-col items-center py-3 gap-2">
            <button onClick={() => setPaletteCollapsed(false)} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground" title="Expand palette">
              <ChevronRight size={13} />
            </button>
            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mt-2" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>Palette</span>
          </div>
        )}

        {/* ── [1][7][8] Center canvas — fixed zoom/pan ── */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden bg-[#F5F5F5] relative"
          style={{
            backgroundImage: "radial-gradient(circle, #D1D1D1 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            cursor: spaceDown ? (isPanning ? "grabbing" : "grab") : "default",
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          onMouseDown={handleContainerMouseDown}
        >
          {/* Single-transform canvas group — fixes zoom bug [1] */}
          <div
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: canvasW,
              height: canvasH,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: "top left",
            }}
            onClick={handleCanvasClick}
          >
            {/* SVG edges layer */}
            <svg style={{ position: "absolute", top: 0, left: 0, width: canvasW, height: canvasH, overflow: "visible" }}>
              {edges.map(edge => {
                const from = nodes.find(n => n.id === edge.fromId);
                const to = nodes.find(n => n.id === edge.toId);
                if (!from || !to) return null;
                const fp = getPortPos(from, "out");
                const tp = getPortPos(to, "in");
                const isHov = hoveredEdge === edge.id;
                const color = isHov ? "#D0021B" : edgeColor(edge.condition);
                const mid = { x: (fp.x + tp.x) / 2, y: (fp.y + tp.y) / 2 };
                const path = bezierPath(fp.x, fp.y, tp.x, tp.y);
                return (
                  <g key={edge.id}>
                    {/* Visible edge */}
                    <path d={path} fill="none" stroke={color} strokeWidth={isHov ? 2.5 : 2}
                      strokeDasharray={edge.condition === "always" ? undefined : "5,3"} style={{ pointerEvents: "none" }} />
                    <circle cx={tp.x} cy={tp.y} r={3} fill={color} style={{ pointerEvents: "none" }} />
                    {edge.condition !== "always" && (
                      <g style={{ pointerEvents: "none" }}>
                        <rect x={mid.x - 18} y={mid.y - 8} width={36} height={14} rx={4} fill="#fff" stroke={color} strokeWidth={1} />
                        <text x={mid.x} y={mid.y + 3} textAnchor="middle" fontSize={9} fill={color} fontWeight="600">{edge.condition}</text>
                      </g>
                    )}
                    {/* [23] Hover-to-reveal delete button */}
                    {isHov && (
                      <g onClick={e => { e.stopPropagation(); deleteEdge(edge.id); }} style={{ cursor: "pointer" }}>
                        <circle cx={mid.x} cy={mid.y} r={10} fill="#D0021B" />
                        <text x={mid.x} y={mid.y + 4.5} textAnchor="middle" fontSize={14} fill="white" fontWeight="bold">×</text>
                      </g>
                    )}
                    {/* Wide transparent hit area */}
                    <path d={path} fill="none" stroke="transparent" strokeWidth={16}
                      style={{ pointerEvents: "all", cursor: "pointer" }}
                      onMouseEnter={() => setHoveredEdge(edge.id)}
                      onMouseLeave={() => setHoveredEdge(null)} />
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const isSelected = selectedId === node.id;
              const isConnFrom = connectingFrom === node.id;
              const stepNum = stepNumbers[node.id]; // [20]
              return (
                <div key={node.id} data-node="true"
                  style={{ position: "absolute", left: node.x, top: node.y, width: STEP_W }}
                  onMouseDown={e => handleStepMouseDown(e, node.id)}
                  onClick={e => { e.stopPropagation(); setSelectedId(node.id); }}
                  className="select-none cursor-grab active:cursor-grabbing">
                  <div style={{ width: STEP_W, height: STEP_H }}
                    className={`relative bg-card rounded-lg border-2 shadow-sm transition-shadow hover:shadow-md ${isSelected ? "border-[#2855A6] shadow-[0_0_0_3px_rgba(40,85,166,0.15)]" : isConnFrom ? "border-[#20BCA4]" : "border-border"}`}>
                    {/* Left color bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ background: node.color }} />
                    {/* [20] Step number badge */}
                    {stepNum !== undefined && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold z-10 border-2 border-card" style={{ background: node.color }}>
                        {stepNum}
                      </div>
                    )}
                    {/* Input port */}
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-card flex items-center justify-center cursor-pointer z-10 transition-transform hover:scale-125 ${connectingFrom && connectingFrom !== node.id ? "bg-[#2855A6] scale-125" : "bg-[#D1D1D1]"}`}
                      onClick={e => handleInputPort(e, node.id)}>
                      <div className="w-1.5 h-1.5 rounded-full bg-card" />
                    </div>
                    {/* Content */}
                    <div className="pl-4 pr-3 pt-3 pb-2.5 h-full flex flex-col justify-between">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ background: node.bg, color: node.color }}>{node.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-foreground leading-tight truncate">{node.label}</div>
                          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">{node.description}</div>
                          {node.integration === "entiq-kyc" && (
                            <span className="inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E3F8F5] text-[#20BCA4] border border-[#20BCA4]/20">
                              <Fingerprint size={8} />Entiq KYC
                            </span>
                          )}
                          {node.integration === "esign" && (
                            <span className="inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EEF2FA] text-[#2855A6] border border-[#2855A6]/20">
                              <Pen size={8} />eSign
                            </span>
                          )}
                          {/* Notes indicator */}
                          {(node.config.notes as string) && <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#F5A623] inline-block" title="Has notes" />}
                        </div>
                      </div>
                    </div>
                    {/* Output port */}
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-card flex items-center justify-center cursor-pointer z-10 transition-transform hover:scale-125 ${isConnFrom ? "bg-[#20BCA4] scale-125" : "bg-[#2855A6]"}`}
                      onClick={e => handleOutputPort(e, node.id)}>
                      <Plus size={10} color="#fff" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 pointer-events-none">
                <Workflow size={40} className="opacity-20" />
                <p className="text-[14px] font-medium">Drag steps from the palette to build your flow</p>
                <p className="text-[12px] opacity-60">Or click "Build with AI" to generate one automatically</p>
              </div>
            )}
          </div>

          {/* [21] Minimap overlay */}
          {showMinimap && nodes.length > 0 && (() => {
            const MAP_W = 158, MAP_H = 88;
            const minX = Math.min(...nodes.map(n => n.x));
            const maxX = Math.max(...nodes.map(n => n.x + STEP_W));
            const minY = Math.min(...nodes.map(n => n.y));
            const maxY = Math.max(...nodes.map(n => n.y + STEP_H));
            const s = Math.min(MAP_W / (maxX - minX + 80), MAP_H / (maxY - minY + 80), 0.18);
            return (
              <div className="absolute bottom-4 right-4 bg-card border border-border rounded-lg shadow-md overflow-hidden z-20">
                <div className="px-2 py-0.5 flex items-center justify-between bg-[#FAFAFA] border-b border-border">
                  <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wide">Minimap</span>
                  <button onClick={() => setShowMinimap(false)} className="text-muted-foreground hover:text-foreground"><X size={8} /></button>
                </div>
                <svg width={MAP_W} height={MAP_H}>
                  {nodes.map(n => (
                    <rect key={n.id} x={(n.x - minX + 40) * s} y={(n.y - minY + 40) * s}
                      width={Math.max(4, STEP_W * s)} height={Math.max(2, STEP_H * s)} rx={1}
                      fill={n.color} fillOpacity={selectedId === n.id ? 1 : 0.5} />
                  ))}
                </svg>
              </div>
            );
          })()}
          {!showMinimap && nodes.length > 0 && (
            <button onClick={() => setShowMinimap(true)}
              className="absolute bottom-4 right-4 px-2 py-1 bg-card border border-border rounded text-[10px] text-muted-foreground hover:text-foreground transition-colors shadow-sm z-20">
              Minimap
            </button>
          )}

          {/* Keyboard hint bar */}
          <div className="absolute bottom-4 left-4 text-[9px] text-muted-foreground bg-card/90 px-2.5 py-1.5 rounded border border-border z-10 flex gap-3">
            <span>Space+drag pan</span>
            <span>Del remove</span>
            <span>⌘D duplicate</span>
            <span>⌘Z undo</span>
            <span>⌘⇧Z redo</span>
          </div>
        </div>

        {/* ── [16] Right config panel (collapsible) ── */}
        {!configCollapsed ? (
          <div className="w-[272px] min-w-[272px] bg-card border-l border-border flex flex-col overflow-hidden">
            {selectedNode ? (
              <>
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: selectedNode.bg, color: selectedNode.color }}>{selectedNode.icon}</div>
                      <span className="text-[13px] font-semibold text-foreground truncate">{selectedNode.label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* [10] Duplicate button */}
                      <button onClick={duplicateNode} title="Duplicate step (⌘D)"
                        className="p-1 rounded text-muted-foreground hover:text-[#2855A6] hover:bg-[#EEF2FA] transition-colors"><Copy size={13} /></button>
                      <button onClick={deleteSelected} title="Delete step (Del)"
                        className="p-1 rounded text-muted-foreground hover:text-[#D0021B] hover:bg-[#FCE8EB] transition-colors"><Trash2 size={13} /></button>
                      <button onClick={() => setConfigCollapsed(true)} title="Collapse panel"
                        className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"><ChevronRight size={13} /></button>
                    </div>
                  </div>
                  <input value={selectedNode.label}
                    onChange={e => setNodes(prev => prev.map(n => n.id === selectedId ? { ...n, label: e.target.value } : n))}
                    className="w-full px-2 py-1.5 text-[12px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                    placeholder="Step label" />
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                  {/* [19] Incoming connections */}
                  {(() => {
                    const inEdges = edges.filter(e => e.toId === selectedId);
                    if (!inEdges.length) return null;
                    return (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Incoming from</p>
                        {inEdges.map(edge => {
                          const src = nodes.find(n => n.id === edge.fromId);
                          return (
                            <div key={edge.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: edgeColor(edge.condition) }} />
                              <span className="text-[11px] text-foreground flex-1 truncate">{src?.label ?? "Unknown"}</span>
                              <span className="text-[10px] text-muted-foreground">{edge.condition}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* [17] Step-aware generic toggles */}
                  {(() => {
                    const noSkip = ["decision", "internal-review", "signing", "welcome", "auth"].includes(selectedNode.type);
                    const noResume = ["decision", "internal-review", "welcome", "auth"].includes(selectedNode.type);
                    return (
                      <div className="space-y-2">
                        <label className="flex items-center justify-between py-1.5">
                          <span className="text-[12px] text-foreground">Required</span>
                          {/* [2] Controlled inputs — config persists */}
                          <input type="checkbox" checked={!!(selectedNode.config.required ?? true)}
                            onChange={e => updateNodeConfig(selectedNode.id, "required", e.target.checked)}
                            className="accent-[#2855A6] w-4 h-4" />
                        </label>
                        {!noSkip && (
                          <label className="flex items-center justify-between py-1.5 border-t border-border">
                            <span className="text-[12px] text-foreground">Allow client to skip</span>
                            <input type="checkbox" checked={!!(selectedNode.config.allowSkip)}
                              onChange={e => updateNodeConfig(selectedNode.id, "allowSkip", e.target.checked)}
                              className="accent-[#2855A6] w-4 h-4" />
                          </label>
                        )}
                        {!noResume && (
                          <label className="flex items-center justify-between py-1.5 border-t border-border">
                            <span className="text-[12px] text-foreground">Save and resume</span>
                            <input type="checkbox" checked={!!(selectedNode.config.saveResume ?? true)}
                              onChange={e => updateNodeConfig(selectedNode.id, "saveResume", e.target.checked)}
                              className="accent-[#2855A6] w-4 h-4" />
                          </label>
                        )}
                      </div>
                    );
                  })()}

                  {/* Integration callouts */}
                  {selectedNode.integration === "entiq-kyc" && (
                    <div className="border-t border-border pt-3">
                      <div className="flex items-start gap-2 bg-[#E3F8F5] border border-[#20BCA4]/30 rounded-lg px-3 py-2.5">
                        <Fingerprint size={13} className="text-[#20BCA4] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-semibold text-[#20BCA4]">Handled by Entiq KYC</p>
                          <p className="text-[10px] text-[#1A8A78] leading-snug mt-0.5">Identity documents and biometric data are processed in Entiq KYC. Only the assurance result and reference ID are returned here.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedNode.integration === "esign" && (
                    <div className="border-t border-border pt-3">
                      <div className="flex items-start gap-2 bg-[#EEF2FA] border border-[#2855A6]/30 rounded-lg px-3 py-2.5">
                        <Pen size={13} className="text-[#2855A6] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-semibold text-[#2855A6]">Handled by eSign</p>
                          <p className="text-[10px] text-[#1A3D7A] leading-snug mt-0.5">Engagement letters are sent and signed via your connected eSign provider. Signed PDFs are stored against the engagement record.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* [2] Step-specific config — fully controlled */}
                  {(STEP_CONFIG[selectedNode.type] ?? []).map(field => (
                    <div key={field.label} className="border-t border-border pt-3">
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">{field.label}</label>
                      {field.type === "select" && (
                        <select
                          value={(selectedNode.config[field.label] as string) ?? (field.default as string)}
                          onChange={e => updateNodeConfig(selectedNode.id, field.label, e.target.value)}
                          className="w-full text-[12px] px-2 py-1.5 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] appearance-none"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236F6F6F' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
                          {field.options?.map(o => <option key={o}>{o}</option>)}
                        </select>
                      )}
                      {field.type === "toggle" && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox"
                            checked={!!(selectedNode.config[field.label] ?? field.default)}
                            onChange={e => updateNodeConfig(selectedNode.id, field.label, e.target.checked)}
                            className="accent-[#2855A6] w-4 h-4" />
                          <span className="text-[12px] text-muted-foreground">Enabled</span>
                        </label>
                      )}
                      {field.type === "multicheck" && (
                        <div className="space-y-1.5">
                          {field.options?.map(o => {
                            const current = (selectedNode.config[field.label] as string[]) ?? (field.default as string[] ?? []);
                            return (
                              <label key={o} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={current.includes(o)}
                                  onChange={e => {
                                    const next = e.target.checked ? [...current, o] : current.filter((v: string) => v !== o);
                                    updateNodeConfig(selectedNode.id, field.label, next);
                                  }}
                                  className="accent-[#2855A6] w-3.5 h-3.5" />
                                <span className="text-[12px] text-foreground">{o}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* [18] Notes field */}
                  <div className="border-t border-border pt-3">
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">Notes</label>
                    <textarea
                      value={(selectedNode.config.notes as string) ?? ""}
                      onChange={e => updateNodeConfig(selectedNode.id, "notes", e.target.value)}
                      placeholder="Add context, conditions or internal notes…"
                      rows={3}
                      className="w-full px-2 py-1.5 text-[12px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] resize-none placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Outgoing connections */}
                  {(() => {
                    const outEdges = edges.filter(e => e.fromId === selectedId);
                    if (!outEdges.length) return null;
                    return (
                      <div className="border-t border-border pt-3">
                        <p className="text-[11px] font-semibold text-muted-foreground mb-2">Outgoing connections</p>
                        {outEdges.map(edge => {
                          const target = nodes.find(n => n.id === edge.toId);
                          return (
                            <div key={edge.id} className="flex items-center gap-2 py-1.5">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: edgeColor(edge.condition) }} />
                              <span className="text-[11px] text-foreground flex-1 truncate">{target?.label ?? "Unknown"}</span>
                              <select value={edge.condition}
                                onChange={e => setEdges(prev => prev.map(ed => ed.id === edge.id ? { ...ed, condition: e.target.value as FlowEdge["condition"] } : ed))}
                                className="text-[10px] border border-border rounded px-1 py-0.5 bg-card focus:outline-none appearance-none cursor-pointer">
                                <option value="always">always</option>
                                <option value="pass">on pass</option>
                                <option value="fail">on fail</option>
                              </select>
                              <button onClick={() => deleteEdge(edge.id)} className="text-muted-foreground hover:text-[#D0021B] transition-colors"><X size={12} /></button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Connect button */}
                  <div className="border-t border-border pt-3">
                    <button onClick={e => { e.stopPropagation(); setConnectingFrom(connectingFrom === selectedId ? null : selectedId!); }}
                      className={`w-full py-2 text-[12px] font-semibold rounded border transition-colors ${connectingFrom === selectedId ? "border-[#20BCA4] bg-[#E3F8F5] text-[#20BCA4]" : "border-[#2855A6]/30 text-[#2855A6] hover:bg-[#EEF2FA]"}`}>
                      {connectingFrom === selectedId ? "Click a step input port →" : "+ Connect to another step"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Process settings panel */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Process settings</p>
                  <button onClick={() => setConfigCollapsed(true)} title="Collapse panel"
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"><ChevronRight size={13} /></button>
                </div>
                <div className="px-4 py-4 space-y-4 flex-1 overflow-y-auto">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">Process name</label>
                    <input value={processName} onChange={e => setProcessName(e.target.value)}
                      className="w-full px-2 py-1.5 text-[12px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">Process type</label>
                    <select className="w-full text-[12px] px-2 py-1.5 bg-[#F5F5F5] border border-border rounded focus:outline-none appearance-none"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236F6F6F' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
                      <option>Onboarding</option>
                      <option>Document collection</option>
                      <option>Engagement</option>
                      <option>Custom</option>
                    </select>
                  </div>
                  {/* [25] Applied types — controlled + feeds header chips */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">Applied to client type</label>
                    <div className="space-y-1.5">
                      {["Individual", "Company", "Trust", "SMSF", "Partnership"].map(t => (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={appliedTypes.includes(t)}
                            onChange={e => setAppliedTypes(prev => e.target.checked ? [...prev, t] : prev.filter(x => x !== t))}
                            className="accent-[#2855A6] w-3.5 h-3.5" />
                          <span className="text-[12px] text-foreground">{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-[11px] font-semibold text-muted-foreground mb-2">Canvas</p>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={autoLayout} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold border border-border rounded hover:bg-muted transition-colors text-muted-foreground">
                        <Layers size={11} />Auto-layout
                      </button>
                      <button onClick={() => loadTemplate(templateKey)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold border border-border rounded hover:bg-muted transition-colors text-muted-foreground">
                        <RotateCcw size={11} />Reset
                      </button>
                      <button onClick={() => { if (window.confirm("Clear all steps and connections?")) { pushHistory(); setNodes([]); setEdges([]); } }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold border border-[#D0021B]/30 text-[#D0021B] rounded hover:bg-[#FCE8EB] transition-colors">
                        <Trash2 size={11} />Clear all
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 text-[11px] text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Total steps</span><span className="font-semibold text-foreground">{nodes.length}</span></div>
                    <div className="flex justify-between"><span>Connections</span><span className="font-semibold text-foreground">{edges.length}</span></div>
                    <div className="flex justify-between"><span>Branches</span><span className="font-semibold text-foreground">{edges.filter(e => e.condition !== "always").length}</span></div>
                    <div className="flex justify-between"><span>Validation</span>
                      <span className={`font-semibold ${validationIssues.length ? "text-[#B87A1A]" : "text-[#2EA843]"}`}>
                        {validationIssues.length ? `${validationIssues.length} issue${validationIssues.length > 1 ? "s" : ""}` : "Looks good"}
                      </span>
                    </div>
                  </div>

                  {/* Integration dependencies */}
                  {(() => {
                    const hasKyc = nodes.some(n => n.integration === "entiq-kyc");
                    const hasEsign = nodes.some(n => n.integration === "esign");
                    if (!hasKyc && !hasEsign) return null;
                    return (
                      <div className="border-t border-border pt-3 space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground">Integration dependencies</p>
                        {hasKyc && (
                          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#E3F8F5] border border-[#20BCA4]/20">
                            <Fingerprint size={12} className="text-[#20BCA4] shrink-0" />
                            <div>
                              <p className="text-[11px] font-semibold text-[#20BCA4]">Entiq KYC required</p>
                              <p className="text-[9px] text-[#1A8A78]">{nodes.filter(n => n.integration === "entiq-kyc").length} step(s) in this flow</p>
                            </div>
                          </div>
                        )}
                        {hasEsign && (
                          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#EEF2FA] border border-[#2855A6]/20">
                            <Pen size={12} className="text-[#2855A6] shrink-0" />
                            <div>
                              <p className="text-[11px] font-semibold text-[#2855A6]">eSign required</p>
                              <p className="text-[9px] text-[#1A3D7A]">{nodes.filter(n => n.integration === "esign").length} step(s) in this flow</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="px-4 py-3 border-t border-border">
                  <p className="text-[10px] text-muted-foreground">Click step to configure · Del remove · ⌘D duplicate · ⌘Z undo · Space+drag pan</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* [16] Collapsed config strip */
          <div className="w-8 bg-card border-l border-border flex flex-col items-center py-3 gap-2">
            <button onClick={() => setConfigCollapsed(false)} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground" title="Expand config">
              <ChevronLeft size={13} />
            </button>
            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mt-2" style={{ writingMode: "vertical-rl" }}>Config</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProcessBuilderScreen;
