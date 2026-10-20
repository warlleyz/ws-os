-- R2 privado: aplicar somente no ambiente autorizado. Dependências 001–007.
BEGIN;
CREATE TABLE public.official_files (
 id text PRIMARY KEY CHECK (id ~ '^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,199}$'),
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 255),
 mime_type text NOT NULL CHECK(mime_type IN ('application/pdf','text/plain','image/png','image/jpeg','image/webp')),
 size integer NOT NULL CHECK(size BETWEEN 1 AND 10485760),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','uploading','available','failed','deleting','deleted')),
 visibility text NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','public')),
 purpose text NOT NULL CHECK(purpose IN ('catalog','attachment')),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision BETWEEN 1 AND 9007199254740991),
 object_key text NOT NULL UNIQUE CHECK(object_key ~ '^official/[a-f0-9-]{36}$'),
 sha256 text CHECK(sha256 ~ '^[a-f0-9]{64}$'),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(state<>'available' OR sha256 IS NOT NULL)
);
ALTER TABLE public.official_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.official_files FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.official_files TO authenticated;
GRANT ALL ON public.official_files TO service_role;
CREATE POLICY files_admin ON public.official_files FOR ALL TO authenticated
 USING(EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=(SELECT auth.uid())))
 WITH CHECK(EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=(SELECT auth.uid())));

CREATE TABLE public.post_attachments (
 post_id text NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
 resource_id text NOT NULL REFERENCES public.official_files(id),
 PRIMARY KEY(post_id,resource_id)
);
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.post_attachments FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.post_attachments TO authenticated;
GRANT ALL ON public.post_attachments TO service_role;
CREATE POLICY attachments_admin ON public.post_attachments FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=(SELECT auth.uid())));

/* === Vínculos serializados por publicação: limite válido também fora da UI === */
CREATE FUNCTION public.set_post_attachment(target_post text,target_resource text,expected_updated_at timestamptz,remove_link boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE post public.posts; file public.official_files;
BEGIN
 SELECT * INTO post FROM public.posts WHERE id=target_post FOR UPDATE;
 IF NOT FOUND OR post.updated_at<>expected_updated_at THEN RETURN false; END IF;
 SELECT * INTO file FROM public.official_files WHERE id=target_resource FOR UPDATE;
 IF NOT FOUND OR (NOT remove_link AND (file.state<>'available' OR file.purpose<>'attachment')) THEN RETURN false; END IF;
 IF remove_link THEN
  DELETE FROM public.post_attachments WHERE post_id=target_post AND resource_id=target_resource;
 ELSE
  IF EXISTS(SELECT 1 FROM public.post_attachments WHERE post_id=target_post AND resource_id=target_resource) THEN RETURN true; END IF;
  IF (SELECT count(*) FROM public.post_attachments WHERE post_id=target_post)>=5 THEN RETURN false; END IF;
  INSERT INTO public.post_attachments VALUES(target_post,target_resource);
 END IF;
 UPDATE public.posts SET updated_at=clock_timestamp() WHERE id=target_post;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.set_post_attachment(text,text,timestamptz,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_post_attachment(text,text,timestamptz,boolean) TO service_role;

/* === Somente o Worker recebe a chave; bucket sem domínio público === */
CREATE FUNCTION public.read_public_file(target_id text)
RETURNS SETOF public.official_files LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT f.* FROM public.official_files f WHERE f.id=target_id AND f.state='available'
 AND ((f.purpose='catalog' AND f.visibility='public') OR
 (f.purpose='attachment' AND EXISTS(SELECT 1 FROM public.post_attachments a JOIN public.posts p ON p.id=a.post_id
 WHERE a.resource_id=f.id AND p.status='published' AND p.published_at<=now())));
$$;
REVOKE ALL ON FUNCTION public.read_public_file(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.read_public_file(text) TO service_role;
CREATE FUNCTION public.read_post_attachments(target_post text)
RETURNS TABLE("resourceId" text,name text,"mimeType" text,size integer)
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT f.id,f.name,f.mime_type,f.size FROM public.post_attachments a
 JOIN public.official_files f ON f.id=a.resource_id JOIN public.posts p ON p.id=a.post_id
 WHERE a.post_id=target_post AND f.state='available' AND p.status='published' AND p.published_at<=now();
$$;
REVOKE ALL ON FUNCTION public.read_post_attachments(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.read_post_attachments(text) TO service_role;
COMMIT;
