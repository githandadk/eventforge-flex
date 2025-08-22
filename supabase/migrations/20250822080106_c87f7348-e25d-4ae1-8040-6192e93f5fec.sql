-- 1) Add missing pricing fields to event_settings
ALTER TABLE public.event_settings
  ADD COLUMN IF NOT EXISTS registration_base_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shuttle_fee numeric NOT NULL DEFAULT 0;

-- 2) Create event_meal_prices table to store per-event meal pricing (breakfast, lunch, dinner, daily)
CREATE TABLE IF NOT EXISTS public.event_meal_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  meal_type text NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_meal_prices ENABLE ROW LEVEL SECURITY;

-- Policies: public read; admin full access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_meal_prices' AND policyname = 'Public read event_meal_prices'
  ) THEN
    CREATE POLICY "Public read event_meal_prices"
    ON public.event_meal_prices
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_meal_prices' AND policyname = 'admin all event_meal_prices'
  ) THEN
    CREATE POLICY "admin all event_meal_prices"
    ON public.event_meal_prices
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

-- 3) Create a consolidated admin view of event fees
CREATE OR REPLACE VIEW public.vw_event_fees_admin AS
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

-- 4) Seed data for "East Coast Korean Camp Meeting 2026" if the event exists
DO $$
DECLARE
  e_id uuid;
BEGIN
  SELECT id INTO e_id FROM public.events WHERE name = 'East Coast Korean Camp Meeting 2026' LIMIT 1;

  IF e_id IS NULL THEN
    RAISE NOTICE 'Event "East Coast Korean Camp Meeting 2026" not found. Skipping seed.';
  ELSE
    -- Upsert event_settings with provided fees
    INSERT INTO public.event_settings (event_id, default_meals_per_day, room_key_deposit, currency, registration_base_fee, shuttle_fee)
    VALUES (e_id, 3, 50, 'USD', 60, 25)
    ON CONFLICT (event_id)
    DO UPDATE SET
      room_key_deposit = EXCLUDED.room_key_deposit,
      registration_base_fee = EXCLUDED.registration_base_fee,
      shuttle_fee = EXCLUDED.shuttle_fee,
      default_meals_per_day = EXCLUDED.default_meals_per_day,
      currency = EXCLUDED.currency;

    -- Insert lodging options if not already there
    INSERT INTO public.lodging_options (event_id, name, nightly_rate, ac)
    SELECT e_id, 'AC Room', 90, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.lodging_options WHERE event_id = e_id AND name = 'AC Room'
    );

    INSERT INTO public.lodging_options (event_id, name, nightly_rate, ac)
    SELECT e_id, 'Non-AC Room', 60, false
    WHERE NOT EXISTS (
      SELECT 1 FROM public.lodging_options WHERE event_id = e_id AND name = 'Non-AC Room'
    );

    -- Insert meal prices
    INSERT INTO public.event_meal_prices (event_id, meal_type, price)
    SELECT e_id, 'breakfast', 15
    WHERE NOT EXISTS (
      SELECT 1 FROM public.event_meal_prices WHERE event_id = e_id AND meal_type = 'breakfast'
    );

    INSERT INTO public.event_meal_prices (event_id, meal_type, price)
    SELECT e_id, 'lunch', 25
    WHERE NOT EXISTS (
      SELECT 1 FROM public.event_meal_prices WHERE event_id = e_id AND meal_type = 'lunch'
    );

    INSERT INTO public.event_meal_prices (event_id, meal_type, price)
    SELECT e_id, 'dinner', 30
    WHERE NOT EXISTS (
      SELECT 1 FROM public.event_meal_prices WHERE event_id = e_id AND meal_type = 'dinner'
    );

    INSERT INTO public.event_meal_prices (event_id, meal_type, price)
    SELECT e_id, 'daily', 65
    WHERE NOT EXISTS (
      SELECT 1 FROM public.event_meal_prices WHERE event_id = e_id AND meal_type = 'daily'
    );

    -- Department surcharge EM_VBS = 30
    INSERT INTO public.event_department_surcharges (event_id, department_code, surcharge)
    SELECT e_id, 'EM_VBS', 30
    WHERE NOT EXISTS (
      SELECT 1 FROM public.event_department_surcharges WHERE event_id = e_id AND department_code = 'EM_VBS'
    );
  END IF;
END $$;