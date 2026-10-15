import { useEffect, useRef, useState } from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { portfolio, contentText } from '../../content/portfolioContent';
import { safeExternalUrl } from '../../shared/utils/urls';
import { sendContact, isContactConfigured } from '../../services/contactService';
import useUnsavedChanges from '../../shared/hooks/useUnsavedChanges';
import '../../styles/apps.css';
import './Contact.css';
export default function Contact({ instance }) {
  const locale = useLocale();
  const [form, setForm] = useState(() => ({
    name: '',
    email: '',
    message: '',
    kind: 'message',
    requestedAt: '',
    website: '',
    consent: false,
    startedAt: Date.now(),
  }));
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const requestRef = useRef(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  useUnsavedChanges(instance?.id, Boolean(form.name || form.email || form.message));
  function field(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }
  async function submit(event) {
    event.preventDefault();
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus('sending');
    setMessage('');
    try {
      const result = await sendContact(form, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setStatus('success');
      setMessage(
        result.kind === 'schedule'
          ? 'Solicitação enviada para análise. O horário não está confirmado.'
          : 'Mensagem enviada e confirmada pelo serviço.',
      );
      setForm((current) => ({ ...current, name: '', email: '', message: '', consent: false }));
    } catch (error) {
      if (!controller.signal.aborted) {
        setStatus('error');
        setMessage(error.message);
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }
  return (
    <article className="desktop-window__content ws-app ws-contact">
      <h2>{t('Contato')}</h2>
      <p>{t('Envie uma mensagem profissional ou solicite um horário para análise.')}</p>
      <ul>
        {portfolio.contact.links
          .filter((item) => safeExternalUrl(item.url))
          .map((item) => (
            <li key={item.url}>
              <a href={safeExternalUrl(item.url)} target="_blank" rel="noopener noreferrer">
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
      <form onSubmit={submit} className="ws-contact__form">
        <label>
          {t('Nome')}
          <input
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
          <select value={form.kind} onChange={(event) => field('kind', event.target.value)}>
            <option value="message">{t('Mensagem')}</option>
            <option value="schedule">{t('Solicitar agendamento')}</option>
          </select>
        </label>
        {form.kind === 'schedule' && (
          <>
            <label>
              {t('Horário desejado no seu fuso local')}
              <input
                type="datetime-local"
                value={form.requestedAt}
                onChange={(event) => field('requestedAt', event.target.value)}
                required
              />
            </label>
            <p>{t('Uma solicitação não confirma reunião nem cria evento público.')}</p>
          </>
        )}
        <label>
          {t('Mensagem')}
          <textarea
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
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => field('website', event.target.value)}
          />
        </label>
        <label className="ws-contact__consent">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(event) => field('consent', event.target.checked)}
            required
          />
          {t('Concordo em enviar estes dados para receber uma resposta.')}
        </label>
        <p className="ws-app__muted">
          {t(
            'O formulário é enviado ao serviço de e-mail configurado. Nenhum envio ocorre antes de confirmar. Não inclua dados sensíveis.',
          )}
        </p>
        <button type="submit" disabled={status === 'sending' || !isContactConfigured()}>
          {t(status === 'sending' ? 'Enviando…' : 'Enviar mensagem')}
        </button>
        <p role="status">{t(message)}</p>
      </form>
    </article>
  );
}
