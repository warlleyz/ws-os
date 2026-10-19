const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadContract } = require('../helpers/contract-loader.cjs');
const load = (file) => loadContract(path.resolve(__dirname, '../../' + file));
const date = '2026-10-01T12:00:00.000Z';

/* === Solicitações e retenção === */
const request = () => ({
  id: 'request-1',
  type: 'message',
  name: 'Example',
  email: 'example@test.dev',
  message: 'Private message',
  status: 'new',
  createdAt: date,
  updatedAt: date,
  revision: 1,
  idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
});
test('solicitações preservam revisão, retenção de 180 dias e histórico mínimo sem PII', () => {
  const api = load('src/services/privateRequestContract.js');
  const result = api.transitionPrivateRequest(request(), 'completed', 1, {
    now: Date.parse(date),
    actorId: 'admin-1',
  });
  assert.equal(result.ok, true);
  assert.equal(result.data.revision, 2);
  assert.equal(Date.parse(result.data.retentionUntil) - Date.parse(date), 180 * 86400000);
  assert.equal(
    api.isRequestRetentionExpired(result.data, Date.parse(result.data.retentionUntil)),
    true,
  );
  assert.doesNotMatch(JSON.stringify(result.change), /example@test|Private message/);
  assert.equal(
    api.transitionPrivateRequest(result.data, 'archived', 1, { actorId: 'admin-1' }).code,
    'REVISION_CONFLICT',
  );
});
test('agendamento exige fuso e instante futuro e não confirma evento ou reunião', () => {
  const api = load('src/services/privateRequestContract.js');
  const input = {
    ...request(),
    type: 'schedule',
    requestedAt: '2026-10-02T12:00:00.000Z',
    timezone: 'America/Sao_Paulo',
  };
  assert.equal(api.validateRequestInput(input, Date.parse(date)).ok, true);
  assert.equal(
    api.validateRequestInput({ ...input, timezone: 'Invalid/Zone' }, Date.parse(date)).ok,
    false,
  );
  const delivery = api.resolveRequestDelivery({
    requestId: 'one',
    persisted: true,
    email: 'failed',
  });
  assert.equal(delivery.persisted, true);
  assert.equal(delivery.emailConfirmed, false);
  assert.equal(delivery.mayRepeatCreation, false);
  assert.equal(
    api.resolveRequestDelivery({ requestId: 'one', persisted: true, email: 'unknown' })
      .requiresReconciliation,
    true,
  );
});

/* === Conteúdo público e adaptações === */
test('eventos validam horário/fuso, proíbem dados privados e adaptam legado sem inventar revisão', () => {
  const api = load('src/services/publicContentContract.js');
  const event = {
    id: 'event-1',
    title: 'Public',
    allDay: true,
    date: '2026-10-10',
    status: 'published',
    revision: 1,
    createdAt: date,
    updatedAt: date,
  };
  assert.equal(api.validatePublicEvent(event).ok, true);
  assert.equal(
    api.validatePublicEvent({ ...event, email: 'private@test.dev' }).code,
    'PRIVATE_EVENT_DATA',
  );
  assert.equal(api.validatePublicEvent({ ...event, date: '2026-02-30' }).ok, false);
  const legacy = api.adaptLegacyPublicEvent({ id: 'event-1', title: 'Public', date: '2026-10-10' });
  assert.equal(legacy.ok, true);
  assert.equal(legacy.data.allDay, true);
  assert.equal(legacy.data.revision, undefined);
});
test('projetos e demos não concedem embed por URL; publicações respeitam ciclo editorial e anexos', () => {
  const api = load('src/services/publicContentContract.js');
  assert.equal(
    api.validateProject({
      id: 'project',
      name: 'Project',
      technologies: ['JS'],
      demos: [{ id: 'demo', mode: 'embedded', url: 'javascript:alert(1)' }],
    }).ok,
    false,
  );
  const post = {
    id: 'post',
    title: 'Title',
    body: 'Body',
    tags: [],
    status: 'published',
    publishedAt: date,
    attachments: [],
  };
  assert.equal(api.validatePublication(post, { publicOnly: true, now: Date.parse(date) }).ok, true);
  assert.equal(
    api.validatePublication({ ...post, status: 'draft' }, { publicOnly: true }).code,
    'PUBLICATION_NOT_PUBLIC',
  );
  assert.equal(
    api.validatePublication({ ...post, attachments: Array.from({ length: 6 }, () => ({})) }).ok,
    false,
  );
});
test('ranking usa limites por jogo e só projeta campos públicos', () => {
  const api = load('src/services/publicContentContract.js');
  const record = {
    game: 'snake',
    submissionId: 'score-1',
    alias: 'Player',
    score: 222,
    createdAt: date,
    visitor_hash: 'private',
    turnstileToken: 'secret',
  };
  assert.equal(api.validateRankingSubmission({ ...record, score: 223 }).ok, false);
  const result = api.projectPublicScore(record);
  assert.equal(result.ok, true);
  assert.doesNotMatch(JSON.stringify(result), /private|secret/);
});

/* === Preferências versionáveis e reset seguro === */
test('preferências adaptam formatos legados sem escrita e codificam nas mesmas chaves', () => {
  const api = load('src/core/preferenceContract.js');
  for (const raw of ['list', '"list"']) {
    const result = api.adaptStoredPreference('ws-os:files-view', raw);
    assert.equal(result.ok, true);
    assert.equal(result.requiresWrite, false);
    assert.equal(api.encodeStoredPreference(result.record).key, 'ws-os:files-view');
  }
  assert.equal(api.adaptStoredPreference('ws-os:theme', 'light').record.value, 'light');
  assert.equal(
    api.adaptStoredPreference('ws-os:appearance', '{"schemaVersion":99,"value":{}}').code,
    'UNSUPPORTED_PREFERENCE_VERSION',
  );
  assert.equal(api.createPreferenceRecord('ws-os:session', { token: 'secret' }).ok, false);
  assert.equal(
    api.createPreferenceRecord('ws-os:files-location', { space: 'personal', folderId: () => {} })
      .ok,
    false,
  );
});
test('reset seleciona somente ações da categoria e recusa alvos de dados pessoais', () => {
  const api = load('src/core/preferenceContract.js');
  const plan = api.createPreferenceResetPlan(['language']);
  assert.deepEqual(Array.from(plan.actions), ['locale']);
  assert.equal(api.createPreferenceResetPlan(['personal-files']).ok, false);
  assert.equal(api.createPreferenceResetPlan().preserves.includes('session'), true);
});

/* === Datas reais e retenção não prorrogada por arquivamento === */
test('datas impossíveis são rejeitadas e arquivar não amplia retenção de solicitação concluída', () => {
  const validation = load('src/shared/utils/contractValidation.js');
  assert.equal(validation.validInstant('2026-02-30T12:00:00Z'), false);
  const api = load('src/services/privateRequestContract.js');
  const completed = api.transitionPrivateRequest(request(), 'completed', 1, {
    now: Date.parse(date),
    actorId: 'admin',
  }).data;
  const archived = api.transitionPrivateRequest(completed, 'archived', 2, {
    now: Date.parse(date) + 86400000,
    actorId: 'admin',
  });
  assert.equal(archived.ok, true);
  assert.equal(archived.data.retentionUntil, completed.retentionUntil);
  assert.equal(api.validatePrivateRequest(archived.data).ok, true);
});
