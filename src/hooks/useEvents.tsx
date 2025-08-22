import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Event {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  reg_open?: string;
  reg_close?: string;
  slug: string;
  timezone: string;
  created_at: string;
  currency: string;
  lodging_option: boolean;
  meal_option: boolean;
  shuttle_option: boolean;
}

export const useEvents = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data as Event[];
    },
  });
};

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: ["event", id, "v2"], // Updated to force cache refresh
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          lodging_options(*),
          event_discounts(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};