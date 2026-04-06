import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "./BottomNav";

const TAB_ORDER = ["/", "/kamar", "/penyewa", "/keuangan", "/profil"];

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const currentIdx = TAB_ORDER.indexOf(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-app pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}
