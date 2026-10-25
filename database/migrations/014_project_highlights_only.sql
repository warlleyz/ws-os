-- === Leitura pública mínima dos projetos em destaque ===
-- ----- Preservar identificadores e dados históricos; não remover colunas ou views -----
-- A política de leitura pública da migração 011 continua vigente.
-- Este ajuste permite consultar a tabela sem depender de projeções adicionais.
REVOKE SELECT ON public.project_highlights FROM anon;
GRANT SELECT (id, repository_ids) ON public.project_highlights TO anon;
