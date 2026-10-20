import { requireAdministrator } from './auth.js';
import { readBoundedJson } from '../_lib/publicWriteProtection.js';
import { configured, database, domainFailure, json } from '../_lib/backend.js';
import { validateNoteAttachments } from '../../src/services/storage/noteAttachmentContract.js';
import { validId, validInstant } from '../../src/shared/utils/contractValidation.js';

/* === Anexos: vínculo administrativo e projeção pública da publicação === */
export async function onRequest({ request, env }) {
  const admin = new URL(request.url).pathname === '/api/admin/attachments';
  if (admin) {
    const access = await requireAdministrator(request, env);
    if (!access.authorized) return access.response;
  }
  if (env.MANAGED_FILES_ENABLED !== 'true' || !configured(env, true))
    return json({ error: 'FILES_NOT_CONFIGURED' }, 503);
  if (!(admin ? ['POST', 'DELETE'] : ['GET']).includes(request.method))
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  try {
    if (!admin) {
      const id = new URL(request.url).searchParams.get('postId');
      if (!validId(id)) throw Error('INVALID_POST_ID');
      const rows = await database(env, 'rpc/read_post_attachments', {
        method: 'POST',
        service: true,
        body: { target_post: id },
      });
      const parsed = validateNoteAttachments(rows);
      if (!parsed.ok) throw Error('SERVICE_UNAVAILABLE');
      return json({ attachments: parsed.attachments });
    }
    const input = await readBoundedJson(request);
    if (!validId(input.postId) || !validId(input.resourceId) || !validInstant(input.updatedAt))
      throw Error('INVALID_ATTACHMENT');
    const result = await database(env, 'rpc/set_post_attachment', {
      method: 'POST',
      service: true,
      body: {
        target_post: input.postId,
        target_resource: input.resourceId,
        expected_updated_at: input.updatedAt,
        remove_link: request.method === 'DELETE',
      },
    });
    if (result !== true) throw Error('CONFLICT');
    return json({ success: true, postId: input.postId, resourceId: input.resourceId });
  } catch (error) {
    return domainFailure(error);
  }
}
