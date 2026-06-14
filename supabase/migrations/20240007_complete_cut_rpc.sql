-- Migration: complete_cut RPC
-- Transactional function that finalises a confirmed booking, records the cut,
-- applies loyalty discounts, and updates the ledger atomically.
--
-- Called by the server (service role key) from the admin "Complete" action.
-- SECURITY DEFINER so it can write to all tables regardless of caller role.

CREATE OR REPLACE FUNCTION complete_cut(
  p_booking_id  uuid,
  p_tenant_id   uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking         bookings%ROWTYPE;
  v_service         services%ROWTYPE;
  v_loyalty         loyalty_config%ROWTYPE;
  v_last_reset_id   uuid;
  v_cycle_count     int;
  v_price_charged   numeric;
  v_is_free         boolean := false;
  v_has_discount    boolean := false;
  v_cut_id          uuid;
  v_new_cycle_count int;
BEGIN
  -- ── Step 1: Lock the booking row ─────────────────────────────────────────
  SELECT *
  INTO   v_booking
  FROM   bookings
  WHERE  id        = p_booking_id
    AND  tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking % not found for tenant %', p_booking_id, p_tenant_id;
  END IF;

  -- ── Step 2: Validate status ───────────────────────────────────────────────
  IF v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Booking % has status %, expected confirmed',
      p_booking_id, v_booking.status;
  END IF;

  -- ── Step 3: Fetch service and loyalty config ──────────────────────────────
  SELECT * INTO v_service
  FROM   services
  WHERE  id = v_booking.service_id;

  SELECT * INTO v_loyalty
  FROM   loyalty_config
  WHERE  tenant_id = p_tenant_id;

  -- If no loyalty config exists, fall back to safe defaults
  IF NOT FOUND THEN
    v_loyalty.discount_at     := 3;
    v_loyalty.free_at         := 6;
    v_loyalty.discount_pct    := 15;
    v_loyalty.reset_on_redeem := true;
  END IF;

  -- ── Step 4: Determine current cycle count ────────────────────────────────
  -- Find the most recent cycle_reset event for this client/tenant (if any)
  SELECT id
  INTO   v_last_reset_id
  FROM   loyalty_ledger
  WHERE  tenant_id  = p_tenant_id
    AND  client_id  = v_booking.client_id
    AND  event      = 'cycle_reset'
  ORDER BY created_at DESC
  LIMIT  1;

  -- Count cut_completed events since the last reset
  IF v_last_reset_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO   v_cycle_count
    FROM   loyalty_ledger
    WHERE  tenant_id  = p_tenant_id
      AND  client_id  = v_booking.client_id
      AND  event      = 'cut_completed'
      AND  id > v_last_reset_id;   -- uuid comparison works because UUIDs are
                                    -- monotonic via gen_random_uuid only when
                                    -- using uuid v7; use created_at instead
  ELSE
    -- No reset ever — count all cut_completed events
    SELECT COUNT(*)
    INTO   v_cycle_count
    FROM   loyalty_ledger
    WHERE  tenant_id = p_tenant_id
      AND  client_id = v_booking.client_id
      AND  event     = 'cut_completed';
  END IF;

  -- ── Step 4b: Re-derive using created_at to avoid uuid ordering assumption ─
  -- Overwrite cycle_count with a safer time-based query
  IF v_last_reset_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO   v_cycle_count
    FROM   loyalty_ledger ll
    WHERE  ll.tenant_id = p_tenant_id
      AND  ll.client_id = v_booking.client_id
      AND  ll.event     = 'cut_completed'
      AND  ll.created_at > (
        SELECT created_at FROM loyalty_ledger WHERE id = v_last_reset_id
      );
  END IF;

  v_new_cycle_count := v_cycle_count + 1;

  -- ── Step 5: Determine price and discount ─────────────────────────────────
  v_price_charged := v_service.price_ars;

  IF v_new_cycle_count = v_loyalty.free_at THEN
    v_price_charged := 0;
    v_is_free       := true;
  ELSIF v_new_cycle_count = v_loyalty.discount_at THEN
    v_price_charged := v_service.price_ars * (1 - v_loyalty.discount_pct / 100.0);
    v_has_discount  := true;
  END IF;

  -- ── Step 6: Insert cut record ─────────────────────────────────────────────
  INSERT INTO cuts (
    tenant_id,
    booking_id,
    client_id,
    service_id,
    price_charged,
    loyalty_discount_applied
  )
  VALUES (
    p_tenant_id,
    p_booking_id,
    v_booking.client_id,
    v_booking.service_id,
    v_price_charged,
    v_has_discount OR v_is_free
  )
  RETURNING id INTO v_cut_id;

  -- ── Step 7: Append cut_completed to loyalty ledger ────────────────────────
  INSERT INTO loyalty_ledger (tenant_id, client_id, event, counter_value)
  VALUES (p_tenant_id, v_booking.client_id, 'cut_completed', v_new_cycle_count);

  -- ── Step 8: If free cut, reset the cycle ─────────────────────────────────
  IF v_is_free AND v_loyalty.reset_on_redeem THEN
    INSERT INTO loyalty_ledger (tenant_id, client_id, event, counter_value)
    VALUES (p_tenant_id, v_booking.client_id, 'cycle_reset', 0);
  END IF;

  -- ── Step 9: Mark booking completed ───────────────────────────────────────
  UPDATE bookings
  SET    status = 'completed'
  WHERE  id = p_booking_id;

  -- ── Step 10: Return result payload ───────────────────────────────────────
  RETURN jsonb_build_object(
    'cut_id',          v_cut_id,
    'price_charged',   v_price_charged,
    'is_free',         v_is_free,
    'has_discount',    v_has_discount,
    'new_cycle_count', v_new_cycle_count
  );
END;
$$;

-- Grant execute to anon (function is called via service key in practice,
-- but the grant is defined here for completeness and local testing)
GRANT EXECUTE ON FUNCTION complete_cut(uuid, uuid) TO anon;
