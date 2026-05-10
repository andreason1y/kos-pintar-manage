import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import { useDemo } from "./demo-context";

interface Property {
  id: string;
  nama_kos: string;
  alamat: string | null;
}

interface PropertyContextType {
  properties: Property[];
  activeProperty: Property | null;
  setActiveProperty: (p: Property) => void;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const PropertyContext = createContext<PropertyContextType>({
  properties: [],
  activeProperty: null,
  setActiveProperty: () => {},
  loading: true,
  error: null,
  refetch: () => {},
});

export const useProperty = () => useContext(PropertyContext);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    // Demo mode - provide a fake property
    if (isDemo) {
      const demoProperty: Property = {
        id: "demo-property-1",
        nama_kos: "Kos Demo",
        alamat: "Alamat Demo"
      };
      setProperties([demoProperty]);
      setActiveProperty(demoProperty);
      setLoading(false);
      setError(null);
      return;
    }

    if (!user) {
      setProperties([]);
      setActiveProperty(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("properties")
        .select("id, nama_kos, alamat")
        .order("created_at", { ascending: true });

      if (fetchError) {
        Sentry.captureException(fetchError, { tags: { source: "fetchProperties" } });
        setError("Gagal memuat data properti. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      const props = (data as Property[]) || [];
      setProperties(props);
      if (props.length > 0 && !activeProperty) {
        setActiveProperty(props[0]);
      }
      setError(null);
    } catch (err) {
      Sentry.captureException(err, { tags: { source: "fetchProperties" } });
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, activeProperty]);

  useEffect(() => { fetchProperties(); }, [user, isDemo]);

  return (
    <PropertyContext.Provider value={{ properties, activeProperty, setActiveProperty, loading, error, refetch: fetchProperties }}>
      {children}
    </PropertyContext.Provider>
  );
}
