-- Adds a self-reported building/floor to profiles, replacing the placeholder
-- "On campus" distance label with a real (if coarse) proximity signal:
-- same floor > same building > different building. No GPS — this is
-- exactly as precise as the PRD's own flavor text ("6 min · 113th") was
-- always meant to be, just driven by real data instead of hardcoded.
alter table profiles add column building text not null default '';
alter table profiles add column floor text not null default '';
