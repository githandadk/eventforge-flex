import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventFee {
  id: string;
  event_id: string;
  category: string;
  code: string;
  label: string;
  unit: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export const useEventFees = (eventId: string) => {
  return useQuery({
    queryKey: ["event-fees", eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from("event_fees")
        .select("*")
        .eq("event_id", eventId)
        .order("category", { ascending: true })
        .order("code", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
};

export const useUpdateEventFee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { data, error } = await supabase
        .from("event_fees")
        .update({ amount })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-fees", data.event_id] });
    },
  });
};

export const useCreateEventFee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fee: Omit<EventFee, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("event_fees")
        .insert(fee)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-fees", data.event_id] });
    },
  });
};

export const useDeleteEventFee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("event_fees")
        .delete()
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-fees", data.event_id] });
    },
  });
};