import { useEffect, useRef, useState } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { portfolio, contentText } from '../../content/portfolioContent';
import { safeContactUrl } from '../../shared/utils/urls';
import {
  sendContact,
  isContactConfigured,
  prepareContactRequest,
  isContactResultUncertain,
  contactErrorMessage,
} from '../../services/contactService';
import WallyTurnstile from '../../features/wally/WallyTurnstile';
import useUnsavedChanges from '../../shared/hooks/useUnsavedChanges';
import '../../styles/apps.css';
import './Contact.css';
export default function Contact({ instance }) {
  const locale = useLocale();
  /* === Estado privado da instância; nenhum rascunho vai ao armazenamento persistente === */
  function emptyForm() {
    return {
      name: '',
      email: '',
      message: '',
      kind: 'message',
      requestedAt: '',
      website: '',
      consent: false,
      startedAt: Date.now(),
    };
  }
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [token, setToken] = useState(null);
  const [verification, setVerification] = useState(0);
  const requestRef = useRef(null);
  const pendingRef = useRef(null);
  const mounted = useRef(false);
  const busy = status === 'sending';
  const locked = busy || status === 'uncertain';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  useEffect(() => {
    mounted.current = true;
    const request = requestRef;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);
  useUnsavedChanges(
    instance?.id,
    Boolean(
      form.name ||
      form.email ||
      form.message ||
      form.requestedAt ||
      form.consent ||
      form.kind === 'schedule' ||
      busy ||
      status === 'uncertain',
    ),
  );
  function field(name, value) {
    if (locked || requestRef.current) return;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage('');
    setReceipt(null);
  }
  /* ----- Retry conserva o pedido e a chave, trocando somente o desafio consumido ----- */
  async function submit(event) {
    event.preventDefault();
    if (requestRef.current || !token || !isContactConfigured()) return;
    setMessage('');
    let controller;
    try {
      if (!pendingRef.current) pendingRef.current = prepareContactRequest(form);
      controller = new AbortController();
      requestRef.current = controller;
      setStatus('sending');
      const result = await sendContact(pendingRef.current, {
        signal: controller.signal,
        turnstileToken: token,
      });
      if (!mounted.current || controller.signal.aborted) return;
      pendingRef.current = null;
      setStatus('success');
      setReceipt(result);
      setMessage(
        result.kind === 'schedule'
          ? 'Solicitação enviada para análise. O horário não está confirmado.'
          : 'Operação concluída.',
      );
      setForm(emptyForm());
    } catch (error) {
      if (!mounted.current || controller?.signal.aborted) return;
      const uncertain = Boolean(
        pendingRef.current &&
        controller &&
        (status === 'uncertain' || isContactResultUncertain(error)),
      );
      if (!uncertain) pendingRef.current = null;
      setStatus(uncertain ? 'uncertain' : 'error');
      setMessage(controller ? contactErrorMessage(error) : error.message);
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      if (mounted.current) {
        setToken(null);
        setVerification((value) => value + 1);
      }
    }
  }
  return (
    <article className="desktop-window__content ws-app ws-contact">
      <h2>{t('Contato')}</h2>
      <p>{t('Envie uma mensagem profissional ou solicite um horário para análise.')}</p>
      <ul>
        {portfolio.contact.links
          .filter((item) => safeContactUrl(item.url))
          .map((item) => (
            <li key={item.url}>
              <a href={safeContactUrl(item.url)} target="_blank" rel="noopener noreferrer">
                {contentText(item.label, locale)}
              </a>
            </li>
          ))}
      </ul>
      {!isContactConfigured() && (
        <p role="status">
          {t('O envio ainda não foi configurado. Utilize os canais profissionais disponíveis.')}
        </p>
      )}
      <form onSubmit={submit} className="ws-contact__form" aria-busy={busy}>
        <fieldset disabled={busy} className="ws-contact__fields">
          <legend className="ws-contact__legend">{t('Tipo de contato')}</legend>
          <label>
            {t('Nome')}
            <input
              readOnly={status === 'uncertain'}
              autoComplete="name"
              value={form.name}
              onChange={(event) => field('name', event.target.value)}
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <label>
            {t('E-mail')}
            <input
              readOnly={status === 'uncertain'}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => field('email', event.target.value)}
              maxLength={254}
              required
            />
          </label>
          <label>
            {t('Tipo de contato')}
            <select
              disabled={locked}
              value={form.kind}
              onChange={(event) => field('kind', event.target.value)}
            >
              <option value="message">{t('Mensagem')}</option>
              <option value="schedule">{t('Solicitar agendamento')}</option>
            </select>
          </label>
          {form.kind === 'schedule' && (
            <>
              <label>
                {t('Horário desejado no seu fuso local')}
                <input
                  readOnly={status === 'uncertain'}
                  type="datetime-local"
                  value={form.requestedAt}
                  onChange={(event) => field('requestedAt', event.target.value)}
                  required
                />
              </label>
              <small>{timezone}</small>
              <p>{t('Uma solicitação não confirma reunião nem cria evento público.')}</p>
            </>
          )}
          <label>
            {t('Mensagem')}
            <textarea
              readOnly={status === 'uncertain'}
              rows={6}
              minLength={10}
              maxLength={5000}
              value={form.message}
              onChange={(event) => field('message', event.target.value)}
              required
            />
          </label>
          <label className="ws-contact__honeypot" aria-hidden="true">
            Website
            <input
              readOnly={status === 'uncertain'}
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => field('website', event.target.value)}
            />
          </label>
          <label className="ws-contact__consent">
            <input
              readOnly={status === 'uncertain'}
              disabled={locked}
              type="checkbox"
              checked={form.consent}
              onChange={(event) => field('consent', event.target.checked)}
              required
            />
            {t('Concordo em enviar estes dados para receber uma resposta.')}
          </label>
        </fieldset>
        <div className="ws-contact__verification">
          <WallyTurnstile key={verification} onTokenChange={setToken} action="public-write" />
        </div>
        <button type="submit" disabled={busy || !token || !isContactConfigured()}>
          {t(busy ? 'Enviando…' : status === 'uncertain' ? 'Tentar novamente' : 'Enviar mensagem')}
        </button>
        <p role={status === 'error' || status === 'uncertain' ? 'alert' : 'status'}>{t(message)}</p>
        {receipt && (
          <section className="ws-contact__receipt" aria-label={t('Solicitações')}>
            <p>
              {t('Solicitações')}: <strong>{receipt.requestId}</strong>
            </p>
            <p>
              {t('E-mail')}:{' '}
              {t(
                receipt.emailConfirmed
                  ? 'Mensagem enviada e confirmada pelo serviço.'
                  : 'Envio não confirmado. Confira antes de reenviar para evitar duplicidade.',
              )}
            </p>
            <p>{t('Uma solicitação não confirma reunião nem cria evento público.')}</p>
          </section>
        )}
      </form>
    </article>
  );
}
