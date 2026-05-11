import { Home, DoorOpen, Users, Wallet, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/beranda", label: "Beranda", icon: Home },
  { path: "/kamar", label: "Kamar", icon: DoorOpen },
  { path: "/penyewa", label: "Penyewa", icon: Users },
  { path: "/keuangan", label: "Keuangan", icon: Wallet },
  { path: "/profil", label: "Profil", icon: UserCircle },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/60 safe-bottom">
      <div className="mx-auto max-w-app flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 relative"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px w-6 h-0.5 rounded-full bg-foreground"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <tab.icon
                size={20}
                strokeWidth={active ? 2.5 : 1.5}
                className={active ? "text-foreground" : "text-muted-foreground"}
              />
              <span
                className={`text-[10px] ${
                  active ? "text-foreground font-semibold" : "text-muted-foreground font-medium"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
