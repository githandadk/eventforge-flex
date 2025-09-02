

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."enforce_profile_role_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  jwt_role text := coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'),'');
begin
  -- allow DB owner (SQL editor/migrations) or service-role (server/edge)
  if current_user = 'postgres' or jwt_role = 'service_role' then
    return new;
  end if;

  if TG_OP = 'INSERT' then
    if not public.is_admin(coalesce(auth.uid(), new.user_id)) then
      new.role := 'attendee';
    end if;
    return new;

  elsif TG_OP = 'UPDATE' then
    if not public.is_admin(coalesce(auth.uid(), new.user_id))
       and new.role is distinct from old.role then
      raise exception 'Insufficient privileges to change role';
    end if;
    return new;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_profile_role_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')),''),
      SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)
    )
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id
      AND p.role IN ('admin','staff')
  );
$$;


ALTER FUNCTION "public"."is_admin"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."attendee_meal_passes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "attendee_id" "uuid" NOT NULL,
    "meal_session_id" "uuid" NOT NULL,
    "purchased" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."attendee_meal_passes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "profile_id" "uuid",
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "birthdate" "date",
    "age_years" integer,
    "department_code" "text" NOT NULL,
    "department_surcharge" numeric(10,2) DEFAULT 0 NOT NULL,
    "wants_meals" boolean DEFAULT true NOT NULL,
    "qr_code_uid" "text" NOT NULL,
    "ticket_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "text" DEFAULT 'attendee'::"text" NOT NULL,
    CONSTRAINT "attendees_role_check" CHECK (("role" = ANY (ARRAY['attendee'::"text", 'volunteer'::"text", 'presenter'::"text"])))
);


ALTER TABLE "public"."attendees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campus_buildings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "gender_policy" "text" DEFAULT 'any'::"text",
    "is_accessible" boolean DEFAULT false NOT NULL,
    "map_label" "text",
    "map_lat" numeric,
    "map_lng" numeric,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campus_buildings_gender_policy_check" CHECK (("gender_policy" = ANY (ARRAY['any'::"text", 'men'::"text", 'women'::"text", 'family'::"text"])))
);


ALTER TABLE "public"."campus_buildings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "attendee_id" "uuid" NOT NULL,
    "station" "text" NOT NULL,
    "action" "text" NOT NULL,
    "meal_session_id" "uuid",
    "schedule_session_id" "uuid",
    "scanned_by" "uuid",
    "scanned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "checkins_action_check" CHECK (("action" = ANY (ARRAY['in'::"text", 'out'::"text"]))),
    CONSTRAINT "checkins_station_check" CHECK (("station" = ANY (ARRAY['dining'::"text", 'seminar'::"text"])))
);


ALTER TABLE "public"."checkins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_discounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "code" "text",
    "label" "text" NOT NULL,
    "scope" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "value" numeric(12,2) DEFAULT 0 NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "requires_role" "text",
    "min_attendees" integer,
    "bulk_rate_multiplier" numeric(5,3),
    "is_stackable" boolean DEFAULT false NOT NULL,
    "priority" integer DEFAULT 100 NOT NULL,
    "max_amount" numeric(12,2),
    "note" "text",
    CONSTRAINT "event_discounts_kind_check" CHECK (("kind" = ANY (ARRAY['percent'::"text", 'fixed'::"text", 'comp'::"text"]))),
    CONSTRAINT "event_discounts_requires_role_check" CHECK (("requires_role" = ANY (ARRAY['volunteer'::"text", 'presenter'::"text"]))),
    CONSTRAINT "event_discounts_scope_check" CHECK (("scope" = ANY (ARRAY['room'::"text", 'meal'::"text", 'all'::"text"])))
);


ALTER TABLE "public"."event_discounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_fees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "code" "text" NOT NULL,
    "label" "text" NOT NULL,
    "unit" "text" NOT NULL,
    "amount" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."event_fees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "timezone" "text" DEFAULT 'America/New_York'::"text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "reg_open" timestamp with time zone,
    "reg_close" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text",
    "location" "text",
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "lodging_option" boolean DEFAULT false NOT NULL,
    "meal_option" boolean DEFAULT false NOT NULL,
    "shuttle_option" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lodging_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "ac" boolean DEFAULT false NOT NULL,
    "nightly_rate" numeric(10,2) NOT NULL,
    "capacity_per_room" integer DEFAULT 4 NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."lodging_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "meal_date" "date" NOT NULL,
    "meal_type" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "capacity" integer,
    CONSTRAINT "meal_sessions_meal_type_check" CHECK (("meal_type" = ANY (ARRAY['breakfast'::"text", 'lunch'::"text", 'dinner'::"text"])))
);


ALTER TABLE "public"."meal_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "birthdate" "date",
    "role" "text" DEFAULT 'attendee'::"text" NOT NULL,
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "korean_name" "text",
    "home_church" "text",
    "age_years" integer
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registration_applied_discounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "discount_id" "uuid",
    "scope" "text" NOT NULL,
    "amount_applied" numeric(12,2) NOT NULL,
    "computed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reason" "text",
    CONSTRAINT "registration_applied_discounts_scope_check" CHECK (("scope" = ANY (ARRAY['room'::"text", 'meal'::"text", 'all'::"text"])))
);


ALTER TABLE "public"."registration_applied_discounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registration_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "ref_table" "text",
    "ref_id" "uuid",
    "qty" numeric(10,2) DEFAULT 1 NOT NULL,
    "unit_price" numeric(12,2) DEFAULT 0 NOT NULL,
    "amount" numeric(12,2) GENERATED ALWAYS AS (("qty" * "unit_price")) STORED,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "registration_items_kind_check" CHECK (("kind" = ANY (ARRAY['room_night'::"text", 'meal'::"text", 'department_surcharge'::"text", 'key_deposit'::"text", 'shuttle'::"text", 'discount'::"text", 'comp'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."registration_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registration_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "attendee_id" "uuid",
    "role" "text" NOT NULL,
    CONSTRAINT "registration_roles_role_check" CHECK (("role" = ANY (ARRAY['volunteer'::"text", 'presenter'::"text"])))
);


ALTER TABLE "public"."registration_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "amount_total" numeric(12,2) DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_booking_guests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_booking_id" "uuid" NOT NULL,
    "attendee_id" "uuid" NOT NULL
);


ALTER TABLE "public"."room_booking_guests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_booking_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_booking_id" "uuid" NOT NULL,
    "room_id" "uuid"
);


ALTER TABLE "public"."room_booking_rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "lodging_option_id" "uuid" NOT NULL,
    "checkin_date" "date" NOT NULL,
    "checkout_date" "date" NOT NULL,
    "num_keys" integer DEFAULT 1 NOT NULL,
    "key_deposit_per_key" numeric(10,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "room_bookings_num_keys_check" CHECK ((("num_keys" >= 0) AND ("num_keys" <= 2)))
);


ALTER TABLE "public"."room_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "lodging_option_id" "uuid" NOT NULL,
    "room_number" "text" NOT NULL,
    "capacity" integer DEFAULT 4 NOT NULL,
    "is_accessible" boolean DEFAULT false NOT NULL,
    "building_id" "uuid",
    "floor" "text",
    "wing" "text"
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "location" "text",
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."schedule_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shuttle_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "attendee_id" "uuid",
    "direction" "text" NOT NULL,
    "airport" "text" NOT NULL,
    "airline" "text",
    "flight_number" "text",
    "travel_time" timestamp with time zone,
    "fee" numeric(10,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    CONSTRAINT "shuttle_requests_direction_check" CHECK (("direction" = ANY (ARRAY['arrival'::"text", 'departure'::"text"])))
);


ALTER TABLE "public"."shuttle_requests" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_building_occupancy" WITH ("security_barrier"='true', "security_invoker"='true') AS
 SELECT "b"."event_id",
    "b"."id" AS "building_id",
    "b"."name" AS "building_name",
    "count"(DISTINCT "r"."id") AS "room_count",
    "sum"("r"."capacity") AS "bed_capacity",
    "count"(DISTINCT "rbg"."attendee_id") FILTER (WHERE ("a"."ticket_status" = 'active'::"text")) AS "occupants_active"
   FROM (((("public"."campus_buildings" "b"
     LEFT JOIN "public"."rooms" "r" ON (("r"."building_id" = "b"."id")))
     LEFT JOIN "public"."room_booking_rooms" "rbr" ON (("rbr"."room_id" = "r"."id")))
     LEFT JOIN "public"."room_booking_guests" "rbg" ON (("rbg"."room_booking_id" = "rbr"."room_booking_id")))
     LEFT JOIN "public"."attendees" "a" ON (("a"."id" = "rbg"."attendee_id")))
  GROUP BY "b"."event_id", "b"."id", "b"."name";


ALTER VIEW "public"."vw_building_occupancy" OWNER TO "postgres";


ALTER TABLE ONLY "public"."attendee_meal_passes"
    ADD CONSTRAINT "attendee_meal_passes_attendee_id_meal_session_id_key" UNIQUE ("attendee_id", "meal_session_id");



ALTER TABLE ONLY "public"."attendee_meal_passes"
    ADD CONSTRAINT "attendee_meal_passes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendees"
    ADD CONSTRAINT "attendees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendees"
    ADD CONSTRAINT "attendees_qr_code_uid_key" UNIQUE ("qr_code_uid");



ALTER TABLE ONLY "public"."campus_buildings"
    ADD CONSTRAINT "campus_buildings_event_id_code_key" UNIQUE ("event_id", "code");



ALTER TABLE ONLY "public"."campus_buildings"
    ADD CONSTRAINT "campus_buildings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."event_discounts"
    ADD CONSTRAINT "event_discounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_fees"
    ADD CONSTRAINT "event_fees_event_id_code_key" UNIQUE ("event_id", "code");



ALTER TABLE ONLY "public"."event_fees"
    ADD CONSTRAINT "event_fees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."lodging_options"
    ADD CONSTRAINT "lodging_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_sessions"
    ADD CONSTRAINT "meal_sessions_event_id_meal_date_meal_type_key" UNIQUE ("event_id", "meal_date", "meal_type");



ALTER TABLE ONLY "public"."meal_sessions"
    ADD CONSTRAINT "meal_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."registration_applied_discounts"
    ADD CONSTRAINT "registration_applied_discounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registration_items"
    ADD CONSTRAINT "registration_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registration_roles"
    ADD CONSTRAINT "registration_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registration_roles"
    ADD CONSTRAINT "registration_roles_registration_id_attendee_id_role_key" UNIQUE ("registration_id", "attendee_id", "role");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_booking_guests"
    ADD CONSTRAINT "room_booking_guests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_booking_rooms"
    ADD CONSTRAINT "room_booking_rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_bookings"
    ADD CONSTRAINT "room_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_event_id_room_number_key" UNIQUE ("event_id", "room_number");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_sessions"
    ADD CONSTRAINT "schedule_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shuttle_requests"
    ADD CONSTRAINT "shuttle_requests_pkey" PRIMARY KEY ("id");



CREATE INDEX "attendees_event_idx" ON "public"."attendees" USING "btree" ("event_id");



CREATE INDEX "attendees_reg_idx" ON "public"."attendees" USING "btree" ("registration_id");



CREATE INDEX "campus_buildings_event_idx" ON "public"."campus_buildings" USING "btree" ("event_id");



CREATE INDEX "checkins_attendee_idx" ON "public"."checkins" USING "btree" ("attendee_id");



CREATE INDEX "checkins_event_idx" ON "public"."checkins" USING "btree" ("event_id");



CREATE INDEX "checkins_station_idx" ON "public"."checkins" USING "btree" ("station");



CREATE INDEX "event_discounts_event_idx" ON "public"."event_discounts" USING "btree" ("event_id");



CREATE INDEX "lodging_options_event_idx" ON "public"."lodging_options" USING "btree" ("event_id");



CREATE INDEX "meal_sessions_event_idx" ON "public"."meal_sessions" USING "btree" ("event_id");



CREATE INDEX "rad_reg_idx" ON "public"."registration_applied_discounts" USING "btree" ("registration_id");



CREATE INDEX "rbg_room_booking_idx" ON "public"."room_booking_guests" USING "btree" ("room_booking_id");



CREATE INDEX "reg_items_reg_idx" ON "public"."registration_items" USING "btree" ("registration_id");



CREATE INDEX "registrations_event_idx" ON "public"."registrations" USING "btree" ("event_id");



CREATE INDEX "room_bookings_event_idx" ON "public"."room_bookings" USING "btree" ("event_id");



CREATE INDEX "rooms_building_floor_idx" ON "public"."rooms" USING "btree" ("building_id", "floor");



CREATE INDEX "rooms_building_idx" ON "public"."rooms" USING "btree" ("building_id");



CREATE OR REPLACE TRIGGER "trg_profiles_role_guard" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_profile_role_guard"();



CREATE OR REPLACE TRIGGER "update_event_fees_updated_at" BEFORE UPDATE ON "public"."event_fees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."attendee_meal_passes"
    ADD CONSTRAINT "attendee_meal_passes_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendee_meal_passes"
    ADD CONSTRAINT "attendee_meal_passes_meal_session_id_fkey" FOREIGN KEY ("meal_session_id") REFERENCES "public"."meal_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendees"
    ADD CONSTRAINT "attendees_department_code_fkey" FOREIGN KEY ("department_code") REFERENCES "public"."departments"("code");



ALTER TABLE ONLY "public"."attendees"
    ADD CONSTRAINT "attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendees"
    ADD CONSTRAINT "attendees_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."attendees"
    ADD CONSTRAINT "attendees_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campus_buildings"
    ADD CONSTRAINT "campus_buildings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_meal_session_id_fkey" FOREIGN KEY ("meal_session_id") REFERENCES "public"."meal_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_scanned_by_fkey" FOREIGN KEY ("scanned_by") REFERENCES "public"."profiles"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_schedule_session_id_fkey" FOREIGN KEY ("schedule_session_id") REFERENCES "public"."schedule_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_discounts"
    ADD CONSTRAINT "event_discounts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lodging_options"
    ADD CONSTRAINT "lodging_options_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_sessions"
    ADD CONSTRAINT "meal_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registration_applied_discounts"
    ADD CONSTRAINT "registration_applied_discounts_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "public"."event_discounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."registration_applied_discounts"
    ADD CONSTRAINT "registration_applied_discounts_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registration_items"
    ADD CONSTRAINT "registration_items_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registration_roles"
    ADD CONSTRAINT "registration_roles_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registration_roles"
    ADD CONSTRAINT "registration_roles_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_booking_guests"
    ADD CONSTRAINT "room_booking_guests_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_booking_guests"
    ADD CONSTRAINT "room_booking_guests_room_booking_id_fkey" FOREIGN KEY ("room_booking_id") REFERENCES "public"."room_bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_booking_rooms"
    ADD CONSTRAINT "room_booking_rooms_room_booking_id_fkey" FOREIGN KEY ("room_booking_id") REFERENCES "public"."room_bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_booking_rooms"
    ADD CONSTRAINT "room_booking_rooms_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."room_bookings"
    ADD CONSTRAINT "room_bookings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_bookings"
    ADD CONSTRAINT "room_bookings_lodging_option_id_fkey" FOREIGN KEY ("lodging_option_id") REFERENCES "public"."lodging_options"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_bookings"
    ADD CONSTRAINT "room_bookings_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "public"."campus_buildings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_lodging_option_id_fkey" FOREIGN KEY ("lodging_option_id") REFERENCES "public"."lodging_options"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_sessions"
    ADD CONSTRAINT "schedule_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shuttle_requests"
    ADD CONSTRAINT "shuttle_requests_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shuttle_requests"
    ADD CONSTRAINT "shuttle_requests_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can delete events" ON "public"."events" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admin can insert events" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admin can update events" ON "public"."events" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Admin manage event fees" ON "public"."event_fees" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "Delete my attendee meal passes" ON "public"."attendee_meal_passes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."attendees" "a"
     JOIN "public"."registrations" "r" ON (("r"."id" = "a"."registration_id")))
  WHERE (("a"."id" = "attendee_meal_passes"."attendee_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Delete my room booking guests" ON "public"."room_booking_guests" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."room_bookings" "rb"
     JOIN "public"."registrations" "r" ON (("r"."id" = "rb"."registration_id")))
  WHERE (("rb"."id" = "room_booking_guests"."room_booking_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Insert attendees under my registration" ON "public"."attendees" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "attendees"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Insert my attendee meal passes" ON "public"."attendee_meal_passes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."attendees" "a"
     JOIN "public"."registrations" "r" ON (("r"."id" = "a"."registration_id")))
  WHERE (("a"."id" = "attendee_meal_passes"."attendee_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Insert my registration items" ON "public"."registration_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "registration_items"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Insert my room booking guests" ON "public"."room_booking_guests" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."room_bookings" "rb"
     JOIN "public"."registrations" "r" ON (("r"."id" = "rb"."registration_id")))
  WHERE (("rb"."id" = "room_booking_guests"."room_booking_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Insert my room bookings" ON "public"."room_bookings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "room_bookings"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Insert my room_booking_rooms" ON "public"."room_booking_rooms" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."room_bookings" "rb"
     JOIN "public"."registrations" "r" ON (("r"."id" = "rb"."registration_id")))
  WHERE (("rb"."id" = "room_booking_rooms"."room_booking_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Insert my shuttle requests" ON "public"."shuttle_requests" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "shuttle_requests"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Insert registrations as self" ON "public"."registrations" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Own profile read" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own profile update" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Public read buildings" ON "public"."campus_buildings" FOR SELECT USING (true);



CREATE POLICY "Public read departments" ON "public"."departments" FOR SELECT USING (true);



CREATE POLICY "Public read discounts" ON "public"."event_discounts" FOR SELECT USING (true);



CREATE POLICY "Public read event fees" ON "public"."event_fees" FOR SELECT USING (true);



CREATE POLICY "Public read events" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Public read lodging options" ON "public"."lodging_options" FOR SELECT USING (true);



CREATE POLICY "Public read lodging_options" ON "public"."lodging_options" FOR SELECT USING (true);



CREATE POLICY "Public read meal sessions" ON "public"."meal_sessions" FOR SELECT USING (true);



CREATE POLICY "Public read rooms" ON "public"."rooms" FOR SELECT USING (true);



CREATE POLICY "Public read schedule_sessions" ON "public"."schedule_sessions" FOR SELECT USING (true);



CREATE POLICY "Read attendees of my registrations" ON "public"."attendees" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "attendees"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Read attendees of my registrations (guests ui)" ON "public"."attendees" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "attendees"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Read my applied discounts" ON "public"."registration_applied_discounts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "registration_applied_discounts"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Read my attendee meal passes" ON "public"."attendee_meal_passes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."attendees" "a"
     JOIN "public"."registrations" "r" ON (("r"."id" = "a"."registration_id")))
  WHERE (("a"."id" = "attendee_meal_passes"."attendee_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Read my registration items" ON "public"."registration_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "registration_items"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Read my roles" ON "public"."registration_roles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "registration_roles"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Read my room booking guests" ON "public"."room_booking_guests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."room_bookings" "rb"
     JOIN "public"."registrations" "r" ON (("r"."id" = "rb"."registration_id")))
  WHERE (("rb"."id" = "room_booking_guests"."room_booking_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Read my room bookings" ON "public"."room_bookings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "room_bookings"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Read my room_booking_rooms" ON "public"."room_booking_rooms" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."room_bookings" "rb"
     JOIN "public"."registrations" "r" ON (("r"."id" = "rb"."registration_id")))
  WHERE (("rb"."id" = "room_booking_rooms"."room_booking_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Read my shuttle requests" ON "public"."shuttle_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "shuttle_requests"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Read own registrations" ON "public"."registrations" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Update attendees under my registration" ON "public"."attendees" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "attendees"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Update my attendee meal passes" ON "public"."attendee_meal_passes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."attendees" "a"
     JOIN "public"."registrations" "r" ON (("r"."id" = "a"."registration_id")))
  WHERE (("a"."id" = "attendee_meal_passes"."attendee_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Update my registration items" ON "public"."registration_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "registration_items"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Update my roles" ON "public"."registration_roles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "registration_roles"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Update my room bookings" ON "public"."room_bookings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "room_bookings"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Update my shuttle requests" ON "public"."shuttle_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "shuttle_requests"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Update own registrations" ON "public"."registrations" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Upsert my roles" ON "public"."registration_roles" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."registrations" "r"
  WHERE (("r"."id" = "registration_roles"."registration_id") AND ("r"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "admin all attendees" ON "public"."attendees" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "admin all buildings" ON "public"."campus_buildings" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "admin all checkins" ON "public"."checkins" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "admin all discounts" ON "public"."event_discounts" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "admin all meal_sessions" ON "public"."meal_sessions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "admin all room_booking_rooms" ON "public"."room_booking_rooms" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin all room_bookings" ON "public"."room_bookings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin all rooms" ON "public"."rooms" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "admin all schedule_sessions" ON "public"."schedule_sessions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "admin all shuttle_requests" ON "public"."shuttle_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



ALTER TABLE "public"."attendee_meal_passes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campus_buildings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_discounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_fees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lodging_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meal_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registration_applied_discounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registration_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registration_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."room_booking_guests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."room_booking_rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."room_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shuttle_requests" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_profile_role_guard"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_profile_role_guard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_profile_role_guard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."attendee_meal_passes" TO "anon";
GRANT ALL ON TABLE "public"."attendee_meal_passes" TO "authenticated";
GRANT ALL ON TABLE "public"."attendee_meal_passes" TO "service_role";



GRANT ALL ON TABLE "public"."attendees" TO "anon";
GRANT ALL ON TABLE "public"."attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."attendees" TO "service_role";



GRANT ALL ON TABLE "public"."campus_buildings" TO "anon";
GRANT ALL ON TABLE "public"."campus_buildings" TO "authenticated";
GRANT ALL ON TABLE "public"."campus_buildings" TO "service_role";



GRANT ALL ON TABLE "public"."checkins" TO "anon";
GRANT ALL ON TABLE "public"."checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."checkins" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."event_discounts" TO "anon";
GRANT ALL ON TABLE "public"."event_discounts" TO "authenticated";
GRANT ALL ON TABLE "public"."event_discounts" TO "service_role";



GRANT ALL ON TABLE "public"."event_fees" TO "anon";
GRANT ALL ON TABLE "public"."event_fees" TO "authenticated";
GRANT ALL ON TABLE "public"."event_fees" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."lodging_options" TO "anon";
GRANT ALL ON TABLE "public"."lodging_options" TO "authenticated";
GRANT ALL ON TABLE "public"."lodging_options" TO "service_role";



GRANT ALL ON TABLE "public"."meal_sessions" TO "anon";
GRANT ALL ON TABLE "public"."meal_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."registration_applied_discounts" TO "anon";
GRANT ALL ON TABLE "public"."registration_applied_discounts" TO "authenticated";
GRANT ALL ON TABLE "public"."registration_applied_discounts" TO "service_role";



GRANT ALL ON TABLE "public"."registration_items" TO "anon";
GRANT ALL ON TABLE "public"."registration_items" TO "authenticated";
GRANT ALL ON TABLE "public"."registration_items" TO "service_role";



GRANT ALL ON TABLE "public"."registration_roles" TO "anon";
GRANT ALL ON TABLE "public"."registration_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."registration_roles" TO "service_role";



GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";



GRANT ALL ON TABLE "public"."room_booking_guests" TO "anon";
GRANT ALL ON TABLE "public"."room_booking_guests" TO "authenticated";
GRANT ALL ON TABLE "public"."room_booking_guests" TO "service_role";



GRANT ALL ON TABLE "public"."room_booking_rooms" TO "anon";
GRANT ALL ON TABLE "public"."room_booking_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."room_booking_rooms" TO "service_role";



GRANT ALL ON TABLE "public"."room_bookings" TO "anon";
GRANT ALL ON TABLE "public"."room_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."room_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_sessions" TO "anon";
GRANT ALL ON TABLE "public"."schedule_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."shuttle_requests" TO "anon";
GRANT ALL ON TABLE "public"."shuttle_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."shuttle_requests" TO "service_role";



GRANT ALL ON TABLE "public"."vw_building_occupancy" TO "anon";
GRANT ALL ON TABLE "public"."vw_building_occupancy" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_building_occupancy" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
