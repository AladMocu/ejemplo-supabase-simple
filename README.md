# POSTGRES

```sql
create table if not exists public.items (
  id bigserial primary key,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.items disable row level security;
```