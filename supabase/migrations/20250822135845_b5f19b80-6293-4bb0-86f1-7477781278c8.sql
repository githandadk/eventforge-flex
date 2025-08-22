-- Phase 1: Critical security fixes
-- 1) Admin detection helper (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id
      AND p.role IN ('admin','staff')
  );
$$;

-- 2) Prevent non-admins from changing the role column on profiles
CREATE OR REPLACE FUNCTION public.enforce_profile_role_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Force role to attendee for non-admin inserts
    IF NOT public.is_admin(COALESCE(auth.uid(), NEW.user_id)) THEN
      NEW.role := 'attendee';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Block role changes by non-admins
    IF NOT public.is_admin(COALESCE(auth.uid(), NEW.user_id)) AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Insufficient privileges to change role';
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_profiles_role_guard ON public.profiles;
CREATE TRIGGER trg_profiles_role_guard
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_role_guard();

-- 3) Room booking data protection
-- room_bookings: remove public read and overly broad insert; add admin-all
DROP POLICY IF EXISTS "Public read room_bookings" ON public.room_bookings;
DROP POLICY IF EXISTS "Allow authenticated users to create room bookings" ON public.room_bookings;

DROP POLICY IF EXISTS "admin all room_bookings" ON public.room_bookings;
CREATE POLICY "admin all room_bookings"
ON public.room_bookings
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- room_booking_rooms: remove public read and permissive insert; add strict owner and admin policies
DROP POLICY IF EXISTS "Public read room_booking_rooms" ON public.room_booking_rooms;
DROP POLICY IF EXISTS "Allow authenticated users to assign rooms" ON public.room_booking_rooms;

DROP POLICY IF EXISTS "Read my room_booking_rooms" ON public.room_booking_rooms;
CREATE POLICY "Read my room_booking_rooms"
ON public.room_booking_rooms
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.room_bookings rb
  JOIN public.registrations r ON r.id = rb.registration_id
  WHERE rb.id = room_booking_rooms.room_booking_id
    AND r.created_by = auth.uid()
));

DROP POLICY IF EXISTS "Insert my room_booking_rooms" ON public.room_booking_rooms;
CREATE POLICY "Insert my room_booking_rooms"
ON public.room_booking_rooms
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1
  FROM public.room_bookings rb
  JOIN public.registrations r ON r.id = rb.registration_id
  WHERE rb.id = room_booking_rooms.room_booking_id
    AND r.created_by = auth.uid()
));

DROP POLICY IF EXISTS "admin all room_booking_rooms" ON public.room_booking_rooms;
CREATE POLICY "admin all room_booking_rooms"
ON public.room_booking_rooms
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());