import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Loader2, Clock } from "lucide-react";

interface LogEntry {
  id: string;
  admin_email: string;
  action: string;
  detail: string | null;
  created_at: string;
}

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("admin_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      setLogs((data || []) as LogEntry[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Activity Log</h2>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No activity recorded yet</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="bg-card rounded-xl border border-border p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{log.action}</p>
                    {log.detail && <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.detail}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{log.admin_email}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock size={12} />
                    {new Date(log.created_at).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
