import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

type NoticeKind = "success" | "error" | "warning" | "info";
const icons = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };

export default function Notice({ kind = "info", title, children, compact = false }: { kind?: NoticeKind; title?: string; children: React.ReactNode; compact?: boolean }) {
  const Icon = icons[kind];
  return <div className={`modernNotice ${kind} ${compact ? "compact" : ""}`} role={kind === "error" ? "alert" : "status"}>
    <span className="modernNoticeIcon"><Icon aria-hidden="true" /></span>
    <div>{title && <b>{title}</b>}<p>{children}</p></div>
  </div>;
}
