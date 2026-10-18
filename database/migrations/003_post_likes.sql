
-- WS OS V2
-- Migração 003: Sistema de curtidas anônimas
-- Dependência: 002_posts.sql
-- Destino: Supabase PostgreSQL

-- 1. Tabela de curtidas

CREATE TABLE IF NOT EXISTS public.post_likes (
    id bigint GENERATED ALWAYS AS IDENTITY
        CONSTRAINT post_likes_pkey PRIMARY KEY,

    post_id text NOT NULL
        CONSTRAINT post_likes_post_id_fkey
        REFERENCES public.posts(id)
        ON DELETE CASCADE,

    visitor_hash text NOT NULL
        CONSTRAINT post_likes_visitor_hash_format
        CHECK (visitor_hash ~ '^[a-f0-9]{64}$'),

    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT post_likes_unique_visitor
        UNIQUE (post_id, visitor_hash)
);

-- 2. Segurança da tabela

ALTER TABLE public.post_likes
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.post_likes
NO FORCE ROW LEVEL SECURITY;

-- Sem políticas públicas de acesso direto.
-- Toda consulta individual e inserção ocorre no Worker.

REVOKE ALL ON TABLE public.post_likes
FROM PUBLIC, anon, authenticated;

GRANT ALL PRIVILEGES
ON TABLE public.post_likes
TO service_role;

-- 3. Função de contagem pública

CREATE OR REPLACE FUNCTION public.get_post_likes_count(
    target_post_id text
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COUNT(*)
    FROM public.post_likes AS likes
    JOIN public.posts AS posts
        ON posts.id = likes.post_id
    WHERE likes.post_id = target_post_id
      AND posts.status = 'published'
      AND posts.published_at <= NOW();
$$;

-- Preserva o proprietário utilizado no Supabase atual.
ALTER FUNCTION public.get_post_likes_count(text)
OWNER TO postgres;

-- Evita permissões implícitas de execução.
REVOKE ALL ON FUNCTION public.get_post_likes_count(text)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_post_likes_count(text)
TO anon, authenticated, service_role;

-- 4. Função de proteção das curtidas

CREATE OR REPLACE FUNCTION public.validate_post_like()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    PERFORM 1
    FROM public.posts
    WHERE id = NEW.post_id
      AND status = 'published'
      AND published_at <= now()
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'POST_NOT_PUBLISHED'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

-- Função de trigger não deve ser executável diretamente
-- por papéis públicos.

REVOKE ALL ON FUNCTION public.validate_post_like()
FROM PUBLIC, anon, authenticated;

-- 5. Trigger de validação

DROP TRIGGER IF EXISTS trg_validate_post_like
ON public.post_likes;

CREATE TRIGGER trg_validate_post_like
BEFORE INSERT OR UPDATE OF post_id
ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.validate_post_like();
