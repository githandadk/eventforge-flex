import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventFee {
  event_id: string;
  category: string;
  code: string;
  label: string;
  unit: string;
  amount: number;
}

export const useEventFees = (eventId: string) => {
  return useQuery({
    queryKey: ["event-fees", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_event_fees_admin")
        .select("*")
        .eq("event_id", eventId)
        .order("category", { ascending: true })
        .order("code", { ascending: true });

      if (error) throw error;
      return data as EventFee[];
    },
    enabled: !!eventId,
  });
};