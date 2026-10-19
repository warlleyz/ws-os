-- Aplicação manual em homologação antes de produção. Depende de 001_admin_users.sql.
CREATE TABLE IF NOT EXISTS public.managed_content (
  kind text NOT NULL CHECK (kind IN ('events','files')),
  id text NOT NULL CHECK (id ~ '^[a-zA-Z0-9_-]{1,80}$'),
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind,id)
);
ALTER TABLE public.managed_content ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.managed_content FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.managed_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.managed_content TO authenticated;
DROP POLICY IF EXISTS managed_public_read ON public.managed_content;
CREATE POLICY managed_public_read ON public.managed_content FOR SELECT TO anon USING (status = 'published');
DROP POLICY IF EXISTS managed_admin ON public.managed_content;
CREATE POLICY managed_admin ON public.managed_content FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = (SELECT auth.uid())));
DROP TRIGGER IF EXISTS managed_updated_at ON public.managed_content;
CREATE TRIGGER managed_updated_at BEFORE UPDATE ON public.managed_content
  FOR EACH ROW EXECUTE FUNCTION public.update_posts_timestamp();
