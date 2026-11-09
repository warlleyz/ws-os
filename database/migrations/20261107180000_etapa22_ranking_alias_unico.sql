
/* === ETAPA 22 — UNICIDADE DOS APELIDOS NO RANKING === */
/* ----- Preservação dos registros existentes ----- */

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

/* === VERIFICAÇÃO DE DUPLICATAS === */
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.game_scores
        GROUP BY game, lower(btrim(alias))
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Existem apelidos duplicados. Revisão necessária antes da migração.';
    END IF;
END;
$$;

/* === UNICIDADE POR JOGO E APELIDO === */
CREATE UNIQUE INDEX IF NOT EXISTS game_scores_game_alias_unique
ON public.game_scores (game, lower(btrim(alias)));

COMMIT;
