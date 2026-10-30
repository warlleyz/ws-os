import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Gamepad2,
  GitBranch,
  BriefcaseBusiness,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
} from 'lucide-react';

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

/* === Configuração === */
const CHANNELS = [
  {
    label: 'GitHub',
    icon: GitBranch,
    description: 'Projetos, código e repositórios.',
  },
  {
    label: 'LinkedIn',
    icon: BriefcaseBusiness,
    description: 'Perfil profissional e conexões.',
  },
  {
    label: 'WhatsApp',
    icon: MessageCircle,
    description: 'Contato direto pelo WhatsApp.',
  },
  {
    label: 'Discord',
    icon: Gamepad2,
    description: 'Conversas e comunidades.',
  },
];

/* === Utilitários === */
function createEmptyForm() {
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

function contactLinks(locale) {
  const links = portfolio.contact?.links ?? [];

  return CHANNELS.map((channel) => {
    const record = links.find(
      (item) =>
        contentText(item.label, locale).toLocaleLowerCase() === channel.label.toLocaleLowerCase(),
    );

    const url = record ? safeContactUrl(record.url) : null;

    return url
      ? {
          ...channel,
          url,
        }
      : null;
  }).filter(Boolean);
}

function contactEmail() {
  const emailLink = (portfolio.contact?.links ?? []).find((item) => item.label === 'E-mail');

  const url = emailLink ? safeContactUrl(emailLink.url) : null;

  return url?.startsWith('mailto:') ? { url, address: url.slice(7).split('?')[0] } : null;
}

/* === Cabeçalho V2 === */
function ContactHeader() {
  return (
    <header className="ws-contact__hero">
      <div className="ws-contact__hero-copy">
        <span className="ws-contact__eyebrow">WS OS / CONTACT</span>

        <h2>{t('Contato')}</h2>

        <p>{t('Envie uma mensagem profissional.')}</p>
      </div>

      <MessageCircle className="ws-contact__hero-icon" strokeWidth={1.5} aria-hidden="true" />
    </header>
  );
}

/* === Canais profissionais === */
function ContactChannels({ locale }) {
  const channels = contactLinks(locale);
  const email = contactEmail();

  return (
    <section className="ws-contact__channels" aria-label={t('Canais de contato')}>
      <div className="ws-contact__section-heading">
        <div>
          <span className="ws-contact__section-eyebrow">{t('CONEXÕES')}</span>

          <h3>{t('Canais profissionais')}</h3>

          <p>{t('Escolha a plataforma que preferir para entrar em contato.')}</p>
        </div>
      </div>

      {email && (
        <a className="ws-contact__email" href={email.url}>
          <span className="ws-contact__email-icon">
            <Mail size={21} strokeWidth={1.7} aria-hidden="true" />
          </span>

          <span className="ws-contact__email-content">
            <small>{t('E-mail')}</small>
            <strong>{email.address}</strong>
          </span>

          <ArrowUpRight size={19} className="ws-contact__email-arrow" aria-hidden="true" />
        </a>
      )}

      <div className="ws-contact__channel-grid">
        {channels.map((channel) => {
          const Icon = channel.icon;

          return (
            <a
              key={channel.label}
              className="ws-contact__channel"
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${channel.label} — ${t('Abrir em nova aba')}`}
            >
              <div className="ws-contact__channel-top">
                <span className="ws-contact__channel-icon">
                  <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
                </span>

                <ExternalLink
                  size={15}
                  className="ws-contact__channel-external"
                  aria-hidden="true"
                />
              </div>

              <div className="ws-contact__channel-copy">
                <strong>{channel.label}</strong>
                <p>{t(channel.description)}</p>
              </div>

              <span className="ws-contact__channel-action">
                {t('Acessar perfil')}
                <ArrowUpRight size={15} aria-hidden="true" />
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

/* === Aplicativo Contato === */
export default function Contact({ instance }) {
  const locale = useLocale();

  /* ----- Estado do formulário ----- */
  const [form, setForm] = useState(createEmptyForm);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [token, setToken] = useState(null);
  const [verification, setVerification] = useState(0);

  /* ----- Controle de requisições ----- */
  const requestRef = useRef(null);
  const pendingRef = useRef(null);
  const mounted = useRef(false);

  const busy = status === 'sending';
  const uncertain = status === 'uncertain';
  const locked = busy || uncertain;
  const configured = isContactConfigured();

  /* ----- Limpeza e cancelamento ----- */
  useEffect(() => {
    mounted.current = true;

    const request = requestRef;

    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  /* ----- Proteção de alterações não salvas ----- */
  useUnsavedChanges(
    instance?.id,
    Boolean(form.name || form.email || form.message || form.consent || busy || uncertain),
  );

  /* ----- Atualização dos campos ----- */
  function updateField(name, value) {
    if (locked || requestRef.current) return;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage('');
    setReceipt(null);
  }

  /* === Envio seguro === */
  async function submit(event) {
    event.preventDefault();

    if (requestRef.current || !token || !isContactConfigured()) {
      return;
    }

    setMessage('');

    let controller;

    try {
      /* ----- Preservar a chave de idempotência em tentativas incertas ----- */
      if (!pendingRef.current) {
        pendingRef.current = prepareContactRequest({
          ...form,
          kind: 'message',
          requestedAt: '',
        });
      }

      controller = new AbortController();
      requestRef.current = controller;
      setStatus('sending');

      const result = await sendContact(pendingRef.current, {
        signal: controller.signal,
        turnstileToken: token,
      });

      if (!mounted.current || controller.signal.aborted) {
        return;
      }

      pendingRef.current = null;

      setStatus('success');
      setReceipt(result);
      setMessage('Operação concluída.');
      setForm(createEmptyForm());
    } catch (error) {
      if (!mounted.current || controller?.signal.aborted) {
        return;
      }

      const resultUncertain = Boolean(
        pendingRef.current && controller && (uncertain || isContactResultUncertain(error)),
      );

      if (!resultUncertain) {
        pendingRef.current = null;
      }

      setStatus(resultUncertain ? 'uncertain' : 'error');

      setMessage(
        controller
          ? contactErrorMessage(error)
          : error instanceof Error
            ? error.message
            : 'Não foi possível enviar a mensagem.',
      );
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
      }

      if (mounted.current) {
        setToken(null);
        setVerification((value) => value + 1);
      }
    }
  }

  return (
    <article className="desktop-window__content ws-app ws-contact">
      <ContactHeader />

      <ContactChannels locale={locale} />

      {/* === Formulário de contato === */}
      <section className="ws-contact__message-section">
        <div className="ws-contact__section-heading">
          <div>
            <span className="ws-contact__section-eyebrow">{t('MENSAGEM DIRETA')}</span>

            <h3>{t('Enviar mensagem')}</h3>

            <p>{t('Preencha os campos abaixo para enviar uma mensagem profissional.')}</p>
          </div>

          <span className="ws-contact__section-icon">
            <Send size={19} strokeWidth={1.7} aria-hidden="true" />
          </span>
        </div>

        {!configured && (
          <div className="ws-contact__notice" role="status">
            <Mail size={18} aria-hidden="true" />

            <p>
              {t('O envio ainda não foi configurado. Utilize os canais profissionais disponíveis.')}
            </p>
          </div>
        )}

        <form className="ws-contact__form" onSubmit={submit} aria-busy={busy}>
          <fieldset className="ws-contact__fields" disabled={busy}>
            <legend className="ws-contact__legend">{t('Enviar mensagem')}</legend>

            <div className="ws-contact__field-row">
              <label className="ws-contact__field">
                <span>{t('Nome')}</span>

                <input
                  type="text"
                  autoComplete="name"
                  placeholder={t('Seu nome')}
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  readOnly={uncertain}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>

              <label className="ws-contact__field">
                <span>{t('E-mail')}</span>

                <input
                  type="email"
                  autoComplete="email"
                  placeholder={t('seu@email.com')}
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  readOnly={uncertain}
                  maxLength={254}
                  required
                />
              </label>
            </div>

            <label className="ws-contact__field">
              <span>{t('Mensagem')}</span>

              <textarea
                rows={6}
                placeholder={t('Escreva sua mensagem...')}
                value={form.message}
                onChange={(event) => updateField('message', event.target.value)}
                readOnly={uncertain}
                minLength={10}
                maxLength={5000}
                required
              />
            </label>

            {/* ----- Campo invisível de proteção anti-spam ----- */}
            <label className="ws-contact__honeypot" aria-hidden="true">
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => updateField('website', event.target.value)}
                readOnly={uncertain}
              />
            </label>

            {/* ----- Consentimento obrigatório ----- */}
            <label className="ws-contact__consent">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(event) => updateField('consent', event.target.checked)}
                disabled={locked}
                required
              />

              <span>{t('Concordo em enviar estes dados para receber uma resposta.')}</span>
            </label>
          </fieldset>

          {/* === Verificação e envio === */}
          <div className="ws-contact__form-footer">
            <div className="ws-contact__protection">
              <div className="ws-contact__protection-label">
                <ShieldCheck size={16} aria-hidden="true" />
                <span>{t('Verificação de segurança')}</span>
              </div>

              <div className="ws-contact__verification">
                <WallyTurnstile key={verification} onTokenChange={setToken} action="public-write" />
              </div>
            </div>

            <button
              className="ws-contact__submit"
              type="submit"
              disabled={busy || !token || !configured}
            >
              {busy ? (
                t('Enviando…')
              ) : uncertain ? (
                t('Tentar novamente')
              ) : (
                <>
                  <Send size={16} aria-hidden="true" />
                  {t('Enviar mensagem')}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </>
              )}
            </button>
          </div>

          {/* === Feedback da operação === */}
          {message && (
            <div
              className={['ws-contact__feedback', `ws-contact__feedback--${status}`].join(' ')}
              role={status === 'error' || uncertain ? 'alert' : 'status'}
            >
              {status === 'success' && <CheckCircle2 size={18} aria-hidden="true" />}

              <p>{t(message)}</p>
            </div>
          )}

          {/* ----- Comprovante de solicitação ----- */}
          {receipt && (
            <section className="ws-contact__receipt" aria-label={t('Solicitações')}>
              <div className="ws-contact__receipt-heading">
                <CheckCircle2 size={18} aria-hidden="true" />

                <strong>{t('Solicitações')}</strong>
              </div>

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
            </section>
          )}
        </form>
      </section>
    </article>
  );
}
