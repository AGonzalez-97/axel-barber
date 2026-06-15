-- Seed Argentine national holidays for 2026 (remaining) and 2027.
-- Uses ON CONFLICT DO NOTHING so re-running is safe.
-- Leo can remove any of these from the admin UI if he chooses to work that day.
-- Variable holidays (Carnaval, Viernes Santo, trasladables) are noted as approximate.

INSERT INTO blocked_dates (tenant_id, date, reason) VALUES
  -- ── 2026 (remaining from today) ───────────────────────────────────────────
  ('00000000-0000-0000-0000-000000000001', '2026-06-20', 'Paso a la Inmortalidad del Gral. Manuel Belgrano'),
  ('00000000-0000-0000-0000-000000000001', '2026-07-09', 'Día de la Independencia'),
  ('00000000-0000-0000-0000-000000000001', '2026-08-17', 'Paso a la Inmortalidad del Gral. José de San Martín'),
  ('00000000-0000-0000-0000-000000000001', '2026-10-12', 'Día del Respeto a la Diversidad Cultural'),
  ('00000000-0000-0000-0000-000000000001', '2026-11-20', 'Día de la Soberanía Nacional'),
  ('00000000-0000-0000-0000-000000000001', '2026-12-08', 'Inmaculada Concepción de María'),
  ('00000000-0000-0000-0000-000000000001', '2026-12-25', 'Navidad'),

  -- ── 2027 ──────────────────────────────────────────────────────────────────
  ('00000000-0000-0000-0000-000000000001', '2027-01-01', 'Año Nuevo'),
  ('00000000-0000-0000-0000-000000000001', '2027-02-08', 'Carnaval'),
  ('00000000-0000-0000-0000-000000000001', '2027-02-09', 'Carnaval'),
  ('00000000-0000-0000-0000-000000000001', '2027-03-24', 'Día Nacional de la Memoria por la Verdad y la Justicia'),
  ('00000000-0000-0000-0000-000000000001', '2027-03-26', 'Viernes Santo'),
  ('00000000-0000-0000-0000-000000000001', '2027-04-02', 'Día del Veterano y de los Caídos en la Guerra de Malvinas'),
  ('00000000-0000-0000-0000-000000000001', '2027-05-01', 'Día del Trabajador'),
  ('00000000-0000-0000-0000-000000000001', '2027-05-25', 'Día de la Revolución de Mayo'),
  ('00000000-0000-0000-0000-000000000001', '2027-06-17', 'Paso a la Inmortalidad del Gral. Martín Miguel de Güemes'),
  ('00000000-0000-0000-0000-000000000001', '2027-06-20', 'Paso a la Inmortalidad del Gral. Manuel Belgrano'),
  ('00000000-0000-0000-0000-000000000001', '2027-07-09', 'Día de la Independencia'),
  ('00000000-0000-0000-0000-000000000001', '2027-08-16', 'Paso a la Inmortalidad del Gral. José de San Martín (trasladado)'),
  ('00000000-0000-0000-0000-000000000001', '2027-10-11', 'Día del Respeto a la Diversidad Cultural (trasladado)'),
  ('00000000-0000-0000-0000-000000000001', '2027-11-20', 'Día de la Soberanía Nacional'),
  ('00000000-0000-0000-0000-000000000001', '2027-12-08', 'Inmaculada Concepción de María'),
  ('00000000-0000-0000-0000-000000000001', '2027-12-25', 'Navidad')

ON CONFLICT (tenant_id, date) DO NOTHING;
