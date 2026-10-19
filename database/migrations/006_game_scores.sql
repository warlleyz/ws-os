-- Aplicar manualmente em homologação. Nenhuma escrita pública direta.
CREATE TABLE IF NOT EXISTS public.game_scores (
  game text NOT NULL CHECK (game IN ('snake','flappy')),
  visitor_hash text NOT NULL CHECK (length(visitor_hash)=64),
  alias text NOT NULL CHECK (length(alias) BETWEEN 2 AND 24),
  score integer NOT NULL CHECK (score > 0 AND score <= CASE WHEN game='snake' THEN 222 ELSE 100000 END),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(game,visitor_hash)
);
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_scores FROM PUBLIC,anon,authenticated;
GRANT SELECT (game,alias,score,created_at) ON public.game_scores TO anon,authenticated;
DROP POLICY IF EXISTS public_scores ON public.game_scores;
CREATE POLICY public_scores ON public.game_scores FOR SELECT TO anon,authenticated USING(true);
CREATE OR REPLACE FUNCTION public.submit_game_score(target_game text,target_alias text,target_score integer,target_visitor text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
  INSERT INTO public.game_scores AS existing (game,visitor_hash,alias,score)
  VALUES (target_game,target_visitor,target_alias,target_score)
  ON CONFLICT(game,visitor_hash) DO UPDATE SET alias=EXCLUDED.alias,score=EXCLUDED.score,created_at=now()
  WHERE EXCLUDED.score>existing.score;
$$;
REVOKE ALL ON FUNCTION public.submit_game_score(text,text,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_game_score(text,text,integer,text) TO service_role;
