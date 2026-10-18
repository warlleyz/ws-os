
-- WS OS V2
-- Migração 001: Controle de administradores
-- Dependência: Supabase Auth (auth.users)

CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id uuid PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Controle de acesso por linha
ALTER TABLE public.admin_users
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.admin_users
NO FORCE ROW LEVEL SECURITY;

-- Recriar a política de leitura administrativa
DROP POLICY IF EXISTS admin_read_own
ON public.admin_users;

CREATE POLICY admin_read_own
ON public.admin_users
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    (SELECT auth.uid()) = user_id
);

-- Permissões dos papéis da aplicação
REVOKE ALL ON TABLE public.admin_users
FROM PUBLIC, anon, authenticated;

GRANT SELECT
ON TABLE public.admin_users
TO authenticated;

GRANT ALL PRIVILEGES
ON TABLE public.admin_users
TO service_role;
