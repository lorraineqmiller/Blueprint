-- Friend requests didn't update live — only chats/votes/comments got added
-- to the realtime publication in 0002. Wrapped the same defensive way as
-- those (see 0002's comment on why: a missing/renamed publication or an
-- already-added table must never fail this and roll back other changes).
do $$
begin
  alter publication supabase_realtime add table friendships;
exception
  when undefined_object then
    raise notice 'supabase_realtime publication not found — enable Realtime for friendships manually (Database > Replication) if you want live updates';
  when duplicate_object then
    null;
end $$;
