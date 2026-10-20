-- Aplicar manualmente em homologação depois de 007 e 008.
BEGIN;
GRANT ALL ON public.game_scores TO service_role;
CREATE FUNCTION public.unlink_deleted_file()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.state='deleted' AND OLD.state<>'deleted' THEN
  UPDATE public.posts SET updated_at=clock_timestamp() WHERE id IN
   (SELECT post_id FROM public.post_attachments WHERE resource_id=NEW.id);
  DELETE FROM public.post_attachments WHERE resource_id=NEW.id;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER unlink_deleted_file AFTER UPDATE OF state ON public.official_files
 FOR EACH ROW EXECUTE FUNCTION public.unlink_deleted_file();
REVOKE ALL ON FUNCTION public.unlink_deleted_file() FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.list_public_files()
RETURNS SETOF public.official_files LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT * FROM public.official_files WHERE purpose='catalog' AND state='available' AND visibility='public'
 ORDER BY updated_at DESC LIMIT 200;
$$;
REVOKE ALL ON FUNCTION public.list_public_files() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_files() TO service_role;

/* === Revisões e identidade também são garantidas no banco === */
CREATE FUNCTION public.guard_private_request_revision()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.id<>OLD.id OR NEW.idempotency_key<>OLD.idempotency_key
 OR NEW.fingerprint<>OLD.fingerprint OR NEW.visitor_hash<>OLD.visitor_hash
 OR NEW.created_at<>OLD.created_at THEN RAISE EXCEPTION 'immutable request identity'; END IF;
 IF NEW.record IS DISTINCT FROM OLD.record THEN
  IF NEW.revision<>OLD.revision+1 OR NEW.record->>'createdAt'<>OLD.record->>'createdAt'
  THEN RAISE EXCEPTION 'request revision conflict'; END IF;
 ELSIF NEW.revision<>OLD.revision THEN RAISE EXCEPTION 'request revision conflict'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_private_request_revision BEFORE UPDATE ON public.private_requests
 FOR EACH ROW EXECUTE FUNCTION public.guard_private_request_revision();
CREATE FUNCTION public.guard_official_file_revision()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.id<>OLD.id OR NEW.object_key<>OLD.object_key OR NEW.name<>OLD.name
 OR NEW.mime_type<>OLD.mime_type OR NEW.size<>OLD.size OR NEW.purpose<>OLD.purpose
 THEN RAISE EXCEPTION 'immutable file identity'; END IF;
 IF NEW.revision<>OLD.revision+1 THEN RAISE EXCEPTION 'file revision conflict'; END IF;
 IF NEW.state<>OLD.state AND NOT (
  (OLD.state='pending' AND NEW.state IN ('uploading','failed','deleting')) OR
  (OLD.state='uploading' AND NEW.state IN ('available','failed','deleting')) OR
  (OLD.state='available' AND NEW.state='deleting') OR
  (OLD.state='failed' AND NEW.state IN ('pending','deleting')) OR
  (OLD.state='deleting' AND NEW.state IN ('deleted','failed'))
 ) THEN RAISE EXCEPTION 'file state conflict'; END IF;
 IF OLD.state='deleted' THEN RAISE EXCEPTION 'file deleted'; END IF;
 NEW.updated_at:=clock_timestamp();
 RETURN NEW;
END $$;
CREATE TRIGGER guard_official_file_revision BEFORE UPDATE ON public.official_files
 FOR EACH ROW EXECUTE FUNCTION public.guard_official_file_revision();
REVOKE ALL ON FUNCTION public.guard_private_request_revision(),public.guard_official_file_revision() FROM PUBLIC,anon,authenticated;
COMMIT;
