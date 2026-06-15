-- Security fix: complete_cut is SECURITY DEFINER and must not be callable by anon.
-- Previously GRANT TO anon allowed any unauthenticated caller to mark bookings
-- as completed and manipulate loyalty records directly via PostgREST /rpc/complete_cut.
REVOKE EXECUTE ON FUNCTION complete_cut(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION complete_cut(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION complete_cut(uuid, uuid) TO service_role;
