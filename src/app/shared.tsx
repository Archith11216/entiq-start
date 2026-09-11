import { AlertTriangle } from "lucide-react";
import { Header } from "./components/Header";
import { useNavigation } from "./NavigationContext";

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
  const nav = useNavigation();

  return (
    <div className="flex flex-col h-full overflow-hidden">
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
