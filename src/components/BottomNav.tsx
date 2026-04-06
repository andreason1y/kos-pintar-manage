import { Home, DoorOpen, Users, Wallet, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/", label: "Beranda", icon: Home },
  { path: "/kamar", label: "Kamar", icon: DoorOpen },
  { path: "/penyewa", label: "Penyewa", icon: Users },
  { path: "/keuangan", label: "Keuangan", icon: Wallet },
  { path: "/profil", label: "Profil", icon: UserCircle },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="mx-auto max-w-app flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 relative"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 w-8 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <tab.icon
                size={22}
                className={active ? "text-primary" : "text-muted-foreground"}
              />
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-primary" : "text-muted-foreground"
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
