-- === Demonstrações de projetos destacados ===
-- ----- Mesmo registro dos destaques; somente o administrador escreve -----
ALTER TABLE public.project_highlights
  ADD COLUMN IF NOT EXISTS demos jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.project_highlights
  ADD CONSTRAINT project_highlights_demos_object
  CHECK (jsonb_typeof(demos) = 'object');
