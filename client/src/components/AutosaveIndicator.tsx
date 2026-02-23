import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function AutosaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  return (
    <div className="font-mono text-[10px] flex items-center gap-1.5" data-testid="text-save-status">
      {status === "saving" && (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
          <span className="text-yellow-500">SAVING...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span className="text-green-500">SAVED</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertTriangle className="w-3 h-3 text-red-500" />
          <span className="text-red-500">ERROR</span>
        </>
      )}
    </div>
  );
}
