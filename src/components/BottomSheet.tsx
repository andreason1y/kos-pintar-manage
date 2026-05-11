import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[60] mx-auto flex max-h-[calc(100dvh-1rem)] max-w-app flex-col rounded-t-2xl bg-card border-t border-border"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card z-10 rounded-t-2xl">
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="bottom-sheet-scroll flex-1 overflow-y-auto p-4 safe-bottom">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
