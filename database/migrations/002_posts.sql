
-- WS OS V2
-- Migração 002: Publicações do aplicativo Notas
-- Dependência: 001_admin_users.sql

CREATE TABLE IF NOT EXISTS public.posts (
    id text NOT NULL,
    title jsonb NOT NULL,
    summary jsonb NOT NULL DEFAULT '""'::jsonb,
    body jsonb NOT NULL,
    tags text[] NOT NULL DEFAULT '{}'::text[],
    status text NOT NULL DEFAULT 'draft',
    published_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT posts_pkey PRIMARY KEY (id),
    CONSTRAINT posts_id_check
        CHECK (id ~ '^[a-zA-Z0-9_-]{1,80}$'),
    CONSTRAINT posts_status_check
        CHECK (status IN ('draft', 'published'))
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Atualização automática da data de modificação
CREATE OR REPLACE FUNCTION public.update_posts_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_updated_at_trigger
ON public.posts;

CREATE TRIGGER posts_updated_at_trigger
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_posts_timestamp();

-- Políticas administrativas
DROP POLICY IF EXISTS admin_select_posts ON public.posts;
DROP POLICY IF EXISTS admin_insert_posts ON public.posts;
DROP POLICY IF EXISTS admin_update_posts ON public.posts;
DROP POLICY IF EXISTS admin_delete_posts ON public.posts;
DROP POLICY IF EXISTS public_read_published ON public.posts;

CREATE POLICY admin_select_posts
ON public.posts
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
    )
);

CREATE POLICY admin_insert_posts
ON public.posts
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
    )
);

CREATE POLICY admin_update_posts
ON public.posts
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
    )
);

CREATE POLICY admin_delete_posts
ON public.posts
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
    )
);

CREATE POLICY public_read_published
ON public.posts
FOR SELECT TO anon
USING (
    status = 'published'
    AND published_at <= now()
);

-- Privilégios SQL
REVOKE ALL ON TABLE public.posts
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.posts TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.posts TO authenticated;

GRANT ALL PRIVILEGES
ON public.posts TO service_role;
