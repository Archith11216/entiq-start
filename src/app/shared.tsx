import { ChevronRight, Search, Bell, Plus, AlertTriangle } from "lucide-react";

// ─── PageShell ────────────────────────────────────────────────────────────────

export function PageShell({
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
        <button className="relative p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
          <Bell size={16} />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#D0021B] rounded-full" />
        </button>
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

// ─── Loading / Error UI ───────────────────────────────────────────────────────

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
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

export function ApiErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#FCE8EB] border border-[#D0021B]/20 text-[13px] text-[#A80016]">
      <AlertTriangle size={15} className="shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onRetry} className="text-[12px] font-semibold underline hover:no-underline">Retry</button>
    </div>
  );
}
