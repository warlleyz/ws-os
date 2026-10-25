-- === Projeção pública das demonstrações aprovadas ===
-- ----- Rascunhos continuam restritos à Administração -----
-- A view é deliberadamente executada pelo proprietário para não conceder à
-- role anon acesso à tabela com rascunhos. Só projeta configurações aprovadas.
CREATE OR REPLACE VIEW public.project_highlights_public
WITH (security_barrier = true) AS
SELECT id, repository_ids,
  COALESCE((SELECT jsonb_object_agg(project.key,
    COALESCE((SELECT jsonb_agg(demo.value)
      FROM jsonb_array_elements(project.value) AS demo(value)
      WHERE demo.value->>'version' = '2' AND demo.value->>'status' = 'approved'), '[]'::jsonb))
    FROM jsonb_each(demos) AS project(key, value)
    WHERE repository_ids ? project.key), '{}'::jsonb) AS demos
FROM public.project_highlights;
REVOKE ALL ON public.project_highlights_public FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.project_highlights_public TO anon;
REVOKE SELECT ON public.project_highlights FROM anon;
