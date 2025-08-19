export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attendee_meal_passes: {
        Row: {
          attendee_id: string
          created_at: string
          id: string
          meal_session_id: string
          purchased: boolean
        }
        Insert: {
          attendee_id: string
          created_at?: string
          id?: string
          meal_session_id: string
          purchased?: boolean
        }
        Update: {
          attendee_id?: string
          created_at?: string
          id?: string
          meal_session_id?: string
          purchased?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "attendee_meal_passes_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendee_meal_passes_meal_session_id_fkey"
            columns: ["meal_session_id"]
            isOneToOne: false
            referencedRelation: "meal_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendees: {
        Row: {
          age_years: number | null
          birthdate: string | null
          created_at: string
          department_code: string
          department_surcharge: number
          email: string | null
          event_id: string
          full_name: string
          id: string
          phone: string | null
          profile_id: string | null
          qr_code_uid: string
          registration_id: string
          ticket_status: string
          wants_meals: boolean
        }
        Insert: {
          age_years?: number | null
          birthdate?: string | null
          created_at?: string
          department_code: string
          department_surcharge?: number
          email?: string | null
          event_id: string
          full_name: string
          id?: string
          phone?: string | null
          profile_id?: string | null
          qr_code_uid: string
          registration_id: string
          ticket_status?: string
          wants_meals?: boolean
        }
        Update: {
          age_years?: number | null
          birthdate?: string | null
          created_at?: string
          department_code?: string
          department_surcharge?: number
          email?: string | null
          event_id?: string
          full_name?: string
          id?: string
          phone?: string | null
          profile_id?: string | null
          qr_code_uid?: string
          registration_id?: string
          ticket_status?: string
          wants_meals?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "attendees_department_code_fkey"
            columns: ["department_code"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "attendees_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_buildings: {
        Row: {
          code: string
          created_at: string
          event_id: string
          gender_policy: string | null
          id: string
          is_accessible: boolean
          map_label: string | null
          map_lat: number | null
          map_lng: number | null
          name: string
          notes: string | null
        }
        Insert: {
          code: string
          created_at?: string
          event_id: string
          gender_policy?: string | null
          id?: string
          is_accessible?: boolean
          map_label?: string | null
          map_lat?: number | null
          map_lng?: number | null
          name: string
          notes?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          event_id?: string
          gender_policy?: string | null
          id?: string
          is_accessible?: boolean
          map_label?: string | null
          map_lat?: number | null
          map_lng?: number | null
          name?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campus_buildings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          action: string
          attendee_id: string
          event_id: string
          id: string
          meal_session_id: string | null
          scanned_at: string
          scanned_by: string | null
          schedule_session_id: string | null
          station: string
        }
        Insert: {
          action: string
          attendee_id: string
          event_id: string
          id?: string
          meal_session_id?: string | null
          scanned_at?: string
          scanned_by?: string | null
          schedule_session_id?: string | null
          station: string
        }
        Update: {
          action?: string
          attendee_id?: string
          event_id?: string
          id?: string
          meal_session_id?: string | null
          scanned_at?: string
          scanned_by?: string | null
          schedule_session_id?: string | null
          station?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_meal_session_id_fkey"
            columns: ["meal_session_id"]
            isOneToOne: false
            referencedRelation: "meal_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "checkins_schedule_session_id_fkey"
            columns: ["schedule_session_id"]
            isOneToOne: false
            referencedRelation: "schedule_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      event_department_surcharges: {
        Row: {
          department_code: string
          event_id: string
          surcharge: number
        }
        Insert: {
          department_code: string
          event_id: string
          surcharge?: number
        }
        Update: {
          department_code?: string
          event_id?: string
          surcharge?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_department_surcharges_department_code_fkey"
            columns: ["department_code"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "event_department_surcharges_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_discounts: {
        Row: {
          bulk_rate_multiplier: number | null
          code: string | null
          ends_at: string | null
          event_id: string
          id: string
          is_stackable: boolean
          kind: string
          label: string
          max_amount: number | null
          min_attendees: number | null
          note: string | null
          priority: number
          requires_role: string | null
          scope: string
          starts_at: string | null
          value: number
        }
        Insert: {
          bulk_rate_multiplier?: number | null
          code?: string | null
          ends_at?: string | null
          event_id: string
          id?: string
          is_stackable?: boolean
          kind: string
          label: string
          max_amount?: number | null
          min_attendees?: number | null
          note?: string | null
          priority?: number
          requires_role?: string | null
          scope: string
          starts_at?: string | null
          value?: number
        }
        Update: {
          bulk_rate_multiplier?: number | null
          code?: string | null
          ends_at?: string | null
          event_id?: string
          id?: string
          is_stackable?: boolean
          kind?: string
          label?: string
          max_amount?: number | null
          min_attendees?: number | null
          note?: string | null
          priority?: number
          requires_role?: string | null
          scope?: string
          starts_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_discounts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_settings: {
        Row: {
          currency: string
          default_meals_per_day: number
          event_id: string
          notes: Json | null
          room_key_deposit: number
        }
        Insert: {
          currency?: string
          default_meals_per_day?: number
          event_id: string
          notes?: Json | null
          room_key_deposit?: number
        }
        Update: {
          currency?: string
          default_meals_per_day?: number
          event_id?: string
          notes?: Json | null
          room_key_deposit?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          location: string | null
          name: string
          reg_close: string | null
          reg_open: string | null
          slug: string
          start_date: string
          timezone: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          location?: string | null
          name: string
          reg_close?: string | null
          reg_open?: string | null
          slug: string
          start_date: string
          timezone?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          location?: string | null
          name?: string
          reg_close?: string | null
          reg_open?: string | null
          slug?: string
          start_date?: string
          timezone?: string
        }
        Relationships: []
      }
      lodging_options: {
        Row: {
          ac: boolean
          capacity_per_room: number
          event_id: string
          id: string
          name: string
          nightly_rate: number
          notes: string | null
        }
        Insert: {
          ac?: boolean
          capacity_per_room?: number
          event_id: string
          id?: string
          name: string
          nightly_rate: number
          notes?: string | null
        }
        Update: {
          ac?: boolean
          capacity_per_room?: number
          event_id?: string
          id?: string
          name?: string
          nightly_rate?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lodging_options_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_sessions: {
        Row: {
          capacity: number | null
          event_id: string
          id: string
          meal_date: string
          meal_type: string
          price: number
        }
        Insert: {
          capacity?: number | null
          event_id: string
          id?: string
          meal_date: string
          meal_type: string
          price: number
        }
        Update: {
          capacity?: number | null
          event_id?: string
          id?: string
          meal_date?: string
          meal_type?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_years: number | null
          birthdate: string | null
          church: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          full_name: string
          home_church: string | null
          korean_name: string | null
          last_name: string | null
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_years?: number | null
          birthdate?: string | null
          church?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          full_name: string
          home_church?: string | null
          korean_name?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_years?: number | null
          birthdate?: string | null
          church?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          full_name?: string
          home_church?: string | null
          korean_name?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registration_applied_discounts: {
        Row: {
          amount_applied: number
          computed_at: string
          discount_id: string | null
          id: string
          reason: string | null
          registration_id: string
          scope: string
        }
        Insert: {
          amount_applied: number
          computed_at?: string
          discount_id?: string | null
          id?: string
          reason?: string | null
          registration_id: string
          scope: string
        }
        Update: {
          amount_applied?: number
          computed_at?: string
          discount_id?: string | null
          id?: string
          reason?: string | null
          registration_id?: string
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_applied_discounts_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "event_discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_applied_discounts_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_items: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          id: string
          kind: string
          qty: number
          ref_id: string | null
          ref_table: string | null
          registration_id: string
          unit_price: number
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          qty?: number
          ref_id?: string | null
          ref_table?: string | null
          registration_id: string
          unit_price?: number
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          qty?: number
          ref_id?: string | null
          ref_table?: string | null
          registration_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "registration_items_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_roles: {
        Row: {
          attendee_id: string | null
          id: string
          registration_id: string
          role: string
        }
        Insert: {
          attendee_id?: string | null
          id?: string
          registration_id: string
          role: string
        }
        Update: {
          attendee_id?: string | null
          id?: string
          registration_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_roles_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_roles_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          amount_total: number | null
          created_at: string
          created_by: string
          event_id: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          amount_total?: number | null
          created_at?: string
          created_by: string
          event_id: string
          id?: string
          notes?: string | null
          status?: string
        }
        Update: {
          amount_total?: number | null
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      room_booking_guests: {
        Row: {
          attendee_id: string
          id: string
          room_booking_id: string
        }
        Insert: {
          attendee_id: string
          id?: string
          room_booking_id: string
        }
        Update: {
          attendee_id?: string
          id?: string
          room_booking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_booking_guests_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_booking_guests_room_booking_id_fkey"
            columns: ["room_booking_id"]
            isOneToOne: false
            referencedRelation: "room_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      room_booking_rooms: {
        Row: {
          id: string
          room_booking_id: string
          room_id: string | null
        }
        Insert: {
          id?: string
          room_booking_id: string
          room_id?: string | null
        }
        Update: {
          id?: string
          room_booking_id?: string
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_booking_rooms_room_booking_id_fkey"
            columns: ["room_booking_id"]
            isOneToOne: false
            referencedRelation: "room_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_booking_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_bookings: {
        Row: {
          checkin_date: string
          checkout_date: string
          created_at: string
          event_id: string
          id: string
          key_deposit_per_key: number
          lodging_option_id: string
          num_keys: number
          registration_id: string
        }
        Insert: {
          checkin_date: string
          checkout_date: string
          created_at?: string
          event_id: string
          id?: string
          key_deposit_per_key?: number
          lodging_option_id: string
          num_keys?: number
          registration_id: string
        }
        Update: {
          checkin_date?: string
          checkout_date?: string
          created_at?: string
          event_id?: string
          id?: string
          key_deposit_per_key?: number
          lodging_option_id?: string
          num_keys?: number
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_bookings_lodging_option_id_fkey"
            columns: ["lodging_option_id"]
            isOneToOne: false
            referencedRelation: "lodging_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_bookings_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          building_id: string | null
          capacity: number
          event_id: string
          floor: string | null
          id: string
          is_accessible: boolean
          lodging_option_id: string
          room_number: string
          wing: string | null
        }
        Insert: {
          building_id?: string | null
          capacity?: number
          event_id: string
          floor?: string | null
          id?: string
          is_accessible?: boolean
          lodging_option_id: string
          room_number: string
          wing?: string | null
        }
        Update: {
          building_id?: string | null
          capacity?: number
          event_id?: string
          floor?: string | null
          id?: string
          is_accessible?: boolean
          lodging_option_id?: string
          room_number?: string
          wing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "campus_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "vw_building_occupancy"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "rooms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_lodging_option_id_fkey"
            columns: ["lodging_option_id"]
            isOneToOne: false
            referencedRelation: "lodging_options"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_sessions: {
        Row: {
          description: string | null
          ends_at: string
          event_id: string
          id: string
          location: string | null
          starts_at: string
          title: string
        }
        Insert: {
          description?: string | null
          ends_at: string
          event_id: string
          id?: string
          location?: string | null
          starts_at: string
          title: string
        }
        Update: {
          description?: string | null
          ends_at?: string
          event_id?: string
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      shuttle_requests: {
        Row: {
          airline: string | null
          airport: string
          attendee_id: string | null
          direction: string
          fee: number
          flight_number: string | null
          id: string
          notes: string | null
          registration_id: string
          travel_time: string | null
        }
        Insert: {
          airline?: string | null
          airport: string
          attendee_id?: string | null
          direction: string
          fee?: number
          flight_number?: string | null
          id?: string
          notes?: string | null
          registration_id: string
          travel_time?: string | null
        }
        Update: {
          airline?: string | null
          airport?: string
          attendee_id?: string | null
          direction?: string
          fee?: number
          flight_number?: string | null
          id?: string
          notes?: string | null
          registration_id?: string
          travel_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shuttle_requests_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shuttle_requests_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_building_occupancy: {
        Row: {
          bed_capacity: number | null
          building_id: string | null
          building_name: string | null
          event_id: string | null
          occupants_active: number | null
          room_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campus_buildings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
