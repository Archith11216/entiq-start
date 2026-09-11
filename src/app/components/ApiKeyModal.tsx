import { useState, useEffect } from "react";
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle2,
  Database,
  X,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { apiKeys, apiKeyStore, billing } from "../../lib/api";
import type { ApiKeyItem } from "../../types/api";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [keysList, setKeysList] = useState<ApiKeyItem[]>([]);
  const [currentKey, setCurrentKey] = useState<string>(apiKeyStore.get());
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking");
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    loadKeys();
    testConnection();
  }, [isOpen]);

  const loadKeys = async () => {
    try {
      const list = await apiKeys.list();
      if (list && list.length > 0) {
        setKeysList(list);
      }
    } catch (err) {
      console.error("Failed to load API keys", err);
    }
  };

  const testConnection = async () => {
    setDbStatus("checking");
    const start = performance.now();
    try {
      await billing.getStats();
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);
      setDbStatus("connected");
    } catch {
      setDbStatus("error");
    }
  };

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreating(true);
    try {
      const created = await apiKeys.create(newKeyName.trim());
      setKeysList((prev) => [created, ...prev]);
      setNewKeyName("");
      // Automatically switch to the new key
      apiKeyStore.set(created.key);
      setCurrentKey(created.key);
      testConnection();
    } catch (err) {
      console.error("Failed to create API key", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetActive = (keyVal: string) => {
    apiKeyStore.set(keyVal);
    setCurrentKey(keyVal);
    testConnection();
  };

  const handleRevoke = async (id: string) => {
    try {
      await apiKeys.revoke(id);
      setKeysList((prev) =>
        prev.map((k) => (k.id === id ? { ...k, isActive: false } : k))
      );
    } catch (err) {
      console.error("Failed to revoke API key", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2855A6]/10 text-[#2855A6] flex items-center justify-center font-bold">
              <Key size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
                API Keys & Database Storage
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E8F7EB] text-[#2EA843]">
                  <Database size={11} /> SQLite Connected
                </span>
              </h2>
              <p className="text-[12px] text-muted-foreground">
                All frontend and backend transactions are secured and saved to SQLite using API keys.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Active Key Banner */}
          <div className="p-4 rounded-lg border border-[#2855A6]/30 bg-[#EEF2FA]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#2855A6]" />
                <span className="text-[13px] font-semibold text-foreground">
                  Active Frontend API Key
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {dbStatus === "connected" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2EA843] bg-white px-2 py-0.5 rounded border border-[#2EA843]/30">
                    <CheckCircle2 size={12} /> Authenticated ({latency}ms)
                  </span>
                ) : dbStatus === "checking" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-white px-2 py-0.5 rounded border border-border">
                    Testing connection...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D0021B] bg-white px-2 py-0.5 rounded border border-[#D0021B]/30">
                    Connection error
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-border rounded px-3 py-2 font-mono text-[12px] text-foreground flex items-center justify-between select-all">
                <span>
                  {showKey
                    ? currentKey
                    : currentKey.slice(0, 14) + "••••••••••••••••••••••••"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-muted-foreground hover:text-foreground p-1"
                  title={showKey ? "Hide API key" : "Reveal API key"}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(currentKey)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded bg-card border border-border text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              >
                {copied ? <Check size={14} className="text-[#2EA843]" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy key"}</span>
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Passed via the <code className="bg-white px-1.5 py-0.5 rounded border border-border text-[#2855A6] font-semibold">X-API-Key</code> request header. All practice records (Clients, Cases, Billing Schedules, Invoices, Services, Pricing, Workflows) are securely persisted into the SQLite database.
            </p>
          </div>

          {/* Generate New Key Form */}
          <form onSubmit={handleCreate} className="p-4 rounded-lg border border-border bg-muted/10 space-y-3">
            <h3 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
              <Plus size={14} /> Generate New API Key
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key label (e.g., Live Production, Zapier Webhook, Tablet App)"
                className="flex-1 px-3 py-2 text-[13px] bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
              />
              <button
                type="submit"
                disabled={!newKeyName.trim() || isCreating}
                className="px-4 py-2 bg-[#2855A6] text-white text-[12px] font-semibold rounded hover:bg-[#1F4491] transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Zap size={13} /> {isCreating ? "Generating..." : "Generate Key"}
              </button>
            </div>
          </form>

          {/* Stored Keys Table */}
          <div className="space-y-2">
            <h3 className="text-[13px] font-semibold text-foreground">
              Stored API Keys in Database ({keysList.length})
            </h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2">Name / Label</th>
                    <th className="px-3 py-2">API Key</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {keysList.map((k) => {
                    const isCurrent = k.key === currentKey;
                    return (
                      <tr
                        key={k.id}
                        className={`hover:bg-muted/20 transition-colors ${
                          isCurrent ? "bg-[#EEF2FA]/20" : ""
                        }`}
                      >
                        <td className="px-3 py-2.5 font-medium text-foreground">
                          {k.name}
                          {isCurrent && (
                            <span className="ml-2 text-[10px] font-semibold text-[#2855A6] bg-[#EEF2FA] px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                          {k.key.slice(0, 16)}...
                        </td>
                        <td className="px-3 py-2.5">
                          {k.isActive ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E8F7EB] text-[#2EA843]">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FCE8EB] text-[#D0021B]">
                              Revoked
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(k.key)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Copy key"
                          >
                            <Copy size={13} />
                          </button>
                          {!isCurrent && k.isActive && (
                            <button
                              type="button"
                              onClick={() => handleSetActive(k.key)}
                              className="px-2 py-0.5 text-[11px] font-medium text-[#2855A6] hover:bg-[#EEF2FA] rounded transition-colors"
                            >
                              Use
                            </button>
                          )}
                          {k.id !== "key-master-001" && k.isActive && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(k.id)}
                              className="p-1 rounded text-muted-foreground hover:text-[#D0021B] hover:bg-[#FCE8EB] transition-colors"
                              title="Revoke key"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <button
            type="button"
            onClick={testConnection}
            className="text-[12px] font-medium text-[#2855A6] hover:underline flex items-center gap-1"
          >
            <Zap size={12} /> Test API Connection
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-[12px] font-semibold rounded bg-[#2855A6] text-white hover:bg-[#1F4491] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
