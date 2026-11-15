-- Review and run in Supabase SQL editor AFTER backing up the bookings table.
-- Protects all clients, including the tourist app which inserts directly into Supabase.
-- Policy: PENDING/APPROVED/CONFIRMED hold a slot. CANCELLED/REJECTED/COMPLETED do not.
CREATE OR REPLACE FUNCTION public.guidelanka_booking_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  requested_slot text;
BEGIN
  IF NEW.status NOT IN ('PENDING', 'APPROVED', 'CONFIRMED') THEN
    RETURN NEW;
  END IF;
  IF NEW.booking_date IS NULL OR NEW.booking_date < (now() AT TIME ZONE 'Asia/Colombo')::date THEN
    RAISE EXCEPTION 'Safari bookings cannot use past dates' USING ERRCODE = '23514';
  END IF;
  requested_slot := lower(trim(split_part(coalesce(NEW.time_slot, ''), '|', 1)));
  IF requested_slot NOT IN ('morning', 'evening', 'full') THEN
    RAISE EXCEPTION 'Invalid safari time slot' USING ERRCODE = '23514';
  END IF;
  -- Advisory locks serialize competing reservations for the same driver/date and tourist/date.
  -- Acquire locks in a fixed order to avoid deadlocks.
  PERFORM pg_advisory_xact_lock(hashtext('driver:' || coalesce(NEW.driver_id::text, '')), hashtext(NEW.booking_date::text));
  PERFORM pg_advisory_xact_lock(hashtext('tourist:' || NEW.tourist_id::text), hashtext(NEW.booking_date::text));

  IF NEW.driver_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.driver_id = NEW.driver_id AND b.booking_date = NEW.booking_date
      AND b.id IS DISTINCT FROM NEW.id
      AND b.status IN ('PENDING','APPROVED','CONFIRMED')
      AND (requested_slot = 'full'
           OR lower(trim(split_part(coalesce(b.time_slot,''),'|',1))) IN ('full', requested_slot))
  ) THEN
    RAISE EXCEPTION 'This driver is reserved for the requested date and slot' USING ERRCODE = '23505';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.tourist_id = NEW.tourist_id AND b.booking_date = NEW.booking_date
      AND b.id IS DISTINCT FROM NEW.id
      AND b.status IN ('PENDING','APPROVED','CONFIRMED')
      AND (requested_slot = 'full'
           OR lower(trim(split_part(coalesce(b.time_slot,''),'|',1))) IN ('full', requested_slot))
  ) THEN
    RAISE EXCEPTION 'Tourist already has an overlapping reservation' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guidelanka_booking_guard_trigger ON public.bookings;
CREATE TRIGGER guidelanka_booking_guard_trigger
BEFORE INSERT OR UPDATE OF booking_date, time_slot, driver_id, tourist_id, status
ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.guidelanka_booking_guard();
