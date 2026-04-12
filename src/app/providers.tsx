import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { PropertyProvider } from "@/lib/property-context";
import { DemoProvider } from "@/lib/demo-context";
import { PlanProvider } from "@/lib/plan-context";
import { queryClient } from "@/services/query-client";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root providers stack
 * Order matters: QueryClient > Tooltip > Router > Demo > Auth > Property > Plan
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <DemoProvider>
            <AuthProvider>
              <PropertyProvider>
                <PlanProvider>
                  {children}
                  <Toaster />
                  <Sonner />
                </PlanProvider>
              </PropertyProvider>
            </AuthProvider>
          </DemoProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
