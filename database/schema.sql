create table if not exists public.quiz_submissions (
	id uuid primary key,
	answer_1 text not null check (answer_1 in ('thrill', 'games', 'food', 'content')),
	answer_2 text not null check (answer_2 in ('thrill', 'games', 'food', 'content')),
	answer_3 text not null check (answer_3 in ('thrill', 'games', 'food', 'content')),
	answer_4 text not null check (answer_4 in ('thrill', 'games', 'food', 'content')),
	answer_5 text not null check (answer_5 in ('thrill', 'games', 'food', 'content')),
	locale text not null check (locale in ('en', 'zh-Hant', 'zh-Hans')),
	persona text not null check (persona in ('thrill', 'games', 'food', 'content')),
	created_at timestamptz not null default now()
);

alter table public.quiz_submissions enable row level security;

revoke all on table public.quiz_submissions from anon, authenticated;
grant usage on schema public to service_role;
grant insert on table public.quiz_submissions to service_role;

create index if not exists quiz_submissions_created_at_idx
	on public.quiz_submissions (created_at desc);
create index if not exists quiz_submissions_persona_idx
	on public.quiz_submissions (persona);
