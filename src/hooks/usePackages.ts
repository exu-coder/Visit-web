import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Package } from "@/types/package";

export const usePackages = () => {
  return useQuery({
    queryKey: ["packages"],
    queryFn: async (): Promise<Package[]> => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching packages:", error);
        throw error;
      }

      return (data || []).map((pkg) => ({
        ...pkg,
        regional_prices: pkg.regional_prices as Record<string, number | null> | null,
      }));
    },
  });
};
