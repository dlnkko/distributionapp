-- Remote-applied via Supabase. Enables pgvector hybrid retrieval
-- without altering public.businesses.

create extension if not exists vector with schema extensions;

create table if not exists public.listing_embeddings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  embedding extensions.vector(1024) not null,
  document_text text not null,
  search_tsv tsvector generated always as (to_tsvector('english', coalesce(document_text, ''))) stored,
  category text,
  model text not null default 'voyage-4-large',
  updated_at timestamptz not null default now()
);

create index if not exists listing_embeddings_embedding_hnsw
  on public.listing_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);

create index if not exists listing_embeddings_search_tsv_gin
  on public.listing_embeddings
  using gin (search_tsv);
