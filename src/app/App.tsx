import { ErrorBoundary } from "./error-boundary";
import { Providers } from "./providers";
import { Router } from "./router";
import UpgradeModal from "@/components/UpgradeModal";

/**
 * Root application component
 *
 * Architecture layers:
 * 1. ErrorBoundary - Catches unhandled React errors
 * 2. Providers - All context and state management providers
 * 3. Router - Route definitions and auth-based routing logic
 * 4. UpgradeModal - Global UI modal for subscription upgrades
 */
export function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <Router />
        <UpgradeModal />
      </Providers>
    </ErrorBoundary>
  );
}

export default App;
