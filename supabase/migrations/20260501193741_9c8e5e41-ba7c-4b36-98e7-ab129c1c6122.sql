
revoke execute on function public.issue_otp(otp_purpose, uuid) from public, anon;
revoke execute on function public.verify_otp(uuid, text) from public, anon;
revoke execute on function public.submit_transfer(uuid, txn_kind, bigint, uuid, uuid, text) from public, anon;
revoke execute on function public.confirm_transfer_otp(uuid, uuid, text) from public, anon;
revoke execute on function public.approve_transfer(uuid) from public, anon;
revoke execute on function public.reject_transfer(uuid, text) from public, anon;
revoke execute on function public.has_role(uuid, app_role) from public, anon;

grant execute on function public.issue_otp(otp_purpose, uuid) to authenticated;
grant execute on function public.verify_otp(uuid, text) to authenticated;
grant execute on function public.submit_transfer(uuid, txn_kind, bigint, uuid, uuid, text) to authenticated;
grant execute on function public.confirm_transfer_otp(uuid, uuid, text) to authenticated;
grant execute on function public.approve_transfer(uuid) to authenticated;
grant execute on function public.reject_transfer(uuid, text) to authenticated;
grant execute on function public.has_role(uuid, app_role) to authenticated;
