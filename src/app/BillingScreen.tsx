import { useState } from "react";
import {
  Plus, Search, Download, CheckCircle, Clock, AlertTriangle, XCircle,
  RefreshCw, ExternalLink, CreditCard, FileText, DollarSign, ChevronDown,
  MoreHorizontal, X, ChevronRight, Calendar, Repeat, Briefcase, Flag,
  Hash, Zap, Building2, Check,
} from "lucide-react";
import { PageShell } from "./shared";
import { INITIAL_FEES, INITIAL_STAFF } from "./ServicesScreen";
import { exportToCsv } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleType = "Monthly" | "Quarterly" | "Annual" | "Job-based" | "On completion" | "Weekly" | "Fortnightly";
type InvoiceStatus = "Draft" | "Sent" | "Due" | "Overdue" | "Paid" | "Voided";
type XeroStatus = "Synced" | "Pending" | "Error" | "Not synced";
type SquareStatus = "Paid" | "Pending" | "Failed" | "Refunded" | "—";
type SquareConnection = "connected" | "disconnected";
type XeroConnection = "connected" | "disconnected";

interface BillingSchedule {
  id: string;
  client: string;
  engagementId: string;
  service: string;
  type: ScheduleType;
  amount: number;
  gst: boolean;
  nextDue: string;
  adviser: string;
  status: "Active" | "Paused" | "Completed";
  squareSubscriptionId: string;
}

interface Invoice {
  id: string;
  scheduleId: string;
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
  squarePaymentId: string;
}

interface Payment {
  id: string;
  invoiceId: string;
  client: string;
  amount: number;
  method: string;
  date: string;
  squareTxId: string;
  xeroReconciled: boolean;
  status: "Settled" | "Processing" | "Failed" | "Refunded";
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const SCHEDULES: BillingSchedule[] = [
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

const INVOICES: Invoice[] = [
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

const PAYMENTS: Payment[] = [
  { id: "PAY-000", invoiceId: "INV-2024-0313", client: "Manoj Tech Solutions Pty Ltd", amount: 582.09, method: "Visa •••• 8841", date: "4 Sept 2026", squareTxId: "sqp_Mn9k4Lx", xeroReconciled: true, status: "Settled" },
  { id: "PAY-001", invoiceId: "INV-2024-0312", client: "Harrington, Sophie", amount: 1210, method: "Visa •••• 4242", date: "8 Jul 2024", squareTxId: "sqp_Hq7k2Lm", xeroReconciled: true, status: "Settled" },
  { id: "PAY-002", invoiceId: "INV-2024-0311", client: "Greenbrook Unit Trust", amount: 1210, method: "Bank transfer", date: "10 Jul 2024", squareTxId: "sqp_Vc9n4Ws", xeroReconciled: true, status: "Settled" },
  { id: "PAY-003", invoiceId: "INV-2024-0310", client: "Harrington, Sophie", amount: 1210, method: "Visa •••• 4242", date: "8 Jun 2024", squareTxId: "sqp_Mn1a5Fb", xeroReconciled: true, status: "Settled" },
  { id: "PAY-004", invoiceId: "INV-2024-0309", client: "Harrington, Sophie", amount: 1815, method: "Visa •••• 4242", date: "10 Jun 2024", squareTxId: "sqp_Pk8b3Gc", xeroReconciled: true, status: "Settled" },
  { id: "PAY-005", invoiceId: "INV-2024-0308", client: "Caldwell SMSF", amount: 3630, method: "Mastercard •••• 7701", date: "Processing", squareTxId: "", xeroReconciled: false, status: "Processing" },
  { id: "PAY-006", invoiceId: "INV-2024-0307", client: "Caldwell SMSF", amount: 605, method: "Mastercard •••• 7701", date: "12 Jul 2024", squareTxId: "", xeroReconciled: false, status: "Failed" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AUD = (n: number) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 }).format(n);

const SCHEDULE_TYPE_META: Record<ScheduleType, { icon: React.ReactNode; color: string; bg: string }> = {
  Monthly:       { icon: <Repeat size={11} />, color: "text-[#2855A6]", bg: "bg-[#EEF2FA]" },
  Quarterly:     { icon: <Calendar size={11} />, color: "text-[#D97706]", bg: "bg-[#FEF3C7]" },
  Annual:        { icon: <Calendar size={11} />, color: "text-[#6B7280]", bg: "bg-[#F3F4F6]" },
  "Job-based":   { icon: <Briefcase size={11} />, color: "text-[#7C3AED]", bg: "bg-[#EDE9FE]" },
  "On completion": { icon: <Flag size={11} />, color: "text-[#2EA843]", bg: "bg-[#E8F7EB]" },
  Weekly:        { icon: <Hash size={11} />, color: "text-[#0891B2]", bg: "bg-[#E0F2FE]" },
  Fortnightly:   { icon: <Hash size={11} />, color: "text-[#0891B2]", bg: "bg-[#E0F2FE]" },
};

function ScheduleTypeBadge({ type }: { type: ScheduleType }) {
  const m = SCHEDULE_TYPE_META[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${m.bg} ${m.color}`}>
      {m.icon}{type}
    </span>
  );
}

function invoiceStatusColor(s: InvoiceStatus) {
  const m: Record<InvoiceStatus, string> = {
    Draft: "bg-[#F0F0F0] text-[#6F6F6F]",
    Sent: "bg-[#EEF2FA] text-[#2855A6]",
    Due: "bg-[#FEF3C7] text-[#D97706]",
    Overdue: "bg-[#FCE8EB] text-[#A80016]",
    Paid: "bg-[#E8F7EB] text-[#1E7A31]",
    Voided: "bg-[#F0F0F0] text-[#6F6F6F]",
  };
  return m[s];
}

function xeroStatusEl(s: XeroStatus) {
  if (s === "Synced") return <span className="flex items-center gap-1 text-[#2EA843] text-[11px] font-semibold"><CheckCircle size={11} />Synced</span>;
  if (s === "Pending") return <span className="flex items-center gap-1 text-[#F5A623] text-[11px] font-semibold"><Clock size={11} />Pending</span>;
  if (s === "Error") return <span className="flex items-center gap-1 text-[#D0021B] text-[11px] font-semibold"><AlertTriangle size={11} />Error</span>;
  return <span className="text-[11px] text-muted-foreground">—</span>;
}

function squareStatusEl(s: SquareStatus) {
  if (s === "Paid") return <span className="flex items-center gap-1 text-[#2EA843] text-[11px] font-semibold"><Zap size={11} />Paid</span>;
  if (s === "Pending") return <span className="flex items-center gap-1 text-[#F5A623] text-[11px] font-semibold"><Clock size={11} />Pending</span>;
  if (s === "Failed") return <span className="flex items-center gap-1 text-[#D0021B] text-[11px] font-semibold"><XCircle size={11} />Failed</span>;
  if (s === "Refunded") return <span className="flex items-center gap-1 text-[#6F6F6F] text-[11px] font-semibold"><RefreshCw size={11} />Refunded</span>;
  return <span className="text-[11px] text-muted-foreground">—</span>;
}

function paymentStatusColor(s: Payment["status"]) {
  const m: Record<Payment["status"], string> = {
    Settled: "bg-[#E8F7EB] text-[#1E7A31]",
    Processing: "bg-[#FEF3C7] text-[#D97706]",
    Failed: "bg-[#FCE8EB] text-[#A80016]",
    Refunded: "bg-[#F0F0F0] text-[#6F6F6F]",
  };
  return m[s];
}

// ─── Connection status banner ─────────────────────────────────────────────────

function ConnectionBanner({
  squareConn, xeroConn, onConnectSquare, onConnectXero,
}: {
  squareConn: SquareConnection;
  xeroConn: XeroConnection;
  onConnectSquare: () => void;
  onConnectXero: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Square card */}
      <div className={`flex items-start gap-4 p-4 rounded-xl border ${squareConn === "connected" ? "border-[#3E4348]/20 bg-[#3E4348]/5" : "border-border bg-card"}`}>
        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-[13px]">SQ</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[14px] font-semibold text-foreground">Square</span>
            {squareConn === "connected"
              ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31]">Connected</span>
              : <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F0F0F0] text-[#6F6F6F]">Not connected</span>}
          </div>
          <p className="text-[11px] text-muted-foreground mb-2.5">
            {squareConn === "connected"
              ? "Payments are processed and subscriptions managed via Square. Card-on-file, bank transfer and payment links supported."
              : "Connect Square to take card payments, set up recurring billing, and automatically reconcile with Xero."}
          </p>
          {squareConn === "connected" ? (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle size={11} className="text-[#2EA843]" />Grow Advisory Group · SQ sandbox</span>
              <button className="text-[#2855A6] font-semibold hover:underline flex items-center gap-0.5">Configure <ExternalLink size={10} /></button>
            </div>
          ) : (
            <button onClick={onConnectSquare} className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[12px] font-semibold rounded hover:bg-[#222] transition-colors">
              <CreditCard size={12} />Connect Square
            </button>
          )}
        </div>
      </div>

      {/* Xero card */}
      <div className={`flex items-start gap-4 p-4 rounded-xl border ${xeroConn === "connected" ? "border-[#13B5EA]/20 bg-[#13B5EA]/5" : "border-border bg-card"}`}>
        <div className="w-10 h-10 rounded-lg bg-[#13B5EA] flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-[12px]">XA</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[14px] font-semibold text-foreground">Xero Accounting</span>
            {xeroConn === "connected"
              ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#E8F7EB] text-[#1E7A31]">Connected</span>
              : <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F0F0F0] text-[#6F6F6F]">Not connected</span>}
          </div>
          <p className="text-[11px] text-muted-foreground mb-2.5">
            {xeroConn === "connected"
              ? "Invoices raised here are automatically created in Xero. Square payments post receipts back for one-click reconciliation."
              : "Connect Xero to automatically raise invoices, sync payment status, and reconcile Square receipts in one click."}
          </p>
          {xeroConn === "connected" ? (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle size={11} className="text-[#2EA843]" />Grow Advisory Group · Synced 2 min ago</span>
              <button className="text-[#2855A6] font-semibold hover:underline flex items-center gap-0.5">Open Xero <ExternalLink size={10} /></button>
            </div>
          ) : (
            <button onClick={onConnectXero} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13B5EA] text-white text-[12px] font-semibold rounded hover:bg-[#0FA3D4] transition-colors">
              <Building2 size={12} />Connect Xero
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── New Billing Schedule Modal ───────────────────────────────────────────────

const CLIENTS_FOR_BILLING = [
  { id: "E-00890", name: "Manoj Tech Solutions Pty Ltd", type: "Company" },
  { id: "P-00450", name: "Manoj Kumar", type: "Individual" },
  { id: "P-00441", name: "Harrington, Sophie", type: "Individual" },
  { id: "E-00882", name: "Northfield Holdings Pty Ltd", type: "Company" },
  { id: "E-00881", name: "The Marcelline Family Trust", type: "Trust" },
  { id: "E-00879", name: "Caldwell SMSF", type: "SMSF" },
  { id: "E-00878", name: "Greenbrook Unit Trust", type: "Trust" },
  { id: "E-00880", name: "Apex Ventures Pty Ltd", type: "Company" },
];

const SCHEDULE_TYPES: { id: ScheduleType; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "Monthly", label: "Monthly retainer", desc: "Fixed amount billed each month — e.g. advisory, bookkeeping", icon: <Repeat size={15} /> },
  { id: "Quarterly", label: "Quarterly", desc: "Billed every quarter — e.g. BAS preparation, management reports", icon: <Calendar size={15} /> },
  { id: "Annual", label: "Annual", desc: "Billed once per year — e.g. tax returns, SMSF audit", icon: <Calendar size={15} /> },
  { id: "Job-based", label: "Job-based", desc: "Fixed fee for a specific engagement, invoiced on job creation", icon: <Briefcase size={15} /> },
  { id: "On completion", label: "On completion", desc: "Invoice raised automatically when the job is marked complete", icon: <Flag size={15} /> },
  { id: "Weekly", label: "Weekly timesheet", desc: "WIP billed weekly based on time recorded", icon: <Hash size={15} /> },
  { id: "Fortnightly", label: "Fortnightly", desc: "Fixed or timesheet billing every two weeks", icon: <Hash size={15} /> },
];

function NewScheduleModal({ onClose, onCreated, squareConn, xeroConn }: {
  onClose: () => void;
  onCreated: (s: BillingSchedule) => void;
  squareConn: SquareConnection;
  xeroConn: XeroConnection;
}) {
  const [step, setStep] = useState(1);
  const STEPS = ["Client & Service", "Schedule & Fees", "Payment & Invoicing", "Confirm"];
  const inputCls = "w-full px-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all";

  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [service, setService] = useState(INITIAL_FEES[0].service);
  const [schedType, setSchedType] = useState<ScheduleType>("Monthly");
  const [amount, setAmount] = useState<string>("");
  const [gst, setGst] = useState(true);
  const [adviserId, setAdviserId] = useState("STF-001");
  const [startDate, setStartDate] = useState("2024-08-01");
  const [paymentMethod, setPaymentMethod] = useState<"square" | "manual">("square");
  const [raiseXero, setRaiseXero] = useState(true);
  const [sendPayLink, setSendPayLink] = useState(true);

  const fee = INITIAL_FEES.find(f => f.service === service);
  const effectiveAmount = parseFloat(amount) || fee?.amount || 0;
  const gstAmt = gst ? effectiveAmount * 0.1 : 0;
  const adviser = INITIAL_STAFF.find(s => s.id === adviserId);

  const canProceed =
    (step === 1 && !!clientId && !!service) ||
    (step === 2 && effectiveAmount > 0) ||
    step === 3 || step === 4;

  const handleCreate = () => {
    onCreated({
      id: `SCH-${String(SCHEDULES.length + 1).padStart(3, "0")}`,
      client: clientName,
      engagementId: "ENG-NEW",
      service,
      type: schedType,
      amount: effectiveAmount,
      gst,
      nextDue: startDate ? new Date(startDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—",
      adviser: adviser ? `${adviser.name.split(" ")[0][0]}. ${adviser.name.split(" ").slice(1).join(" ")}` : "—",
      status: "Active",
      squareSubscriptionId: paymentMethod === "square" ? `sub_${Math.random().toString(36).slice(2, 9)}` : "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card w-[660px] max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-border flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">New billing schedule</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Step {step} of {STEPS.length} — {STEPS[step - 1]}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground mt-0.5"><X size={16} /></button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 flex items-center gap-0 shrink-0">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i + 1 <= step ? "bg-[#2855A6] text-white" : "bg-[#F0F0F0] text-muted-foreground"}`}>
                  {i + 1 < step ? <Check size={10} /> : i + 1}
                </div>
                <span className={`text-[11px] font-medium whitespace-nowrap ${i + 1 <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-6 h-px mx-2 ${i + 1 < step ? "bg-[#2855A6]" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Step 1 */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1.5">Client</label>
                <div className="space-y-1.5">
                  {CLIENTS_FOR_BILLING.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setClientId(c.id); setClientName(c.name); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border text-left transition-colors ${clientId === c.id ? "border-[#2855A6] bg-[#EEF2FA]" : "border-border hover:border-[#2855A6]/30"}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${clientId === c.id ? "bg-[#2855A6] text-white" : "bg-[#E8E8E8] text-[#6F6F6F]"}`}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-foreground">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.type} · {c.id}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1.5">Service</label>
                <select value={service} onChange={e => setService(e.target.value)} className={inputCls}>
                  {INITIAL_FEES.map(f => <option key={f.id} value={f.service}>{f.service}</option>)}
                </select>
                {fee && (
                  <p className="text-[11px] text-muted-foreground mt-1">Standard fee: <strong>{AUD(fee.amount)}</strong> · {fee.frequency}{fee.notes ? ` — ${fee.notes}` : ""}</p>
                )}
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-2">Billing schedule type</label>
                <div className="space-y-1.5">
                  {SCHEDULE_TYPES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSchedType(t.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${schedType === t.id ? "border-[#2855A6] bg-[#EEF2FA]/50" : "border-border hover:border-[#2855A6]/30"}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${schedType === t.id ? "bg-[#2855A6] text-white" : "bg-[#F0F0F0] text-[#6F6F6F]"}`}>{t.icon}</div>
                      <div>
                        <div className="text-[13px] font-semibold text-foreground">{t.label}</div>
                        <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1.5">Fee amount (excl. GST)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder={fee?.amount?.toString()}
                      className="w-full pl-6 pr-3 py-2 text-[13px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Leave blank to use standard fee ({AUD(fee?.amount ?? 0)})</p>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1.5">GST</label>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input type="checkbox" checked={gst} onChange={e => setGst(e.target.checked)} className="accent-[#2855A6] w-4 h-4" />
                    <span className="text-[13px] text-foreground">Add GST (10%)</span>
                  </label>
                  {gst && effectiveAmount > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">Total with GST: <strong>{AUD(effectiveAmount + gstAmt)}</strong></p>
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1.5">First billing date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1.5">Responsible adviser</label>
                  <select value={adviserId} onChange={e => setAdviserId(e.target.value)} className={inputCls}>
                    {INITIAL_STAFF.filter(s => ["Partner", "Director", "Senior Manager", "Manager"].includes(s.role)).map(s => (
                      <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-2">Payment collection</label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${paymentMethod === "square" ? "border-black bg-[#F9F9F9]" : "border-border hover:border-[#333]/30"}`}>
                    <input type="radio" name="pay" checked={paymentMethod === "square"} onChange={() => setPaymentMethod("square")} className="mt-0.5 accent-[#2855A6]" />
                    <div className="w-8 h-8 rounded-md bg-black flex items-center justify-center shrink-0"><span className="text-white text-[10px] font-bold">SQ</span></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground">Charge via Square</span>
                        {squareConn === "connected"
                          ? <span className="text-[10px] font-semibold text-[#1E7A31] bg-[#E8F7EB] px-1.5 py-0.5 rounded">Connected</span>
                          : <span className="text-[10px] font-semibold text-[#A80016] bg-[#FCE8EB] px-1.5 py-0.5 rounded">Not connected</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Card-on-file, payment link or recurring subscription. Client receives a payment confirmation automatically.</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${paymentMethod === "manual" ? "border-[#2855A6] bg-[#EEF2FA]/40" : "border-border hover:border-[#2855A6]/30"}`}>
                    <input type="radio" name="pay" checked={paymentMethod === "manual"} onChange={() => setPaymentMethod("manual")} className="mt-0.5 accent-[#2855A6]" />
                    <div className="w-8 h-8 rounded-md bg-[#F0F0F0] flex items-center justify-center shrink-0"><CreditCard size={14} className="text-[#6F6F6F]" /></div>
                    <div>
                      <span className="text-[13px] font-semibold text-foreground">Manual / EFT</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Invoice raised but payment collected outside Square (EFT, cheque, etc.). Mark as paid manually.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-2">Xero invoicing</label>
                <div className={`flex items-start gap-3 p-4 rounded-lg border ${raiseXero ? "border-[#13B5EA]/30 bg-[#13B5EA]/5" : "border-border"}`}>
                  <input type="checkbox" checked={raiseXero} onChange={e => setRaiseXero(e.target.checked)} className="mt-0.5 accent-[#2855A6] w-4 h-4" />
                  <div className="w-8 h-8 rounded-md bg-[#13B5EA] flex items-center justify-center shrink-0"><span className="text-white text-[9px] font-bold">XA</span></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground">Auto-raise invoice in Xero</span>
                      {xeroConn === "connected"
                        ? <span className="text-[10px] font-semibold text-[#1E7A31] bg-[#E8F7EB] px-1.5 py-0.5 rounded">Connected</span>
                        : <span className="text-[10px] font-semibold text-[#A80016] bg-[#FCE8EB] px-1.5 py-0.5 rounded">Not connected</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Each billing cycle auto-creates an approved invoice in Xero with line items matching this schedule. Square payments post as receipts for one-click reconciliation.</p>
                  </div>
                </div>
              </div>

              {paymentMethod === "square" && (
                <div className="flex items-center gap-3 px-4 py-3 bg-[#F5F5F5] rounded-lg border border-border">
                  <input type="checkbox" checked={sendPayLink} onChange={e => setSendPayLink(e.target.checked)} className="accent-[#2855A6] w-4 h-4" />
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">Send payment link to client on each invoice</div>
                    <div className="text-[11px] text-muted-foreground">Client receives an email with a Square-hosted payment page. No card data handled by EnTIQ.</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 4 — Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-[#FAFAFA] border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Schedule summary</div>
                <div className="divide-y divide-border">
                  {[
                    ["Client", clientName || "—"],
                    ["Service", service],
                    ["Schedule type", schedType],
                    ["Fee (excl. GST)", AUD(effectiveAmount)],
                    ["GST", gst ? AUD(gstAmt) : "Not applicable"],
                    ["Total per cycle", AUD(effectiveAmount + (gst ? gstAmt : 0))],
                    ["First billing date", startDate ? new Date(startDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—"],
                    ["Payment method", paymentMethod === "square" ? "Square (card / payment link)" : "Manual / EFT"],
                    ["Raise Xero invoice", raiseXero ? "Yes — auto on each cycle" : "No"],
                    ["Adviser", adviser?.name ?? "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-4 px-4 py-2.5 text-[12px]">
                      <span className="text-muted-foreground w-36 shrink-0">{k}</span>
                      <span className="text-foreground font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {paymentMethod === "square" && squareConn !== "connected" && (
                <div className="flex items-start gap-2 px-4 py-3 bg-[#FEF6E9] border border-[#F5A623]/30 rounded-lg text-[12px] text-[#B87A1A]">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>Square is not connected. The schedule will be created but Square charges will not activate until you connect Square in Integrations.</span>
                </div>
              )}
              {raiseXero && xeroConn !== "connected" && (
                <div className="flex items-start gap-2 px-4 py-3 bg-[#FEF6E9] border border-[#F5A623]/30 rounded-lg text-[12px] text-[#B87A1A]">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>Xero is not connected. Invoices will be queued and pushed when Xero is linked.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <button
            onClick={() => step < STEPS.length ? setStep(step + 1) : handleCreate()}
            disabled={!canProceed}
            className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {step === STEPS.length ? <><Zap size={13} />Activate schedule</> : <>Continue <ChevronRight size={13} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Raise Invoice Modal ──────────────────────────────────────────────────────

function RaiseInvoiceModal({ invoice, xeroConn, squareConn, onClose }: {
  invoice: Invoice;
  xeroConn: XeroConnection;
  squareConn: SquareConnection;
  onClose: () => void;
}) {
  const [done, setDone] = useState(false);
  const [syncing, setSyncing] = useState(false);

  function handleRaise() {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); setDone(true); }, 1400);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card w-[480px] rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Raise invoice</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">{invoice.id} · {invoice.client}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {!done ? (
            <>
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {[
                  ["Service", invoice.service],
                  ["Amount (excl. GST)", AUD(invoice.amount)],
                  ["GST", AUD(invoice.gst)],
                  ["Total", AUD(invoice.amount + invoice.gst)],
                  ["Due date", invoice.due || "14 days from issue"],
                ].map(([k, v]) => (
                  <div key={k} className="flex px-4 py-2.5 text-[12px]">
                    <span className="text-muted-foreground w-36 shrink-0">{k}</span>
                    <span className="text-foreground font-semibold">{v}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${xeroConn === "connected" ? "border-[#13B5EA]/20 bg-[#13B5EA]/5" : "border-border bg-[#F5F5F5]"}`}>
                  <div className="w-7 h-7 rounded bg-[#13B5EA] flex items-center justify-center shrink-0"><span className="text-white text-[8px] font-bold">XA</span></div>
                  <div className="flex-1 text-[12px]">
                    <span className="font-semibold text-foreground">Create in Xero</span>
                    <span className="text-muted-foreground ml-1">{xeroConn === "connected" ? "— approved invoice, ready to reconcile" : "— Xero not connected"}</span>
                  </div>
                  {xeroConn === "connected" ? <CheckCircle size={14} className="text-[#2EA843]" /> : <XCircle size={14} className="text-muted-foreground" />}
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${squareConn === "connected" ? "border-black/10 bg-[#F9F9F9]" : "border-border bg-[#F5F5F5]"}`}>
                  <div className="w-7 h-7 rounded bg-black flex items-center justify-center shrink-0"><span className="text-white text-[8px] font-bold">SQ</span></div>
                  <div className="flex-1 text-[12px]">
                    <span className="font-semibold text-foreground">Send Square payment link</span>
                    <span className="text-muted-foreground ml-1">{squareConn === "connected" ? "— client receives email to pay online" : "— Square not connected"}</span>
                  </div>
                  {squareConn === "connected" ? <CheckCircle size={14} className="text-[#2EA843]" /> : <XCircle size={14} className="text-muted-foreground" />}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#E8F7EB] flex items-center justify-center">
                <CheckCircle size={24} className="text-[#2EA843]" />
              </div>
              <div className="text-[14px] font-semibold text-foreground">Invoice raised</div>
              <div className="text-[12px] text-muted-foreground text-center">
                {xeroConn === "connected" && "Created in Xero as INV-0313. "}
                {squareConn === "connected" && "Payment link sent to client."}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">{done ? "Close" : "Cancel"}</button>
          {!done && (
            <button onClick={handleRaise} disabled={syncing} className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors disabled:opacity-50 flex items-center gap-1.5">
              {syncing ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Raising…</> : <><FileText size={13} />Raise &amp; send</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Square Connect Modal ─────────────────────────────────────────────────────

function SquareConnectModal({ onClose, onConnected }: { onClose: () => void; onConnected: () => void }) {
  const [step, setStep] = useState(1);
  const [connecting, setConnecting] = useState(false);
  const [done, setDone] = useState(false);

  function handleAuth() {
    setConnecting(true);
    setTimeout(() => { setConnecting(false); setDone(true); }, 1600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card w-[520px] rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center"><span className="text-white font-bold text-[12px]">SQ</span></div>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Connect Square</h2>
              <p className="text-[11px] text-muted-foreground">Payments · Point of sale · Subscriptions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {!done ? (
            <>
              <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-2">
                <p className="text-[12px] font-semibold text-foreground">EnTIQ will be authorised to:</p>
                {[
                  "Create and manage payment links",
                  "Charge saved cards (card-on-file) for recurring billing",
                  "Create and manage subscriptions",
                  "Receive payment webhooks for automatic reconciliation",
                  "Access transaction history for matched invoices",
                ].map(c => (
                  <div key={c} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <CheckCircle size={12} className="text-[#2EA843] shrink-0" />{c}
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 text-[11px] text-[#1A5DA6] bg-[#E3F0FB] px-3 py-2.5 rounded">
                <span className="shrink-0 mt-0.5">🔒</span>
                <span>You will be redirected to Square to authorise access via OAuth 2.0. EnTIQ never stores card numbers or CVVs.</span>
              </div>
              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-[12px] font-semibold text-foreground">Select default billing location</p>
                  {["Grow Advisory Group — Melbourne CBD", "Grow Advisory Group — Online"].map(loc => (
                    <label key={loc} className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-[#2855A6]/30">
                      <input type="radio" name="loc" defaultChecked={loc.includes("CBD")} className="accent-[#2855A6]" />
                      <span className="text-[13px] text-foreground">{loc}</span>
                    </label>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#E8F7EB] flex items-center justify-center">
                <CheckCircle size={24} className="text-[#2EA843]" />
              </div>
              <div className="text-[14px] font-semibold text-foreground">Square connected</div>
              <div className="text-[12px] text-muted-foreground">Grow Advisory Group · Melbourne CBD · Sandbox mode</div>
              <div className="text-[12px] text-muted-foreground text-center">You can now take card payments, send payment links and set up recurring subscriptions directly from billing schedules.</div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">{done ? "Close" : "Cancel"}</button>
          {!done && (
            <button
              onClick={() => step === 1 ? setStep(2) : handleAuth()}
              disabled={connecting}
              className="px-5 py-2 bg-black text-white text-[13px] font-semibold rounded hover:bg-[#222] transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {connecting
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connecting…</>
                : step === 1 ? "Continue" : "Authorise with Square"}
            </button>
          )}
          {done && <button onClick={() => { onConnected(); onClose(); }} className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors">Done</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Schedule Detail Drawer ───────────────────────────────────────────────────

function ScheduleDrawer({
  schedule,
  invoices,
  payments,
  xeroConn,
  squareConn,
  onClose,
  onRaiseInvoice,
  onUpdateSchedule,
  onDeleteSchedule,
}: {
  schedule: BillingSchedule;
  invoices: Invoice[];
  payments: Payment[];
  xeroConn: XeroConnection;
  squareConn: SquareConnection;
  onClose: () => void;
  onRaiseInvoice: (inv: Invoice) => void;
  onUpdateSchedule?: (updated: BillingSchedule) => void;
  onDeleteSchedule?: (id: string) => void;
}) {
  const [drawerTab, setDrawerTab] = useState<"overview" | "invoices" | "payments">("overview");
  const [currentSched, setCurrentSched] = useState<BillingSchedule>(schedule);
  const scheduleInvoices = invoices.filter(i => i.scheduleId === currentSched.id);
  const schedulePayments = payments.filter(p => scheduleInvoices.some(i => i.id === p.invoiceId));
  const totalPaid = schedulePayments.filter(p => p.status === "Settled").reduce((s, p) => s + p.amount, 0);
  const outstanding = scheduleInvoices.filter(i => ["Due", "Overdue", "Sent"].includes(i.status)).reduce((s, i) => s + i.amount + i.gst, 0);

  const togglePause = () => {
    const nextStatus = currentSched.status === "Active" ? "Paused" : "Active";
    const updated = { ...currentSched, status: nextStatus as "Active" | "Paused" };
    setCurrentSched(updated);
    if (onUpdateSchedule) onUpdateSchedule(updated);
  };

  const handleCancel = () => {
    if (onDeleteSchedule) onDeleteSchedule(currentSched.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[620px] bg-card h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-0 border-b border-border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono text-[12px] text-[#2855A6] bg-[#EEF2FA] px-2 py-0.5 rounded">{currentSched.id}</span>
                <ScheduleTypeBadge type={currentSched.type} />
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${currentSched.status === "Active" ? "bg-[#E8F7EB] text-[#1E7A31]" : currentSched.status === "Paused" ? "bg-[#FEF6E9] text-[#B87A1A]" : "bg-[#F0F0F0] text-[#6F6F6F]"}`}>{currentSched.status}</span>
              </div>
              <h2 className="text-[18px] font-semibold text-foreground leading-tight">{currentSched.client}</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">{currentSched.service}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground mt-0.5">
              <X size={16} />
            </button>
          </div>

          {/* Key metrics strip */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#F5F5F5] rounded-lg px-3 py-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Fee (excl. GST)</div>
              <div className="text-[16px] font-bold text-foreground">{AUD(currentSched.amount)}</div>
              <div className="text-[10px] text-muted-foreground">{currentSched.gst ? `+ ${AUD(currentSched.amount * 0.1)} GST` : "No GST"} · {currentSched.type}</div>
            </div>
            <div className="bg-[#F5F5F5] rounded-lg px-3 py-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Next billing</div>
              <div className="text-[15px] font-bold text-foreground">{currentSched.nextDue}</div>
              <div className="text-[10px] text-muted-foreground">Adviser: {currentSched.adviser}</div>
            </div>
            <div className="bg-[#F5F5F5] rounded-lg px-3 py-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Outstanding</div>
              <div className={`text-[15px] font-bold ${outstanding > 0 ? "text-[#D0021B]" : "text-[#2EA843]"}`}>{AUD(outstanding)}</div>
              <div className="text-[10px] text-muted-foreground">Collected: {AUD(totalPaid)}</div>
            </div>
          </div>

          {/* Connection pills */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${squareConn === "connected" ? "bg-black text-white border-black" : "bg-[#F0F0F0] text-[#6F6F6F] border-border"}`}>
              <span className="text-[9px] font-bold">SQ</span>
              {currentSched.squareSubscriptionId ? currentSched.squareSubscriptionId : "Not linked"}
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${xeroConn === "connected" ? "bg-[#13B5EA] text-white border-[#13B5EA]" : "bg-[#F0F0F0] text-[#6F6F6F] border-border"}`}>
              <span className="text-[9px] font-bold">XA</span>
              {xeroConn === "connected" ? "Xero synced" : "Xero not connected"}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 -mb-px">
            {(["overview", "invoices", "payments"] as const).map(t => (
              <button
                key={t}
                onClick={() => setDrawerTab(t)}
                className={`px-4 py-2 text-[12px] font-semibold border-b-2 transition-colors capitalize flex items-center gap-1.5 ${drawerTab === t ? "border-[#2855A6] text-[#2855A6]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t}
                {t === "invoices" && scheduleInvoices.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EEF2FA] text-[#2855A6] font-semibold">{scheduleInvoices.length}</span>
                )}
                {t === "payments" && schedulePayments.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EEF2FA] text-[#2855A6] font-semibold">{schedulePayments.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Overview */}
          {drawerTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Engagement", currentSched.engagementId],
                  ["Billing type", currentSched.type],
                  ["Fee excl. GST", AUD(currentSched.amount)],
                  ["GST", currentSched.gst ? AUD(currentSched.amount * 0.1) : "Not applicable"],
                  ["Total per cycle", AUD(currentSched.amount * (currentSched.gst ? 1.1 : 1))],
                  ["Next billing date", currentSched.nextDue],
                  ["Responsible adviser", currentSched.adviser],
                  ["Square subscription", currentSched.squareSubscriptionId || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[#F5F5F5] rounded-lg px-3 py-2.5">
                    <div className="text-[10px] text-muted-foreground">{k}</div>
                    <div className="text-[13px] font-medium text-foreground mt-0.5">{v}</div>
                  </div>
                ))}
              </div>

              {/* Payment method */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-[#FAFAFA] border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Payment collection</div>
                <div className="px-4 py-3 flex items-center gap-3">
                  {currentSched.squareSubscriptionId ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0"><span className="text-white text-[10px] font-bold">SQ</span></div>
                      <div>
                        <div className="text-[13px] font-semibold text-foreground">Square recurring subscription</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{currentSched.squareSubscriptionId}</div>
                      </div>
                      <div className="ml-auto">
                        <button className="flex items-center gap-1 text-[11px] text-[#2855A6] font-semibold hover:underline">View in Square <ExternalLink size={10} /></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} className="text-muted-foreground" />
                      <div className="text-[13px] text-muted-foreground">Manual / EFT — no Square subscription linked</div>
                    </>
                  )}
                </div>
              </div>

              {/* Xero */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-[#FAFAFA] border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Xero invoicing</div>
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#13B5EA] flex items-center justify-center shrink-0"><span className="text-white text-[9px] font-bold">XA</span></div>
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">{xeroConn === "connected" ? "Auto-raising invoices in Xero" : "Xero not connected"}</div>
                    <div className="text-[11px] text-muted-foreground">{xeroConn === "connected" ? `${scheduleInvoices.filter(i => i.xeroStatus === "Synced").length} invoice${scheduleInvoices.filter(i => i.xeroStatus === "Synced").length !== 1 ? "s" : ""} synced` : "Connect Xero to enable automatic invoice creation"}</div>
                  </div>
                  {xeroConn === "connected" && (
                    <button className="ml-auto flex items-center gap-1 text-[11px] text-[#2855A6] font-semibold hover:underline">Open Xero <ExternalLink size={10} /></button>
                  )}
                </div>
              </div>

              {/* Recent activity */}
              {schedulePayments.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#FAFAFA] border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Recent payments</div>
                  <div className="divide-y divide-border">
                    {schedulePayments.slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3 text-[12px]">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${p.status === "Settled" ? "bg-[#E8F7EB]" : p.status === "Failed" ? "bg-[#FCE8EB]" : "bg-[#FEF3C7]"}`}>
                          {p.status === "Settled" ? <CheckCircle size={12} className="text-[#2EA843]" /> : p.status === "Failed" ? <XCircle size={12} className="text-[#D0021B]" /> : <Clock size={12} className="text-[#D97706]" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{AUD(p.amount)}</div>
                          <div className="text-[11px] text-muted-foreground">{p.method} · {p.date}</div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${paymentStatusColor(p.status)}`}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invoices */}
          {drawerTab === "invoices" && (
            <div className="space-y-2">
              {scheduleInvoices.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-[13px]">No invoices yet for this schedule.</div>
              ) : scheduleInvoices.map(inv => (
                <div key={inv.id} className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-mono text-[11px] text-[#2855A6]">{inv.id}</span>
                        {inv.xeroInvoiceNo && <span className="font-mono text-[10px] text-muted-foreground">{inv.xeroInvoiceNo}</span>}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${invoiceStatusColor(inv.status)}`}>{inv.status}</span>
                      </div>
                      <div className="text-[12px] text-foreground font-medium truncate">{inv.service}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Due {inv.due} · {AUD(inv.amount + inv.gst)} incl. GST</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {xeroStatusEl(inv.xeroStatus)}
                      {squareStatusEl(inv.squareStatus)}
                    </div>
                    {inv.status === "Draft" && (
                      <button
                        onClick={() => onRaiseInvoice(inv)}
                        className="ml-2 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#2855A6] rounded hover:bg-[#1F4491] transition-colors whitespace-nowrap"
                      >
                        Raise
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payments */}
          {drawerTab === "payments" && (
            <div className="space-y-2">
              {schedulePayments.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-[13px]">No payments recorded for this schedule.</div>
              ) : schedulePayments.map(p => (
                <div key={p.id} className="border border-border rounded-lg px-4 py-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${p.status === "Settled" ? "bg-[#E8F7EB]" : p.status === "Failed" ? "bg-[#FCE8EB]" : "bg-[#FEF3C7]"}`}>
                    {p.status === "Settled" ? <CheckCircle size={14} className="text-[#2EA843]" /> : p.status === "Failed" ? <XCircle size={14} className="text-[#D0021B]" /> : <Clock size={14} className="text-[#D97706]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-semibold text-foreground">{AUD(p.amount)}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${paymentStatusColor(p.status)}`}>{p.status}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{p.method} · {p.date}</div>
                    {p.squareTxId && <div className="text-[10px] font-mono text-muted-foreground mt-0.5">SQ: {p.squareTxId}</div>}
                  </div>
                  <div>
                    {p.xeroReconciled
                      ? <span className="flex items-center gap-1 text-[#2EA843] text-[11px] font-semibold"><CheckCircle size={11} />Reconciled</span>
                      : <span className="flex items-center gap-1 text-[#F5A623] text-[11px] font-semibold"><Clock size={11} />Pending</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border px-6 py-4 flex items-center gap-3">
          {currentSched.status === "Active" ? (
            <button
              onClick={togglePause}
              className="px-4 py-2 border border-border text-[13px] font-semibold rounded hover:bg-muted transition-colors text-muted-foreground"
            >
              Pause schedule
            </button>
          ) : (
            <button
              onClick={togglePause}
              className="px-4 py-2 border border-[#2855A6] text-[#2855A6] text-[13px] font-semibold rounded hover:bg-[#EEF2FA] transition-colors"
            >
              Resume schedule
            </button>
          )}
          <button className="px-4 py-2 border border-border text-[13px] font-semibold rounded hover:bg-muted transition-colors">Edit</button>
          {currentSched.squareSubscriptionId && (
            <button className="flex items-center gap-1.5 px-4 py-2 border border-border text-[13px] font-semibold rounded hover:bg-muted transition-colors">
              <span className="w-4 h-4 rounded bg-black flex items-center justify-center text-white text-[8px] font-bold">SQ</span>View in Square
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-[#D0021B] text-[#D0021B] text-[13px] font-semibold rounded hover:bg-[#FCE8EB] transition-colors"
          >
            Cancel schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Billing & Payments Screen ────────────────────────────────────────────────

function BillingScreen() {
  const [tab, setTab] = useState<"schedules" | "invoices" | "payments">("schedules");
  const [squareConn, setSquareConn] = useState<SquareConnection>("connected");
  const [xeroConn] = useState<XeroConnection>("connected");
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [showSquareConnect, setShowSquareConnect] = useState(false);
  const [schedules, setSchedules] = useState<BillingSchedule[]>(() => {
    try {
      const raw = localStorage.getItem("entiq_mock_schedules");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const missing = SCHEDULES.filter(s => !parsed.some((p: any) => p.id === s.id || p.client === s.client));
          if (missing.length > 0) {
            const merged = [...missing, ...parsed];
            localStorage.setItem("entiq_mock_schedules", JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }
    } catch {}
    return SCHEDULES;
  });
  const [invoices] = useState<Invoice[]>(() => {
    try {
      const raw = localStorage.getItem("entiq_mock_invoices");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const missing = INVOICES.filter(s => !parsed.some((p: any) => p.id === s.id || p.client === s.client));
          if (missing.length > 0) {
            const merged = [...missing, ...parsed];
            localStorage.setItem("entiq_mock_invoices", JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }
    } catch {}
    return INVOICES;
  });
  const [payments] = useState<Payment[]>(() => {
    try {
      const raw = localStorage.getItem("entiq_mock_payments");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const missing = PAYMENTS.filter(s => !parsed.some((p: any) => p.id === s.id || p.client === s.client));
          if (missing.length > 0) {
            const merged = [...missing, ...parsed];
            localStorage.setItem("entiq_mock_payments", JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }
    } catch {}
    return PAYMENTS;
  });
  const [raiseModal, setRaiseModal] = useState<Invoice | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<BillingSchedule | null>(null);
  const [search, setSearch] = useState("");

  const filteredSchedules = schedules.filter(s => !search || s.client.toLowerCase().includes(search.toLowerCase()) || s.service.toLowerCase().includes(search.toLowerCase()));
  const filteredInvoices = invoices.filter(i => !search || i.client.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase()));
  const filteredPayments = payments.filter(p => !search || p.client.toLowerCase().includes(search.toLowerCase()));

  const handleExport = () => {
    if (tab === "schedules") {
      exportToCsv("billing_schedules.csv", filteredSchedules as unknown as Record<string, unknown>[]);
    } else if (tab === "invoices") {
      exportToCsv("billing_invoices.csv", filteredInvoices as unknown as Record<string, unknown>[]);
    } else {
      exportToCsv("billing_payments.csv", filteredPayments as unknown as Record<string, unknown>[]);
    }
  };

  const totalMonthly = schedules.filter(s => s.status === "Active").reduce((sum, s) => {
    if (s.type === "Monthly") return sum + s.amount * (s.gst ? 1.1 : 1);
    if (s.type === "Quarterly") return sum + (s.amount * (s.gst ? 1.1 : 1)) / 3;
    if (s.type === "Annual") return sum + (s.amount * (s.gst ? 1.1 : 1)) / 12;
    return sum;
  }, 0);

  const overdueInvoices = invoices.filter(i => i.status === "Overdue").length;
  const paidThisMonth = payments.filter(p => p.status === "Settled").reduce((s, p) => s + p.amount, 0);

  return (
    <>
      {showNewSchedule && (
        <NewScheduleModal
          onClose={() => setShowNewSchedule(false)}
          onCreated={s => setSchedules(prev => [s, ...prev])}
          squareConn={squareConn}
          xeroConn={xeroConn}
        />
      )}
      {showSquareConnect && (
        <SquareConnectModal
          onClose={() => setShowSquareConnect(false)}
          onConnected={() => setSquareConn("connected")}
        />
      )}
      {raiseModal && (
        <RaiseInvoiceModal
          invoice={raiseModal}
          xeroConn={xeroConn}
          squareConn={squareConn}
          onClose={() => setRaiseModal(null)}
        />
      )}
      {selectedSchedule && (
        <ScheduleDrawer
          schedule={selectedSchedule}
          invoices={invoices}
          payments={payments}
          xeroConn={xeroConn}
          squareConn={squareConn}
          onClose={() => setSelectedSchedule(null)}
          onRaiseInvoice={inv => { setSelectedSchedule(null); setRaiseModal(inv); }}
          onUpdateSchedule={updated => {
            setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
            setSelectedSchedule(updated);
          }}
          onDeleteSchedule={id => {
            setSchedules(prev => prev.filter(s => s.id !== id));
            setSelectedSchedule(null);
          }}
        />
      )}

      <PageShell
        title="Billing & Payments"
        subtitle="Billing schedules, invoices and Square payments — reconciled with Xero"
        breadcrumb={["EnTIQ", "Start", "Billing & Payments"]}
        actions={
          <button
            onClick={() => setShowNewSchedule(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2855A6] text-white text-[12px] font-semibold rounded hover:bg-[#1F4491] transition-colors"
          >
            <Plus size={13} />New billing schedule
          </button>
        }
      >
        {/* Connection banners */}
        <ConnectionBanner
          squareConn={squareConn}
          xeroConn={xeroConn}
          onConnectSquare={() => setShowSquareConnect(true)}
          onConnectXero={() => {}}
        />

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Monthly revenue (incl. GST)", value: AUD(totalMonthly), color: "text-foreground", bg: "bg-[#F5F5F5]" },
            { label: "Collected this month", value: AUD(paidThisMonth), color: "text-[#2EA843]", bg: "bg-[#E8F7EB]" },
            { label: "Overdue invoices", value: overdueInvoices, color: "text-[#D0021B]", bg: "bg-[#FCE8EB]" },
            { label: "Active schedules", value: schedules.filter(s => s.status === "Active").length, color: "text-[#2855A6]", bg: "bg-[#EEF2FA]" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="text-[11px] text-muted-foreground mb-1">{s.label}</div>
              <div className={`text-[22px] font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-border">
          {([
            { id: "schedules", label: "Billing Schedules", count: schedules.length },
            { id: "invoices", label: "Invoices", count: invoices.length },
            { id: "payments", label: "Payments", count: payments.length },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${tab === t.id ? "border-[#2855A6] text-[#2855A6]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${tab === t.id ? "bg-[#EEF2FA] text-[#2855A6]" : "bg-[#F0F0F0] text-muted-foreground"}`}>{t.count}</span>
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative pb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-7 pr-3 py-1.5 text-[12px] bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#2855A6]/20 w-[200px]" />
          </div>
          <div className="pb-2 ml-2">
            <button onClick={handleExport} className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] text-muted-foreground border border-border rounded hover:bg-muted transition-colors"><Download size={12} />Export</button>
          </div>
        </div>

        {/* ── Schedules tab ── */}
        {tab === "schedules" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border bg-[#FAFAFA]">
                  {["Schedule ID", "Client", "Service", "Type", "Fee (excl. GST)", "Next billing", "Square", "Adviser", "Status", ""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((s, i) => (
                  <tr key={s.id} onClick={() => setSelectedSchedule(s)} className={`border-b border-border last:border-0 hover:bg-[#F8FAFF] cursor-pointer transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}>
                    <td className="px-4 py-3"><span className="font-mono text-[11px] text-[#2855A6]">{s.id}</span></td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[140px] truncate">{s.client}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate">{s.service}</td>
                    <td className="px-4 py-3"><ScheduleTypeBadge type={s.type} /></td>
                    <td className="px-4 py-3 font-semibold text-foreground">{AUD(s.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.nextDue}</td>
                    <td className="px-4 py-3">
                      {s.squareSubscriptionId
                        ? <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground"><span className="w-4 h-4 rounded bg-black flex items-center justify-center text-white text-[7px] font-bold">SQ</span>{s.squareSubscriptionId.slice(0, 10)}</span>
                        : <span className="text-[11px] text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.adviser}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${s.status === "Active" ? "bg-[#E8F7EB] text-[#1E7A31]" : s.status === "Paused" ? "bg-[#FEF6E9] text-[#B87A1A]" : "bg-[#F0F0F0] text-[#6F6F6F]"}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3"><button onClick={e => e.stopPropagation()} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><MoreHorizontal size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSchedules.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-[13px]">No billing schedules found.</div>
            )}
          </div>
        )}

        {/* ── Invoices tab ── */}
        {tab === "invoices" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border bg-[#FAFAFA]">
                  {["Invoice", "Client", "Description", "Amount", "Due", "Status", "Xero", "Square", ""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, i) => (
                  <tr key={inv.id} className={`border-b border-border last:border-0 hover:bg-[#F8FAFF] transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] text-[#2855A6]">{inv.id}</div>
                      {inv.xeroInvoiceNo && <div className="font-mono text-[10px] text-muted-foreground">{inv.xeroInvoiceNo}</div>}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[130px] truncate">{inv.client}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[170px] truncate">{inv.service}</td>
                    <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{AUD(inv.amount + inv.gst)}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{inv.due}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${invoiceStatusColor(inv.status)}`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3">{xeroStatusEl(inv.xeroStatus)}</td>
                    <td className="px-4 py-3">{squareStatusEl(inv.squareStatus)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {inv.status === "Draft" && (
                          <button onClick={() => setRaiseModal(inv)} className="px-2 py-1 text-[10px] font-semibold text-[#2855A6] border border-[#2855A6]/30 rounded hover:bg-[#EEF2FA] transition-colors whitespace-nowrap">Raise</button>
                        )}
                        <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><MoreHorizontal size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredInvoices.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-[13px]">No invoices found.</div>
            )}
          </div>
        )}

        {/* ── Payments tab ── */}
        {tab === "payments" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border bg-[#FAFAFA]">
                  {["Payment ID", "Client", "Invoice", "Amount", "Method", "Date", "Square Tx", "Xero", "Status", ""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p, i) => (
                  <tr key={p.id} className={`border-b border-border last:border-0 hover:bg-[#F8FAFF] transition-colors ${i % 2 !== 0 ? "bg-[#FAFAFA]/50" : ""}`}>
                    <td className="px-4 py-3"><span className="font-mono text-[11px] text-[#2855A6]">{p.id}</span></td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[130px] truncate">{p.client}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{p.invoiceId}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{AUD(p.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.method}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.date}</td>
                    <td className="px-4 py-3">
                      {p.squareTxId
                        ? <span className="flex items-center gap-1 text-[11px] text-foreground font-mono"><span className="w-4 h-4 rounded bg-black flex items-center justify-center text-white text-[7px] font-bold shrink-0">SQ</span>{p.squareTxId.slice(0, 12)}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {p.xeroReconciled
                        ? <span className="flex items-center gap-1 text-[#2EA843] text-[11px] font-semibold"><CheckCircle size={11} />Reconciled</span>
                        : <span className="flex items-center gap-1 text-[#F5A623] text-[11px] font-semibold"><Clock size={11} />Pending</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${paymentStatusColor(p.status)}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3"><button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><MoreHorizontal size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPayments.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-[13px]">No payments found.</div>
            )}
          </div>
        )}
      </PageShell>
    </>
  );
}

export default BillingScreen;
