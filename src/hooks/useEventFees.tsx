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
      if (!eventId) return [];

      // Get event data to build fee structure
      const { data: event, error } = await supabase
        .from("events")
        .select("currency, lodging_option, meal_option, shuttle_option")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      const fees: EventFee[] = [];

      // Add basic registration fee (placeholder - this would come from your business logic)
      fees.push({
        event_id: eventId,
        category: "registration",
        code: "REG_BASE",
        label: "Base Registration Fee",
        unit: "person",
        amount: 50.00
      });

      // Add fees based on event options
      if (event.lodging_option) {
        fees.push({
          event_id: eventId,
          category: "lodging",
          code: "LODGING",
          label: "Lodging Fee",
          unit: "night",
          amount: 25.00
        });
      }

      if (event.meal_option) {
        fees.push({
          event_id: eventId,
          category: "meal",
          code: "MEAL",
          label: "Meal Plan",
          unit: "person",
          amount: 15.00
        });
      }

      if (event.shuttle_option) {
        fees.push({
          event_id: eventId,
          category: "shuttle",
          code: "SHUTTLE",
          label: "Airport Shuttle",
          unit: "trip",
          amount: 10.00
        });
      }

      return fees;
    },
    enabled: !!eventId,
  });
};