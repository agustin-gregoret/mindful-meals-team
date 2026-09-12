REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.is_my_patient(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_my_patient(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.my_nutritionist_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_nutritionist_id() TO authenticated;

REVOKE ALL ON FUNCTION public.generate_invite_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.grant_self_role(public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.link_to_nutritionist(text) FROM PUBLIC, anon;