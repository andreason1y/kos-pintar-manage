import { ReactNode } from "react";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-app pb-20">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
