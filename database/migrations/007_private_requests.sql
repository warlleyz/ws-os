-- Aplicação manual SOMENTE em homologação autorizada. Dependências: 001–006.
BEGIN;
CREATE TABLE public.private_requests (
 id text PRIMARY KEY,
 idempotency_key text NOT NULL UNIQUE CHECK(idempotency_key ~ '^[a-zA-Z0-9_-]{16,128}$'),
 fingerprint text NOT NULL CHECK(fingerprint ~ '^[a-f0-9]{64}$'),
 visitor_hash text NOT NULL CHECK(visitor_hash ~ '^[a-f0-9]{64}$'),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision BETWEEN 1 AND 9007199254740991),
 created_at timestamptz NOT NULL DEFAULT now(),
 email_state text NOT NULL DEFAULT 'not_sent' CHECK(email_state IN ('not_sent','sending','confirmed','failed','unknown')),
 record jsonb NOT NULL,
 CHECK ((jsonb_typeof(record)='object'
  AND record ?& ARRAY['id','revision','idempotencyKey','status','type','name','email','message','createdAt','updatedAt']
  AND record->>'id'=id AND jsonb_typeof(record->'revision')='number'
  AND (record->>'revision')::bigint=revision AND record->>'idempotencyKey'=idempotency_key
  AND record->>'status' IN ('new','in_review','awaiting_response','responded','completed','archived')
  AND record->>'type' IN ('message','schedule')
  AND jsonb_typeof(record->'name')='string' AND length(record->>'name') BETWEEN 2 AND 100
  AND jsonb_typeof(record->'email')='string' AND length(record->>'email') BETWEEN 3 AND 254
  AND jsonb_typeof(record->'message')='string' AND length(record->>'message') BETWEEN 10 AND 5000
  AND (record->>'updatedAt')::timestamptz >= (record->>'createdAt')::timestamptz) IS TRUE),
 CHECK ((CASE WHEN record->>'status' IN ('completed','archived') THEN
  (CASE WHEN record->>'status'='completed' THEN record->>'completedAt' ELSE record->>'archivedAt' END) IS NOT NULL
  AND LEAST((record->>'completedAt')::timestamptz,(record->>'archivedAt')::timestamptz)
    BETWEEN (record->>'createdAt')::timestamptz AND (record->>'updatedAt')::timestamptz
  AND EXTRACT(EPOCH FROM ((record->>'retentionUntil')::timestamptz-
    LEAST((record->>'completedAt')::timestamptz,(record->>'archivedAt')::timestamptz)))=15552000
 ELSE record->>'retentionUntil' IS NULL END) IS TRUE)
);
ALTER TABLE public.private_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.private_requests FROM PUBLIC,anon,authenticated;
GRANT SELECT,UPDATE,DELETE ON public.private_requests TO authenticated;
GRANT ALL ON public.private_requests TO service_role;
CREATE POLICY requests_admin ON public.private_requests FOR ALL TO authenticated
 USING(EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=(SELECT auth.uid())))
 WITH CHECK(EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=(SELECT auth.uid())));

/* === Inserção idempotente atômica e resposta pública mínima === */
CREATE FUNCTION public.submit_private_request(request_data jsonb,request_key text,request_fingerprint text,request_visitor text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE existing public.private_requests; request_id text; stamp text;
BEGIN
 IF NOT COALESCE(request_key ~ '^[a-zA-Z0-9_-]{16,128}$'
  AND request_fingerprint ~ '^[a-f0-9]{64}$' AND request_visitor ~ '^[a-f0-9]{64}$'
  AND jsonb_typeof(request_data)='object' AND request_data->>'type' IN ('message','schedule')
  AND length(request_data->>'name') BETWEEN 2 AND 100
  AND length(request_data->>'email') BETWEEN 3 AND 254
  AND length(request_data->>'message') BETWEEN 10 AND 5000,false)
 THEN RAISE EXCEPTION 'invalid request'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(request_key,0));
 SELECT * INTO existing FROM public.private_requests WHERE idempotency_key=request_key;
 IF FOUND THEN
  IF existing.fingerprint<>request_fingerprint OR existing.visitor_hash<>request_visitor THEN
   RETURN jsonb_build_object('conflict',true);
  END IF;
  RETURN jsonb_build_object('id',existing.id,'status',existing.record->>'status','email',existing.email_state,'reused',true);
 END IF;
 request_id:=pg_catalog.gen_random_uuid()::text;
 stamp:=to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
 INSERT INTO public.private_requests(id,idempotency_key,fingerprint,visitor_hash,record)
 VALUES(request_id,request_key,request_fingerprint,request_visitor,
  request_data || jsonb_build_object('id',request_id,'status','new','revision',1,'idempotencyKey',request_key,
  'createdAt',stamp,'updatedAt',stamp,'completedAt',null,'archivedAt',null,'retentionUntil',null));
 RETURN jsonb_build_object('id',request_id,'status','new','reused',false);
END $$;
REVOKE ALL ON FUNCTION public.submit_private_request(jsonb,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_private_request(jsonb,text,text,text) TO service_role;

CREATE TABLE public.private_request_history (
 request_id text NOT NULL REFERENCES public.private_requests(id) ON DELETE CASCADE,
 revision bigint NOT NULL,
 actor_id uuid,
 from_status text NOT NULL,
 to_status text NOT NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(request_id,revision)
);
ALTER TABLE public.private_request_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.private_request_history FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.private_request_history TO authenticated;
GRANT ALL ON public.private_request_history TO service_role;
CREATE POLICY history_admin ON public.private_request_history FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=(SELECT auth.uid())));
CREATE FUNCTION public.record_private_request_transition()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.record->>'status'<>OLD.record->>'status' THEN
  INSERT INTO public.private_request_history(request_id,revision,actor_id,from_status,to_status)
  VALUES(NEW.id,NEW.revision,auth.uid(),OLD.record->>'status',NEW.record->>'status');
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER private_request_transition AFTER UPDATE OF record ON public.private_requests
 FOR EACH ROW EXECUTE FUNCTION public.record_private_request_transition();

/* === Reclamação única; um crash deixa sending e exige reconciliação === */
CREATE FUNCTION public.claim_request_notification(target_id text,target_visitor text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE public.private_requests SET email_state='sending'
 WHERE id=target_id AND visitor_hash=target_visitor AND email_state='not_sent';
 RETURN FOUND;
END $$;
CREATE FUNCTION public.finish_request_notification(target_id text,target_visitor text,delivery_state text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF delivery_state NOT IN ('confirmed','failed','unknown') OR delivery_state IS NULL THEN RETURN false; END IF;
 UPDATE public.private_requests SET email_state=delivery_state
 WHERE id=target_id AND visitor_hash=target_visitor AND email_state='sending';
 RETURN FOUND;
END $$;
CREATE FUNCTION public.purge_expired_private_requests()
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE removed bigint;
BEGIN
 DELETE FROM public.private_requests WHERE record->>'status' IN ('completed','archived')
 AND (record->>'retentionUntil')::timestamptz<=now();
 GET DIAGNOSTICS removed=ROW_COUNT;
 RETURN removed;
END $$;
REVOKE ALL ON FUNCTION public.record_private_request_transition(),public.claim_request_notification(text,text),public.finish_request_notification(text,text,text),public.purge_expired_private_requests() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_request_notification(text,text),public.finish_request_notification(text,text,text),public.purge_expired_private_requests() TO service_role;
COMMIT;
