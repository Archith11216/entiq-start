import React, { useState, useEffect } from "react";
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  Eye,
  EyeOff,
  Server,
  Key,
  ShieldCheck,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { invitations as invitationsApi } from "../../lib/api";
import type { EmailConfig } from "../../types/api";

interface EmailSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const PRESETS = [
  {
    id: "ses",
    name: "Amazon SES",
    host: "email-smtp.ap-southeast-2.amazonaws.com",
    port: 587,
    notes: "Amazon Simple Email Service (SES) AP-Southeast-2 SMTP endpoint",
    docUrl: "https://aws.amazon.com/ses/",
  },
  {
    id: "gmail",
    name: "Gmail / G-Suite",
    host: "smtp.gmail.com",
    port: 587,
    notes: "Requires a 16-character Google App Password (2-Step Verification required)",
    docUrl: "https://myaccount.google.com/apppasswords",
  },
  {
    id: "outlook",
    name: "Microsoft 365 / Outlook",
    host: "smtp.office365.com",
    port: 587,
    notes: "Requires standard SMTP AUTH enabled in Microsoft 365 admin center",
    docUrl: "https://admin.microsoft.com",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    host: "smtp.sendgrid.net",
    port: 587,
    notes: "Username is 'apikey', Password is your SendGrid API key",
    docUrl: "https://app.sendgrid.com",
  },
  {
    id: "custom",
    name: "Custom SMTP",
    host: "",
    port: 587,
    notes: "Any standard TLS (587) or SSL (465) mail server",
  },
];

export function EmailSettingsModal({ isOpen, onClose, onSaved }: EmailSettingsModalProps) {
  const [config, setConfig] = useState<EmailConfig>({
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPasswordSet: false,
    smtpFromEmail: "",
    smtpFromName: "Grow Advisory Group",
    frontendUrl: "http://localhost:5173",
    isConfigured: false,
  });

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; message: string; delivered: boolean } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadConfig();
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await invitationsApi.getEmailConfig();
      if (data) {
        setConfig(data);
        if (data.smtpUser && !testEmail) {
          setTestEmail(data.smtpUser);
        }
      }
    } catch (err) {
      console.error("Failed to load email config", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    if (!preset.host) return;
    setConfig((prev) => ({
      ...prev,
      smtpHost: preset.host,
      smtpPort: preset.port,
      smtpUser: preset.id === "sendgrid" ? "apikey" : prev.smtpUser,
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setTestResult(null);
    try {
      const payload: any = {
        smtpHost: config.smtpHost.trim(),
        smtpPort: Number(config.smtpPort),
        smtpUser: config.smtpUser.trim(),
        smtpFromEmail: (config.smtpFromEmail || config.smtpUser).trim(),
        smtpFromName: config.smtpFromName.trim(),
        frontendUrl: (config.frontendUrl || window.location.origin).trim(),
      };
      if (password) {
        payload.smtpPassword = password;
      }
      const updated = await invitationsApi.updateEmailConfig(payload);
      setConfig(updated);
      setPassword("");
      setFeedback("SMTP settings successfully saved to database!");
      if (onSaved) onSaved();
    } catch (err: any) {
      setFeedback(`Failed to save settings: ${err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      setTestResult({ status: "error", message: "Please enter an email address to receive the test.", delivered: false });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const payload: any = {
        toEmail: testEmail.trim(),
        smtpHost: config.smtpHost.trim(),
        smtpPort: Number(config.smtpPort),
        smtpUser: config.smtpUser.trim(),
        smtpFromEmail: (config.smtpFromEmail || config.smtpUser).trim(),
        smtpFromName: config.smtpFromName.trim(),
      };
      if (password) {
        payload.smtpPassword = password;
      }
      const res = await invitationsApi.testEmail(payload);
      if (res.delivered) {
        setTestResult({
          status: "success",
          delivered: true,
          message: `Success! Test email was sent and delivered to ${testEmail}. Check your inbox.`,
        });
      } else {
        setTestResult({
          status: res.simulated ? "simulated" : "error",
          delivered: false,
          message: res.message || "Failed to deliver email. Please check your credentials.",
        });
      }
    } catch (err: any) {
      setTestResult({
        status: "error",
        delivered: false,
        message: err?.message || "Connection failed. Please check host, port and credentials.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card w-[640px] max-h-[92vh] overflow-y-auto rounded-xl shadow-2xl border border-border flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2855A6]/10 text-[#2855A6] flex items-center justify-center">
                <Mail size={18} />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-foreground">Email &amp; SMTP Settings</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Configure live email delivery so client invitations reach real inboxes
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Status Banner */}
        <div className="px-6 pt-4 pb-0">
          {config.isConfigured ? (
            <div className="p-3 bg-[#E8F7EB] border border-[#2EA843]/30 rounded-lg flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#1E7A31] mt-0.5 shrink-0" />
              <div className="text-[12px] text-[#1E7A31]">
                <div className="font-semibold">Live SMTP Active</div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  Invitations are sent via <strong>{config.smtpHost}:{config.smtpPort}</strong> as <strong>{config.smtpFromEmail || config.smtpUser}</strong>.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#FEF6E9] border border-[#F5A623]/30 rounded-lg flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-[#B87A1A] mt-0.5 shrink-0" />
              <div className="text-[12px] text-[#B87A1A]">
                <div className="font-semibold">Simulated Email Mode</div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  No SMTP password is set. Invitations are logged with test links. Enter your mail credentials below to deliver real emails.
                </div>
              </div>
            </div>
          )}

          {feedback && (
            <div className="mt-2.5 p-2.5 bg-[#EEF2FA] border border-[#2855A6]/30 text-[#2855A6] rounded text-[12px] font-medium flex items-center gap-2">
              <CheckCircle2 size={14} />
              {feedback}
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-[13px]">
          {/* Provider Quick Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">
              Quick Provider Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`p-2 rounded border text-left text-[11px] font-medium transition-all ${
                    config.smtpHost === p.host && p.host !== ""
                      ? "border-[#2855A6] bg-[#EEF2FA] text-[#2855A6] font-semibold ring-1 ring-[#2855A6]"
                      : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div>{p.name}</div>
                  <div className="text-[9px] opacity-70 truncate mt-0.5">{p.host || "Custom host"}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Host and Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-medium text-foreground mb-1">SMTP Host / Server *</label>
              <div className="relative">
                <Server size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={config.smtpHost}
                  onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                  placeholder="e.g. smtp.gmail.com"
                  className="w-full pl-8 pr-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">Port *</label>
              <select
                value={config.smtpPort}
                onChange={(e) => setConfig({ ...config, smtpPort: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              >
                <option value={587}>587 (TLS - Recommended)</option>
                <option value={465}>465 (SSL)</option>
                <option value={25}>25 (Standard)</option>
                <option value={2525}>2525 (Alternative)</option>
              </select>
            </div>
          </div>

          {/* Username and Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">Username / Account Email *</label>
              <input
                type="text"
                required
                value={config.smtpUser}
                onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                placeholder="yourname@gmail.com"
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">
                Password / App Password *
                {config.smtpPasswordSet && !password && (
                  <span className="text-[#2EA843] text-[11px] ml-1.5 font-normal">(&check; saved)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={config.smtpPasswordSet ? "•••••••••••••••• (Unchanged)" : "Enter App Password"}
                  className="w-full pl-3 pr-9 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* From Name & From Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">Sender Name (Shown in Inbox)</label>
              <input
                type="text"
                value={config.smtpFromName}
                onChange={(e) => setConfig({ ...config, smtpFromName: e.target.value })}
                placeholder="Grow Advisory Group"
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              />
            </div>
            <div>
              <label className="block font-medium text-foreground mb-1">From Email Address</label>
              <input
                type="email"
                value={config.smtpFromEmail}
                onChange={(e) => setConfig({ ...config, smtpFromEmail: e.target.value })}
                placeholder={config.smtpUser || "adviser@practice.com.au"}
                className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              />
            </div>
          </div>

          {/* Client Portal URL (Invite Link Base) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-medium text-foreground text-[12px]">
                Client Portal URL (Base Link for Invitations)
              </label>
              <div className="flex gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, frontendUrl: "http://localhost:5173" })}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    config.frontendUrl === "http://localhost:5173"
                      ? "bg-[#2855A6] text-white border-[#2855A6]"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  This PC (Localhost)
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, frontendUrl: `http://${window.location.hostname === 'localhost' ? '192.168.31.153' : window.location.hostname}:5173` })}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    config.frontendUrl.includes("192.168.31.153") || (!config.frontendUrl.includes("localhost") && config.frontendUrl !== "")
                      ? "bg-[#2855A6] text-white border-[#2855A6]"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Wi-Fi / Mobile Phone ({window.location.hostname === 'localhost' ? '192.168.31.153' : window.location.hostname})
                </button>
              </div>
            </div>
            <input
              type="text"
              value={config.frontendUrl || `http://${window.location.hostname === 'localhost' ? '192.168.31.153' : window.location.hostname}:5173`}
              onChange={(e) => setConfig({ ...config, frontendUrl: e.target.value })}
              placeholder="http://192.168.31.153:5173 or https://yourdomain.com"
              className="w-full px-3 py-2 bg-[#F5F5F5] border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] text-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground leading-normal">
              Used in the email invitation link. If you open email on your phone, select <strong>Wi-Fi / Mobile Phone</strong> or enter your production URL so your phone can reach this computer.
            </p>
          </div>

          {/* Gmail App Password Tip Box */}
          {config.smtpHost.includes("gmail") && (
            <div className="p-3 bg-[#EEF2FA]/50 border border-[#2855A6]/20 rounded-lg text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-[#2855A6] flex items-center gap-1">
                <HelpCircle size={13} /> Setting up Gmail in 1 minute:
              </div>
              <p>
                1. Enable <strong>2-Step Verification</strong> on your Google Account.<br />
                2. Visit{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2855A6] font-medium underline inline-flex items-center gap-0.5"
                >
                  Google App Passwords <ExternalLink size={10} />
                </a>.<br />
                3. Name it "EnTIQ" and generate a <strong>16-character App Password</strong>.<br />
                4. Paste that 16-character code into the password field above.
              </p>
            </div>
          )}

          {/* Test Email Section */}
          <div className="pt-3 border-t border-border space-y-2">
            <label className="block font-semibold text-foreground text-[12px]">
              Verify Delivery — Send a Test Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter your personal email to test"
                className="flex-1 px-3 py-2 bg-[#F5F5F5] border border-border rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              />
              <button
                type="button"
                disabled={testing || !testEmail.trim()}
                onClick={handleSendTest}
                className="px-4 py-2 bg-white border border-[#2855A6] text-[#2855A6] font-semibold text-[12px] rounded hover:bg-[#EEF2FA] transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <Send size={13} />
                {testing ? "Sending Test…" : "Send Test"}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded text-[12px] flex items-start gap-2 ${
                  testResult.delivered
                    ? "bg-[#E8F7EB] text-[#1E7A31] border border-[#2EA843]/30"
                    : "bg-[#FCE8EB] text-[#D0021B] border border-[#D0021B]/30"
                }`}
              >
                {testResult.delivered ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertTriangle size={15} className="shrink-0 mt-0.5" />}
                <div>{testResult.message}</div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground text-[13px]"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving || !config.smtpHost.trim() || !config.smtpUser.trim()}
              className="px-5 py-2 bg-[#2855A6] text-white text-[13px] font-semibold rounded hover:bg-[#1F4491] transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <ShieldCheck size={14} />
              {saving ? "Saving…" : "Save & Activate SMTP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
