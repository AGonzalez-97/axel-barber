-- Migration: cuts, loyalty_config, loyalty_ledger
-- Tracks completed haircuts and drives the loyalty/reward cycle.

-- ─── cuts ───────────────────────────────────────────────────────────────────
-- Immutable record of a completed service. price_charged is locked at insert
-- time and must never be updated (financial audit trail).

CREATE TABLE IF NOT EXISTS cuts (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id               uuid        NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  client_id                uuid        NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  service_id               uuid        NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  price_charged            numeric     NOT NULL,
  loyalty_discount_applied boolean     NOT NULL DEFAULT false,
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cuts_tenant_id_idx  ON cuts(tenant_id);
CREATE INDEX IF NOT EXISTS cuts_client_id_idx  ON cuts(client_id);

ALTER TABLE cuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cuts: deny anon"
  ON cuts
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "cuts: service role full access"
  ON cuts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── loyalty_config ──────────────────────────────────────────────────────────
-- One row per tenant that defines the reward thresholds.

CREATE TABLE IF NOT EXISTS loyalty_config (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  discount_at     int         NOT NULL DEFAULT 3,
  free_at         int         NOT NULL DEFAULT 6,
  discount_pct    numeric     NOT NULL DEFAULT 15,
  reset_on_redeem boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE loyalty_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_config: deny anon"
  ON loyalty_config
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "loyalty_config: service role full access"
  ON loyalty_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed: default loyalty config for seed tenant
INSERT INTO loyalty_config (tenant_id, discount_at, free_at, discount_pct, reset_on_redeem)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  3,
  6,
  15,
  true
)
ON CONFLICT (tenant_id) DO NOTHING;

-- ─── loyalty_ledger ──────────────────────────────────────────────────────────
-- Append-only event log for a client's loyalty counter within a tenant.
-- counter_value is the value AFTER the event — never mutated after insert.

CREATE TABLE IF NOT EXISTS loyalty_ledger (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id      uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event          text        NOT NULL
                 CHECK (event IN ('cut_completed', 'manual_adjustment', 'cycle_reset')),
  counter_value  int         NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loyalty_ledger_tenant_client_idx
  ON loyalty_ledger(tenant_id, client_id);

ALTER TABLE loyalty_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_ledger: deny anon"
  ON loyalty_ledger
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "loyalty_ledger: service role full access"
  ON loyalty_ledger
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
