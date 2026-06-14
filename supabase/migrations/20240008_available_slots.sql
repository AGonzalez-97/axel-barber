-- Migration: get_available_slots helper function
-- Returns 30-minute time slots for a given date that are:
--   1. Within the tenant's configured working hours (default 09:00–19:00)
--   2. Not already occupied by a pending/confirmed booking
--   3. On a day the tenant is open (available_days bitmask)
--
-- STABLE: no writes, result depends only on inputs + current table data.

CREATE OR REPLACE FUNCTION get_available_slots(
  p_tenant_id  uuid,
  p_date       date
)
RETURNS TABLE(slot_time timestamptz)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_tenant         tenants%ROWTYPE;
  v_start_hour     int;
  v_end_hour       int;
  v_day_bit        int;
  v_slot_interval  interval := '30 minutes';
  v_current_slot   timestamptz;
  v_day_start      timestamptz;
  v_day_end        timestamptz;
BEGIN
  -- ── Fetch tenant ──────────────────────────────────────────────────────────
  SELECT * INTO v_tenant FROM tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant % not found', p_tenant_id;
  END IF;

  -- ── Check available_days bitmask ──────────────────────────────────────────
  -- p_date DOW: 0=Sun,1=Mon,...,6=Sat
  -- Bitmask convention (matches frontend): bit N = day N (1=Mon … 6=Sat, 0=Sun)
  -- 62 decimal = 0b0111110 = bits 1-6 set = Monday through Saturday
  v_day_bit := EXTRACT(DOW FROM p_date)::int;

  IF (v_tenant.available_days & (1 << v_day_bit)) = 0 THEN
    -- Tenant is closed on this day — return empty result set
    RETURN;
  END IF;

  -- ── Resolve working hours from tenant settings (with defaults) ────────────
  v_start_hour := COALESCE(
    (v_tenant.settings->>'start_hour')::int,
    9
  );
  v_end_hour := COALESCE(
    (v_tenant.settings->>'end_hour')::int,
    19
  );

  -- ── Generate slots ────────────────────────────────────────────────────────
  -- Build timestamps at UTC; Supabase stores timestamptz in UTC.
  -- start_hour/end_hour are assumed to be local (Argentina = UTC-3);
  -- the caller should pass them in UTC equivalent or use a timezone-aware config.
  -- For simplicity in MVP, hours are treated as-is in UTC.
  v_day_start  := (p_date::text || ' ' || v_start_hour || ':00:00')::timestamptz;
  v_day_end    := (p_date::text || ' ' || v_end_hour   || ':00:00')::timestamptz;
  v_current_slot := v_day_start;

  WHILE v_current_slot < v_day_end LOOP
    -- Check if slot is already occupied
    IF NOT EXISTS (
      SELECT 1
      FROM   bookings b
      WHERE  b.tenant_id  = p_tenant_id
        AND  b.starts_at  = v_current_slot
        AND  b.status     IN ('pending', 'confirmed')
    ) THEN
      slot_time := v_current_slot;
      RETURN NEXT;
    END IF;

    v_current_slot := v_current_slot + v_slot_interval;
  END LOOP;

  RETURN;
END;
$$;
