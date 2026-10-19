import {
  isRecord,
  validId,
  validText,
  validInstant,
  validDate,
  validTimezone,
  validLocalizedText,
  contractError,
} from '../shared/utils/contractValidation.js';
import { isValidRevision } from './revisionContract.js';
import { validateNoteAttachments } from './storage/noteAttachmentContract.js';

/* === Identidade e revisão editorial === */
const statusValid = (value) => ['draft', 'published'].includes(value);
const https = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && value.length <= 2048;
  } catch {
    return false;
  }
};

/* === Eventos públicos: sem dados de solicitações privadas === */
export function validatePublicEvent(input) {
  if (
    !isRecord(input) ||
    !validId(input.id) ||
    !validLocalizedText(input.title, 160, true) ||
    !validLocalizedText(input.description ?? '', 2000) ||
    !statusValid(input.status) ||
    !isValidRevision(input.revision) ||
    !validInstant(input.createdAt) ||
    !validInstant(input.updatedAt) ||
    Date.parse(input.updatedAt) < Date.parse(input.createdAt)
  )
    return contractError('INVALID_PUBLIC_EVENT');
  if (
    ['email', 'message', 'requestId', 'attendees', 'privateRequest'].some((key) =>
      Object.hasOwn(input, key),
    )
  )
    return contractError('PRIVATE_EVENT_DATA');
  if (
    typeof input.allDay !== 'boolean' ||
    (input.allDay
      ? !validDate(input.date)
      : !validInstant(input.startsAt) ||
        !validTimezone(input.timezone) ||
        (input.endsAt != null &&
          (!validInstant(input.endsAt) || Date.parse(input.endsAt) < Date.parse(input.startsAt))))
  )
    return contractError('INVALID_EVENT_DATE');
  if (input.url && !https(input.url)) return contractError('INVALID_EVENT_URL');
  return {
    ok: true,
    data: {
      id: input.id,
      title: input.title,
      description: input.description ?? '',
      status: input.status,
      revision: input.revision,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      allDay: input.allDay,
      date: input.allDay ? input.date : null,
      startsAt: input.allDay ? null : input.startsAt,
      endsAt: input.allDay ? null : (input.endsAt ?? null),
      timezone: input.allDay ? null : input.timezone,
      url: input.url ?? '',
    },
  };
}

/* ----- Adaptação explícita do catálogo legado de dia inteiro ----- */
export function adaptLegacyPublicEvent(input) {
  if (
    !isRecord(input) ||
    !validId(input.id) ||
    !validText(input.title, 160, 1) ||
    !validDate(input.date) ||
    !validText(input.description ?? '', 2000) ||
    (input.url && !https(input.url))
  )
    return contractError('INVALID_PUBLIC_EVENT');
  return {
    ok: true,
    data: {
      id: input.id,
      title: input.title,
      date: input.date,
      allDay: true,
      timezone: null,
      description: input.description ?? '',
      url: input.url ?? '',
    },
  };
}

/* === Projetos e demonstrações === */
export function validateDemo(input) {
  if (
    !isRecord(input) ||
    !validId(input.id) ||
    !['embedded', 'external', 'unavailable'].includes(input.mode) ||
    !validLocalizedText(input.title ?? '', 160)
  )
    return contractError('INVALID_DEMO');
  if (input.mode !== 'unavailable' && !https(input.url)) return contractError('INVALID_DEMO_URL');
  return {
    ok: true,
    data: {
      id: input.id,
      title: input.title ?? '',
      mode: input.mode,
      url: input.mode === 'unavailable' ? null : input.url,
    },
  };
}

export function validateProject(input) {
  if (
    !isRecord(input) ||
    !validId(input.id) ||
    !validLocalizedText(input.name, 160, true) ||
    !validLocalizedText(input.description ?? '', 5000) ||
    !Array.isArray(input.technologies) ||
    input.technologies.length > 40 ||
    input.technologies.some((item) => !validText(item, 80, 1)) ||
    (input.repository && !https(input.repository)) ||
    (input.homepage && !https(input.homepage)) ||
    (input.featured !== undefined && typeof input.featured !== 'boolean') ||
    (input.order !== undefined && (!Number.isSafeInteger(input.order) || input.order < 0))
  )
    return contractError('INVALID_PROJECT');
  const demos = input.demos ?? [];
  if (
    !Array.isArray(demos) ||
    demos.length > 20 ||
    demos.some((item) => !validateDemo(item).ok) ||
    new Set(demos.map((item) => item.id)).size !== demos.length
  )
    return contractError('INVALID_PROJECT_DEMOS');
  return {
    ok: true,
    data: {
      id: input.id,
      name: input.name,
      description: input.description ?? '',
      technologies: [...input.technologies],
      repository: input.repository ?? null,
      homepage: input.homepage ?? null,
      featured: input.featured ?? false,
      order: input.order ?? 0,
      demos: demos.map((item) => validateDemo(item).data),
    },
  };
}

/* === Publicações e seus anexos === */
export function validatePublication(input, { now = Date.now(), publicOnly = false } = {}) {
  if (
    !isRecord(input) ||
    !validId(input.id) ||
    !statusValid(input.status) ||
    !validLocalizedText(input.title, 160, true) ||
    !validLocalizedText(input.summary ?? '', 500) ||
    !validLocalizedText(input.body, 10000, true) ||
    !Array.isArray(input.tags) ||
    input.tags.length > 12 ||
    input.tags.some((tag) => !validText(tag, 80, 1))
  )
    return contractError('INVALID_PUBLICATION');
  const attachments = validateNoteAttachments(input.attachments ?? []);
  if (!attachments.ok) return attachments;
  if (input.status === 'published' && !validInstant(input.publishedAt))
    return contractError('INVALID_PUBLICATION_DATE');
  if (publicOnly && (input.status !== 'published' || Date.parse(input.publishedAt) > now))
    return contractError('PUBLICATION_NOT_PUBLIC');
  return {
    ok: true,
    data: {
      id: input.id,
      title: input.title,
      summary: input.summary ?? '',
      body: input.body,
      tags: [...input.tags],
      status: input.status,
      publishedAt: input.status === 'published' ? input.publishedAt : null,
      attachments: attachments.attachments,
    },
  };
}

/* === Pontuações elegíveis e projeção pública === */
export const RANKING_GAME_LIMITS = Object.freeze({ snake: 222, flappy: 100000 });
export function validateRankingSubmission(input) {
  if (
    !isRecord(input) ||
    !Object.hasOwn(RANKING_GAME_LIMITS, input.game) ||
    !Number.isSafeInteger(input.score) ||
    input.score < 1 ||
    input.score > RANKING_GAME_LIMITS[input.game] ||
    typeof input.alias !== 'string' ||
    !/^[\p{L}\p{N} _-]{2,24}$/u.test(input.alias.trim()) ||
    (input.submissionId !== undefined && !validId(input.submissionId))
  )
    return contractError('INVALID_RANKING_SUBMISSION');
  return {
    ok: true,
    data: {
      game: input.game,
      alias: input.alias.trim(),
      score: input.score,
      ...(input.submissionId ? { submissionId: input.submissionId } : {}),
    },
  };
}

export function projectPublicScore(record) {
  const valid = validateRankingSubmission(record);
  if (!valid.ok || !validId(record.submissionId) || !validInstant(record.createdAt))
    return contractError('INVALID_PUBLIC_SCORE');
  return {
    ok: true,
    data: {
      game: valid.data.game,
      submissionId: record.submissionId,
      alias: valid.data.alias,
      score: record.score,
      createdAt: record.createdAt,
    },
  };
}
