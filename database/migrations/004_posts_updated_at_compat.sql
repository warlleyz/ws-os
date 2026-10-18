-- Compatibilidade com a tabela posts criada pelo SQL inicial de docs/backend.
-- Aplicação manual; não executado automaticamente. Não altera conteúdo ou status.
BEGIN;
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.update_posts_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_updated_at_trigger ON public.posts;
CREATE TRIGGER posts_updated_at_trigger
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_posts_timestamp();
COMMIT;
