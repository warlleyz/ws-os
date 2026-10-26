/* === ETAPA 02 — HOMOLOGAÇÃO TRANSACIONAL === */
/* ----- EXECUTAR SOMENTE EM AMBIENTE DE TESTE AUTORIZADO APÓS A MIGRAÇÃO INCREMENTAL ----- */
/* ----- PSQL -V ON_ERROR_STOP=1 -F DATABASE/TESTS/ETAPA02_RANKINGS_PERMISSIONS.SQL ----- */
/* ----- A CONEXÃO DEVE PODER CONSULTAR PRIVILÉGIOS E EXECUTAR OS RPCS DE SERVIÇO ----- */
\set ON_ERROR_STOP on
BEGIN;

/* === LIMITES EFETIVOS E PRESERVAÇÃO DE PONTUAÇÃO === */
DO $$
DECLARE
  visitor text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
BEGIN
  PERFORM public.submit_game_score('snake', 'Homologacao', 397, visitor);
  IF NOT EXISTS (SELECT 1 FROM public.game_scores WHERE game='snake' AND visitor_hash=visitor AND score=397) THEN
    RAISE EXCEPTION 'Snake não aceitou o limite 397';
  END IF;
  PERFORM public.submit_game_score('snake', 'Homologacao', 223, visitor);
  IF NOT EXISTS (SELECT 1 FROM public.game_scores WHERE game='snake' AND visitor_hash=visitor AND score=397) THEN
    RAISE EXCEPTION 'Envio inferior substituiu o recorde';
  END IF;
  BEGIN
    PERFORM public.submit_game_score('snake', 'Homologacao', 398, visitor);
    RAISE EXCEPTION 'Snake aceitou pontuação acima do limite';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  PERFORM public.submit_game_score('flappy', 'Homologacao', 100000, visitor);
  BEGIN
    PERFORM public.submit_game_score('flappy', 'Homologacao', 100001, visitor);
    RAISE EXCEPTION 'Flappy aceitou pontuação acima do limite';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

/* === PERMISSÕES PÚBLICAS MÍNIMAS === */
DO $$
BEGIN
  IF has_any_column_privilege('anon', 'public.project_highlights_public', 'SELECT')
    OR has_any_column_privilege('authenticated', 'public.project_highlights_public', 'SELECT') THEN
    RAISE EXCEPTION 'View das demos removidas permanece acessível';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.project_highlights_public'::regclass
    AND reloptions @> ARRAY['security_invoker=true']) THEN
    RAISE EXCEPTION 'View legada ainda usa privilégios do proprietário';
  END IF;
  IF NOT has_column_privilege('anon', 'public.project_highlights', 'repository_ids', 'SELECT')
    OR has_column_privilege('anon', 'public.project_highlights', 'demos', 'SELECT') THEN
    RAISE EXCEPTION 'Projeção pública dos destaques está incorreta';
  END IF;
  IF has_column_privilege('anon', 'public.game_scores', 'visitor_hash', 'SELECT')
    OR has_function_privilege('anon', 'public.submit_game_score(text,text,integer,text)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.submit_game_score(text,text,integer,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Ranking expõe identificador ou escrita privilegiada';
  END IF;
END $$;

/* === PRESERVAÇÃO DOS DADOS DO AMBIENTE === */
ROLLBACK;
