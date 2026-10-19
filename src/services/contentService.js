import { requestPublicJson } from './publicDataService';
import { publicAssetUrl, safeExternalUrl } from '../shared/utils/urls';

export async function fetchManagedContent(kind, options = {}) {
  if (!['events', 'files'].includes(kind)) throw Error('INVALID_KIND');
  const result = await requestPublicJson('/api/content?kind=' + kind, options);
  if (!Array.isArray(result.data?.items)) throw Error('INVALID_CONTENT');
  return {
    ...result,
    data: result.data.items
      .filter((item) => item?.status === 'published' && typeof item.data?.title === 'string')
      .map((item) => ({ id: item.id, ...item.data }))
      .filter((item) =>
        kind === 'files'
          ? !!publicAssetUrl(item.url)
          : /^\d{4}-\d{2}-\d{2}$/.test(item.date) && (!item.url || !!safeExternalUrl(item.url)),
      ),
  };
}
