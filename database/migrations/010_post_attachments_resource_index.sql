
-- === Otimização dos vínculos de arquivos oficiais ===
-- ----- Índice para consultas por identificador de recurso -----
CREATE INDEX IF NOT EXISTS idx_post_attachments_resource_id
ON public.post_attachments (resource_id);
