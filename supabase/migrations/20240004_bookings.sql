-- Migration: bookings table
-- Records every appointment request/slot between a client and a tenant.

CREATE TABLE IF NOT EXISTS bookings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id   uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id  uuid        NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL,
  status      text        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bookings_ends_after_starts CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS bookings_tenant_id_idx    ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS bookings_client_id_idx    ON bookings(client_id);
CREATE INDEX IF NOT EXISTS bookings_starts_at_idx    ON bookings(tenant_id, starts_at);

-- Partial unique index: max 1 active booking per client per tenant
-- Prevents a client from double-booking while one is still pending/confirmed
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_booking_per_client
  ON bookings(tenant_id, client_id)
  WHERE status IN ('pending', 'confirmed');

-- Partial unique index: max 1 booking per time slot per tenant
-- Prevents two clients from booking the same slot
CREATE UNIQUE INDEX IF NOT EXISTS uniq_slot_per_tenant
  ON bookings(tenant_id, starts_at)
  WHERE status IN ('pending', 'confirmed');

-- RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Anon: may INSERT a new booking (public booking flow)
CREATE POLICY "bookings: anon insert"
  ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anon: no read/update/delete
CREATE POLICY "bookings: deny anon read"
  ON bookings
  FOR SELECT
  TO anon
  USING (false);

-- Service role: full access
CREATE POLICY "bookings: service role full access"
  ON bookings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
