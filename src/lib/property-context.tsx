import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  refetch: () => void;
}

const PropertyContext = createContext<PropertyContextType>({
  properties: [],
  activeProperty: null,
  setActiveProperty: () => {},
  loading: true,
  refetch: () => {},
});

export const useProperty = () => useContext(PropertyContext);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
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
      return;
    }

    if (!user) { setProperties([]); setActiveProperty(null); setLoading(false); return; }
    const { data } = await supabase
      .from("properties")
      .select("id, nama_kos, alamat")
      .order("created_at", { ascending: true });
    const props = (data as Property[]) || [];
    setProperties(props);
    if (props.length > 0 && !activeProperty) {
      setActiveProperty(props[0]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, [user, isDemo]);

  return (
    <PropertyContext.Provider value={{ properties, activeProperty, setActiveProperty, loading, refetch: fetchProperties }}>
      {children}
    </PropertyContext.Provider>
  );
}
