import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  user_id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  birthdate?: string;
  age_years?: number;
  korean_name?: string;
  church?: string;
  home_church?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  role: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profileData: Partial<Profile> & { full_name: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Only send columns that exist in the DB schema to avoid 400 errors (e.g., 'church' does not exist)
      const allowedKeys: (keyof Profile)[] = [
        "first_name",
        "last_name",
        "phone",
        "birthdate",
        "age_years",
        "korean_name",
        "home_church",
        "emergency_contact_name",
        "emergency_contact_phone",
        "role",
      ];

      const filteredData = Object.fromEntries(
        Object.entries(profileData).filter(([key, value]) =>
          allowedKeys.includes(key as keyof Profile) && value !== undefined
        )
      );

      const payload = {
        user_id: user.id,
        email: user.email || "",
        full_name: profileData.full_name,
        ...(filteredData as Partial<Profile>),
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
};