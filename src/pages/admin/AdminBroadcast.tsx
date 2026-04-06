import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminBroadcast() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) { toast.error("Pesan tidak boleh kosong"); return; }
    setSending(true);
    const { error } = await supabase.from("broadcasts").insert({
      message: message.trim(),
      created_by: user?.id,
    } as any);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Broadcast terkirim ke semua user!");
      setSent(true);
      setTimeout(() => { setSent(false); setMessage(""); }, 2000);
    }
    setSending(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-3">Kirim Pengumuman</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Pesan ini akan tampil di notification bell semua user.
          </p>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Pesan</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tulis pengumuman di sini..."
                rows={5}
                className="resize-none"
              />
            </div>
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 py-3 text-[hsl(142,71%,45%)]"
                >
                  <CheckCircle size={20} />
                  <span className="text-sm font-medium">Terkirim!</span>
                </motion.div>
              ) : (
                <motion.div key="btn" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Button className="w-full" onClick={handleSend} disabled={sending || !message.trim()}>
                    {sending ? (
                      <><Loader2 size={16} className="mr-2 animate-spin" /> Mengirim...</>
                    ) : (
                      <><Send size={16} className="mr-2" /> Kirim ke Semua User</>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}