-- === Projetos em destaque ===
-- ----- Seleção administrativa, sem substituir metadados do GitHub -----
CREATE TABLE IF NOT EXISTS public.project_highlights (
  id text PRIMARY KEY CHECK (id = 'default'),
  repository_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_highlights_array CHECK (jsonb_typeof(repository_ids) = 'array')
);

ALTER TABLE public.project_highlights ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.project_highlights FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.project_highlights TO anon;
GRANT SELECT, INSERT, UPDATE ON public.project_highlights TO authenticated;
GRANT ALL ON public.project_highlights TO service_role;

DROP POLICY IF EXISTS project_highlights_public_read ON public.project_highlights;
CREATE POLICY project_highlights_public_read ON public.project_highlights
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS project_highlights_admin ON public.project_highlights;
CREATE POLICY project_highlights_admin ON public.project_highlights
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = (SELECT auth.uid())));

INSERT INTO public.project_highlights (id, repository_ids)
VALUES ('default', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
