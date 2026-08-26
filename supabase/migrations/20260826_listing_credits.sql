-- Credits live on each listing. A new page cannot spend another listing's balance.
-- Allow credit_balance updates; listing copy stays locked after publish.

create or replace function private.prevent_business_update()
returns trigger
language plpgsql
as $function$
begin
  if old.owner_id is null then
    return new;
  end if;

  if
    new.name is not distinct from old.name
    and new.slug is not distinct from old.slug
    and new.website_url is not distinct from old.website_url
    and new.tagline is not distinct from old.tagline
    and new.description is not distinct from old.description
    and new.extra_details is not distinct from old.extra_details
    and new.scraped_content is not distinct from old.scraped_content
    and new.category is not distinct from old.category
    and new.tags is not distinct from old.tags
    and new.target_audience is not distinct from old.target_audience
    and new.offer_summary is not distinct from old.offer_summary
    and new.logo_url is not distinct from old.logo_url
    and new.subscription_status is not distinct from old.subscription_status
    and new.is_featured is not distinct from old.is_featured
    and new.is_fictional is not distinct from old.is_fictional
    and new.cta_type is not distinct from old.cta_type
    and new.cta_url is not distinct from old.cta_url
    and new.cta_label is not distinct from old.cta_label
    and new.pricing_plans is not distinct from old.pricing_plans
    and new.owner_id is not distinct from old.owner_id
  then
    return new;
  end if;

  raise exception 'Listings cannot be edited after publishing';
end;
$function$;

alter table public.businesses
  add column if not exists credit_balance numeric(12, 2) not null default 0;

alter table public.profiles
  add column if not exists prepaid_listing_credits numeric(12, 2) not null default 0;

-- Existing shared wallet goes to the owner's first listing.
with ranked as (
  select
    b.id,
    p.credit_balance,
    row_number() over (partition by b.owner_id order by b.created_at asc) as rn
  from public.businesses b
  join public.profiles p on p.id = b.owner_id
)
update public.businesses b
set credit_balance = ranked.credit_balance
from ranked
where b.id = ranked.id
  and ranked.rn = 1
  and ranked.credit_balance > 0;

-- Paid but unpublished: keep the leftover as prepaid for onboard.
update public.profiles p
set prepaid_listing_credits = p.credit_balance
where p.credit_balance > 0
  and not exists (
    select 1 from public.businesses b where b.owner_id = p.id
  );

update public.profiles
set credit_balance = 0
where credit_balance <> 0;

create or replace function private.hybrid_search_listings(
  query_embedding vector,
  query_text text,
  filter_category text default null,
  match_count integer default 30
)
returns table (
  business_id uuid,
  similarity double precision,
  fts_rank double precision,
  hybrid_score double precision,
  credit_balance numeric,
  click_count bigint,
  impression_count bigint
)
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $function$
  with params as (
    select
      least(greatest(coalesce(match_count, 30), 1), 50) as take,
      nullif(lower(trim(coalesce(filter_category, ''))), '') as cat,
      websearch_to_tsquery(
        'english',
        coalesce(nullif(trim(query_text), ''), 'software')
      ) as tsq
  ),
  pool as (
    select
      e.business_id,
      (1 - (e.embedding <=> query_embedding))::double precision as similarity,
      ts_rank_cd(e.search_tsv, params.tsq)::double precision as fts_rank,
      (e.search_tsv @@ params.tsq) as lexical_hit,
      case
        when params.cat is not null
          and lower(coalesce(b.category, '')) = params.cat then 1
        else 0
      end as category_boost
    from public.listing_embeddings e
    cross join params
    join public.businesses b on b.id = e.business_id
    where b.subscription_status = 'active'
  ),
  semantic as (
    select
      pool.business_id,
      pool.similarity,
      pool.fts_rank,
      pool.category_boost,
      row_number() over (order by pool.similarity desc) as rank
    from pool
    order by pool.similarity desc
    limit 50
  ),
  lexical as (
    select
      pool.business_id,
      pool.similarity,
      pool.fts_rank,
      pool.category_boost,
      row_number() over (order by pool.fts_rank desc) as rank
    from pool
    where pool.lexical_hit
    order by pool.fts_rank desc
    limit 50
  ),
  fused as (
    select
      coalesce(semantic.business_id, lexical.business_id) as business_id,
      coalesce(semantic.similarity, lexical.similarity) as similarity,
      coalesce(lexical.fts_rank, 0::double precision) as fts_rank,
      (
        coalesce(1.0 / (60 + semantic.rank), 0) +
        coalesce(1.0 / (60 + lexical.rank), 0) +
        (0.08 * coalesce(semantic.category_boost, lexical.category_boost, 0))
      )::double precision as hybrid_score
    from semantic
    full outer join lexical on semantic.business_id = lexical.business_id
    order by hybrid_score desc, similarity desc
    limit (select take from params)
  )
  select
    fused.business_id,
    fused.similarity,
    fused.fts_rank,
    fused.hybrid_score,
    coalesce(b.credit_balance, 0)::numeric as credit_balance,
    coalesce(clicks.n, 0)::bigint as click_count,
    coalesce(impressions.n, 0)::bigint as impression_count
  from fused
  join public.businesses b on b.id = fused.business_id
  left join lateral (
    select count(*)::bigint as n
    from public.listing_clicks c
    where c.business_id = fused.business_id
  ) clicks on true
  left join lateral (
    select count(*)::bigint as n
    from public.search_sessions s
    where s.matched_business_id = fused.business_id
      and s.status = 'completed'
  ) impressions on true;
$function$;

create or replace function private.record_listing_click(
  p_business_id uuid,
  p_destination text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  listing public.businesses%rowtype;
  dest text;
  charge numeric(12,2) := 0;
  click_cost numeric(12,2) := 0.50;
  visitor uuid := auth.uid();
  visitor_mail text;
begin
  select * into listing
  from public.businesses
  where id = p_business_id
    and subscription_status = 'active';

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Listing not found');
  end if;

  dest := nullif(trim(coalesce(p_destination, '')), '');
  if dest is null then
    dest := coalesce(nullif(trim(listing.cta_url), ''), nullif(trim(listing.website_url), ''));
  end if;

  if dest is null then
    return jsonb_build_object('ok', false, 'error', 'No destination');
  end if;

  if visitor is not null then
    select email into visitor_mail
    from auth.users
    where id = visitor;
  end if;

  update public.businesses
  set credit_balance = credit_balance - click_cost
  where id = p_business_id
    and credit_balance >= click_cost;

  if found then
    charge := click_cost;
  end if;

  insert into public.listing_clicks (
    business_id,
    destination_url,
    charged_usd,
    visitor_id,
    visitor_email
  )
  values (p_business_id, dest, charge, visitor, visitor_mail);

  return jsonb_build_object('ok', true, 'url', dest, 'charged', charge);
end;
$function$;
