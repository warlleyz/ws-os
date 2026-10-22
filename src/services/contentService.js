import {
  validInstant,
  validTimezone,
  validId,
  validText,
} from '../shared/utils/contractValidation.js';
import { adaptLegacyPublicEvent } from './publicContentContract';
import { requestPublicJson } from './publicDataService';
import { publicAssetUrl, safeExternalUrl } from '../shared/utils/urls';

export async function fetchManagedContent(kind, options = {}) {
  if (!['events', 'files'].includes(kind)) throw Error('INVALID_KIND');
  const result = await requestPublicJson('/api/content?kind=' + kind, {
    category: 'content',
    ...options,
  });
  if (!Array.isArray(result.data?.items)) throw Error('INVALID_CONTENT');
  return {
    ...result,
    data: result.data.items
      .filter((item) => item?.status === 'published' && typeof item.data?.title === 'string')
      .map((item) => ({ ...item.data, id: item.id }))
      .map((item) =>
        kind === 'events'
          ? item.allDay === false
            ? validId(item.id) &&
              validText(item.title, 160, 1) &&
              validText(item.description ?? '', 2000) &&
              validInstant(item.startsAt) &&
              validTimezone(item.timezone) &&
              (item.endsAt == null ||
                (validInstant(item.endsAt) && Date.parse(item.endsAt) >= Date.parse(item.startsAt)))
              ? {
                  id: item.id,
                  title: item.title,
                  description: item.description ?? '',
                  allDay: false,
                  startsAt: item.startsAt,
                  endsAt: item.endsAt ?? null,
                  timezone: item.timezone,
                  url: item.url ?? '',
                  date: eventDate(item.startsAt, item.timezone),
                }
              : null
            : (adaptLegacyPublicEvent(item).data ?? null)
          : item,
      )
      .filter(Boolean)
      .filter((item) =>
        kind === 'files'
          ? !!publicAssetUrl(item.url)
          : /^\d{4}-\d{2}-\d{2}$/.test(item.date) && (!item.url || !!safeExternalUrl(item.url)),
      ),
  };
}

/* === A data de um evento com horário respeita seu fuso publicado === */
function eventDate(instant, timeZone) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instant));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
}
