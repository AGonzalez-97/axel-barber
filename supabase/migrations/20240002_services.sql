-- Migration: services table
-- Catalog of services offered by a tenant (e.g. Corte, Barba).

CREATE TABLE IF NOT EXISTS services (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  price_ars        numeric     NOT NULL,
  duration_minutes int         NOT NULL DEFAULT 30,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for tenant-scoped lookups
CREATE INDEX IF NOT EXISTS services_tenant_id_idx ON services(tenant_id);

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Anon: read-only access to active services for any tenant
CREATE POLICY "services: anon read active"
  ON services
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Service role: full access (bypasses RLS in Supabase by default, policy is
-- belt-and-suspenders)
CREATE POLICY "services: service role full access"
  ON services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed: default service for the seed tenant
INSERT INTO services (tenant_id, name, price_ars, duration_minutes, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Corte',
  9000,
  30,
  true
)
ON CONFLICT DO NOTHING;
