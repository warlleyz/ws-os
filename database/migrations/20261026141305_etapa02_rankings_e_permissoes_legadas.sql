/* === ETAPA 02 — RANKINGS E PERMISSÕES LEGADAS === */
/* ----- APLICAR SOMENTE APÓS 014 E MEDIANTE AUTORIZAÇÃO DO AMBIENTE ----- */
/* ----- NÃO REESCREVER MIGRAÇÕES ANTERIORES NEM APAGAR DADOS EXISTENTES ----- */
BEGIN;

/* ----- INTERROMPER EM CONTENÇÃO OU COMANDO EXCESSIVAMENTE LONGO ----- */
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

/* === LIMITE DO SNAKE TECNOLÓGICO === */
/* ----- TABULEIRO 20 × 20 COM CORPO INICIAL DE TRÊS POSIÇÕES: MÁXIMO 397 ----- */
ALTER TABLE public.game_scores
  DROP CONSTRAINT game_scores_check;

ALTER TABLE public.game_scores
  ADD CONSTRAINT game_scores_score_check
  CHECK (
    score > 0
    AND score <= CASE WHEN game = 'snake' THEN 397 ELSE 100000 END
  );

/* === ISOLAMENTO DA VIEW DAS DEMONSTRAÇÕES REMOVIDAS === */
/* ----- PRESERVAR ESTRUTURA E DADOS; A API ATUAL CONSULTA SOMENTE OS IDS NA TABELA ----- */
ALTER VIEW public.project_highlights_public
  SET (security_invoker = true);

REVOKE ALL ON public.project_highlights_public
  FROM PUBLIC, anon, authenticated;

/* ----- REVOGAR TAMBÉM EVENTUAIS CONCESSÕES POR COLUNA DA VIEW LEGADA ----- */
REVOKE SELECT (id, repository_ids, demos) ON public.project_highlights_public
  FROM PUBLIC, anon, authenticated;

COMMIT;
