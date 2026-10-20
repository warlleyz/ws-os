-- SOMENTE homologação descartável; psql -v ON_ERROR_STOP=1 -v admin_id=<uuid existente>
-- O usuário de conexão deve poder SET ROLE. Todo dado inserido aqui termina em ROLLBACK.
\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('ws_os.test_admin', :'admin_id', true);
INSERT INTO public.admin_users(user_id) VALUES (:'admin_id'::uuid) ON CONFLICT DO NOTHING;
INSERT INTO public.posts(id,title,body,status) VALUES ('rls-smoke-private','"Rascunho"','"Teste"','draft');
INSERT INTO public.official_files(id,name,mime_type,size,state,visibility,purpose,object_key)
 VALUES('rls-smoke-file','test.pdf','application/pdf',8,'pending','private','catalog','official/00000000-0000-0000-0000-000000000000');

SELECT public.submit_private_request(
 '{"type":"message","name":"RLS Test","email":"rls@example.invalid","message":"Mensagem privada de homologacao","requestedAt":null,"timezone":null}'::jsonb,
 'rls-smoke-request-001',repeat('a',64),repeat('b',64));

/* === Visitante: sem linhas privadas, escrita ou execução de RPC privilegiado === */
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.posts WHERE id='rls-smoke-private') THEN RAISE EXCEPTION 'draft exposed'; END IF;
 BEGIN
  PERFORM * FROM public.private_requests;
  RAISE EXCEPTION 'private requests exposed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM * FROM public.official_files;
  RAISE EXCEPTION 'file metadata exposed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.read_public_file('rls-smoke-file');
  RAISE EXCEPTION 'service RPC exposed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM visitor_hash FROM public.game_scores LIMIT 1;
  RAISE EXCEPTION 'visitor hash exposed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

/* === Usuário comum sem cadastro de administrador: RLS não entrega os rascunhos === */
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.posts WHERE id='rls-smoke-private') THEN RAISE EXCEPTION 'ordinary user reads draft'; END IF;
 IF EXISTS(SELECT 1 FROM public.official_files WHERE id='rls-smoke-file') THEN RAISE EXCEPTION 'ordinary user reads file'; END IF;
 IF EXISTS(SELECT 1 FROM public.private_requests) THEN RAISE EXCEPTION 'ordinary user reads requests'; END IF;
 BEGIN
  INSERT INTO public.posts(id,title,body,status) VALUES('rls-smoke-denied','"X"','"X"','draft');
  RAISE EXCEPTION 'ordinary user writes posts';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

/* === Administrador autenticado: acesso aos recursos necessários, sem service role === */
SELECT set_config('request.jwt.claim.sub',current_setting('ws_os.test_admin'),true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.posts WHERE id='rls-smoke-private') THEN RAISE EXCEPTION 'admin cannot read draft'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.official_files WHERE id='rls-smoke-file') THEN RAISE EXCEPTION 'admin cannot read file'; END IF;
 UPDATE public.posts SET title='"Revisado"' WHERE id='rls-smoke-private';
 IF NOT FOUND THEN RAISE EXCEPTION 'admin cannot update post'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
