import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAdminRole = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["admin-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data?.role === "admin" || data?.role === "staff";
    },
    enabled: !!user?.id,
  });
};