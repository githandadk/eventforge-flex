-- Fix security issues

-- 1. Drop and recreate view without SECURITY DEFINER (it's not needed for this use case)
DROP VIEW IF EXISTS public.vw_event_fees_admin;

CREATE VIEW public.vw_event_fees_admin AS
  -- Lodging options (per night)
  SELECT
    lo.event_id,
    'lodging'::text AS category,
    CASE WHEN lo.ac THEN 'AC' ELSE 'NON_AC' END AS code,
    lo.name AS label,
    'night'::text AS unit,
    lo.nightly_rate::numeric AS amount
  FROM public.lodging_options lo

  UNION ALL

  -- Meal prices (per meal/day)
  SELECT
    emp.event_id,
    'meal'::text AS category,
    UPPER(emp.meal_type) AS code,
    INITCAP(emp.meal_type) AS label,
    CASE WHEN emp.meal_type = 'daily' THEN 'day' ELSE 'meal' END::text AS unit,
    emp.price::numeric AS amount
  FROM public.event_meal_prices emp

  UNION ALL

  -- Registration base fee (per registration)
  SELECT
    es.event_id,
    'registration'::text AS category,
    'BASE'::text AS code,
    'Registration base fee'::text AS label,
    'registration'::text AS unit,
    es.registration_base_fee::numeric AS amount
  FROM public.event_settings es

  UNION ALL

  -- Shuttle default fee (per trip)
  SELECT
    es.event_id,
    'shuttle'::text AS category,
    'DEFAULT'::text AS code,
    'Airport shuttle fee'::text AS label,
    'trip'::text AS unit,
    es.shuttle_fee::numeric AS amount
  FROM public.event_settings es

  UNION ALL

  -- Key deposit (per key)
  SELECT
    es.event_id,
    'deposit'::text AS category,
    'KEY'::text AS code,
    'Key deposit per key'::text AS label,
    'key'::text AS unit,
    es.room_key_deposit::numeric AS amount
  FROM public.event_settings es

  UNION ALL

  -- Department surcharges (per registration)
  SELECT
    eds.event_id,
    'department_surcharge'::text AS category,
    eds.department_code AS code,
    ('Department surcharge (' || eds.department_code || ')')::text AS label,
    'registration'::text AS unit,
    eds.surcharge::numeric AS amount
  FROM public.event_department_surcharges eds;

-- 2. Fix the functions by setting search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 3. Add RLS policies for the checkins and schedule_sessions tables since they have RLS enabled but no policies
-- (Note: Only adding if policies don't exist and only for the tables we just added RLS to)

-- Checkins policies (admin access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'checkins' AND policyname = 'admin all checkins'
  ) THEN
    CREATE POLICY "admin all checkins"
    ON public.checkins
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role IN ('admin','staff')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role IN ('admin','staff')
      )
    );
  END IF;
END $$;

-- Schedule sessions policies (public read, admin write)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schedule_sessions' AND policyname = 'Public read schedule_sessions'
  ) THEN
    CREATE POLICY "Public read schedule_sessions"
    ON public.schedule_sessions
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schedule_sessions' AND policyname = 'admin all schedule_sessions'
  ) THEN
    CREATE POLICY "admin all schedule_sessions"
    ON public.schedule_sessions
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role IN ('admin','staff')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role IN ('admin','staff')
      )
    );
  END IF;
END $$;

-- Shuttle requests policies (user can CRUD their own, admin can see all)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shuttle_requests' AND policyname = 'Read my shuttle requests'
  ) THEN
    CREATE POLICY "Read my shuttle requests"
    ON public.shuttle_requests
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM registrations r
        WHERE r.id = shuttle_requests.registration_id AND r.created_by = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shuttle_requests' AND policyname = 'Insert my shuttle requests'
  ) THEN
    CREATE POLICY "Insert my shuttle requests"
    ON public.shuttle_requests
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM registrations r
        WHERE r.id = shuttle_requests.registration_id AND r.created_by = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shuttle_requests' AND policyname = 'Update my shuttle requests'
  ) THEN
    CREATE POLICY "Update my shuttle requests"
    ON public.shuttle_requests
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM registrations r
        WHERE r.id = shuttle_requests.registration_id AND r.created_by = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shuttle_requests' AND policyname = 'admin all shuttle_requests'
  ) THEN
    CREATE POLICY "admin all shuttle_requests"
    ON public.shuttle_requests
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role IN ('admin','staff')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role IN ('admin','staff')
      )
    );
  END IF;
END $$;