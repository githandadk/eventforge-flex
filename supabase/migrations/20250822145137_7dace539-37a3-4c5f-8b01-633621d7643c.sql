-- Consolidation migration: drop fee-related tables and add flags to events

-- 1) Drop dependent view first to avoid dependency errors
DROP VIEW IF EXISTS public.vw_event_fees_admin;

-- 2) Drop tables that are being consolidated
DROP TABLE IF EXISTS public.event_meal_prices;
DROP TABLE IF EXISTS public.event_department_surcharges;
DROP TABLE IF EXISTS public.event_settings;

-- 3) Add consolidated columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS lodging_option boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS meal_option boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shuttle_option boolean NOT NULL DEFAULT false;