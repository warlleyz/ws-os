import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Moon, Sun } from 'lucide-react';

import { useTheme, setTheme } from '../../core/themeManager';
import { useAppearance, setAppearance, APPEARANCE_OPTIONS } from '../../core/appearanceManager';
import { useWallpaper, setWallpaper, getWallpaperDefinition } from '../../core/wallpaperManager';
import { getOfficialWallpapersByTheme } from '../../core/wallpaperCatalog';
import { translate as t, useLocale, setLocale } from '../../shared/i18n/i18n';

import './WelcomeDialog.css';

/* === Recursos da apresentação === */
/* ----- Identidade do Wally ----- */
const WALLY_IMAGE = `${import.meta.env.BASE_URL}assets/wally/wally-corpo.webp`;

/* ----- Conteúdo dos balões ----- */
const MESSAGES = [
  {
    title: 'Olá! Eu sou o Wally.',
    description: 'Seu assistente dentro do WS OS',
  },
  {
    title: 'Portfólio de Desenvolvimento',
    description:
      'Conheça meus projetos, habilidades e trajetória em Engenharia de Software por meio de um sistema operacional interativo.',
  },
  {
    title: 'Explore o portfólio',
    description:
      'Explore projetos, conheça o desenvolvedor e descubra as funcionalidades do WS OS.',
  },
];

/* ----- Cores disponíveis ----- */
const ACCENTS = [
  { id: 'blue', name: 'Azul', color: '#378ce4' },
  { id: 'green', name: 'Verde', color: '#16a34a' },
  { id: 'violet', name: 'Violeta', color: '#8b5cf6' },
].filter((item) => APPEARANCE_OPTIONS.accent.includes(item.id));

/* === Bandeiras dos idiomas === */
/* ----- Bandeira brasileira ----- */
function BrazilFlag() {
  return (
    <svg viewBox="0 0 32 22" aria-hidden="true">
      <rect width="32" height="22" rx="3" fill="#159447" />
      <path d="M16 2.5 29 11 16 19.5 3 11Z" fill="#FFDF3D" />
      <circle cx="16" cy="11" r="5.2" fill="#264A9B" />
      <path d="M11 9.5Q16 7 21 10" fill="none" stroke="white" strokeWidth="1.15" />
    </svg>
  );
}

/* ----- Bandeira do Reino Unido ----- */
function UnitedKingdomFlag() {
  return (
    <svg viewBox="0 0 32 22" aria-hidden="true">
      <defs>
        <clipPath id="ws-welcome-uk-clip">
          <rect width="32" height="22" rx="3" />
        </clipPath>
      </defs>
      <g clipPath="url(#ws-welcome-uk-clip)">
        <rect width="32" height="22" fill="#153B83" />
        <path d="M-3 -2 35 24M35 -2 -3 24" stroke="white" strokeWidth="6" />
        <path d="M-3 -2 35 24M35 -2 -3 24" stroke="#D6273A" strokeWidth="2.4" />
        <path d="M13 0h6v22h-6zM0 8h32v6H0z" fill="white" />
        <path d="M14.5 0h3v22h-3zM0 9.5h32v3H0z" fill="#D6273A" />
      </g>
    </svg>
  );
}

/* === Janela de boas-vindas === */
export default function WelcomeDialog({ onClose }) {
  const theme = useTheme();
  const locale = useLocale();
  const appearance = useAppearance();
  const wallpaper = useWallpaper('desktop');

  const [step, setStep] = useState(0);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);

  const availableWallpapers = getOfficialWallpapersByTheme(theme);

  /* ----- Gerenciamento do foco ----- */
  useEffect(() => {
    const previous = document.activeElement;

    return () => {
      if (previous instanceof HTMLElement && previous !== document.body && previous.isConnected) {
        previous.focus();
      } else {
        document.querySelector('#ws-mobile, .taskbar__menu-button, #ws-desktop')?.focus();
      }
    };
  }, []);

  /* ----- Foco e rolagem entre etapas ----- */
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    dialogRef.current?.scrollTo({ top: 0 });
  }, [step]);

  /* ----- Navegação pelo teclado ----- */
  function handleKeyDown(event) {
    event.stopPropagation();

    /* ----- Impedir fechamento pelo teclado ----- */
    if (event.key === 'Escape') {
      event.preventDefault();
      return;
    }

    if (event.key !== 'Tab') return;

    const controls = Array.from(
      dialogRef.current?.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]') ?? [],
    );

    const first = controls[0];
    const last = controls.at(-1);

    if (!first || !last) {
      event.preventDefault();
      return;
    }

    const activeIndex = controls.indexOf(document.activeElement);

    /* ----- Navegação a partir do título ----- */
    if (document.activeElement === headingRef.current) {
      event.preventDefault();

      if (event.shiftKey) {
        last.focus();
      } else {
        first.focus();
      }

      return;
    }

    /* ----- Contenção do foco ----- */
    if (event.shiftKey && activeIndex <= 0) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (activeIndex === -1 || activeIndex === controls.length - 1)) {
      event.preventDefault();
      first.focus();
    }
  }

  /* === Renderização === */
  return (
    <div className="ws-welcome-backdrop">
      <section
        ref={dialogRef}
        className="ws-welcome"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ws-welcome-title"
        onKeyDown={handleKeyDown}
      >
        {/* === Cabeçalho === */}
        <header className="ws-welcome__header">
          <strong className="ws-welcome__brand">WS OS</strong>

          <div className="ws-welcome__progress" aria-label={`${step + 1}/2`}>
            <span className={step === 0 ? 'is-active' : ''} />
            <span className={step === 1 ? 'is-active' : ''} />
            <small>{`0${step + 1} / 02`}</small>
          </div>
        </header>

        {/* === Primeira etapa: apresentação === */}
        {step === 0 && (
          <div className="ws-welcome__presentation">
            {/* ----- Identidade do assistente ----- */}
            <div className="ws-welcome__mascot">
              <img src={WALLY_IMAGE} alt="" className="ws-welcome__mascot-image" />
              <span className="ws-welcome__mascot-name">WALLY</span>
            </div>

            {/* ----- Introdução e balões ----- */}
            <div className="ws-welcome__presentation-content">
              <span className="ws-welcome__eyebrow">{t('Seu assistente dentro do WS OS')}</span>

              <h1 id="ws-welcome-title" ref={headingRef} tabIndex={-1}>
                {t('Bem-vindo à WS OS')}
              </h1>

              <div className="ws-welcome__messages">
                {MESSAGES.map((message, index) => (
                  <div className="ws-welcome__bubble" key={message.title}>
                    <span className="ws-welcome__message-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <strong>{t(message.title)}</strong>
                      <p>{t(message.description)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <footer className="ws-welcome__actions ws-welcome__actions--split">
                <button
                  type="button"
                  className="ws-welcome__back"
                  onClick={onClose}
                >
                  {t('Pular apresentação')}
                </button>

                <button
                  type="button"
                  className="ws-welcome__primary"
                  onClick={() => setStep(1)}
                >
                  {t('Próximo')}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* === Segunda etapa: personalização === */}
        {step === 1 && (
          <div className="ws-welcome__customization">
            {/* ----- Apresentação das preferências ----- */}
            <div className="ws-welcome__intro">
              <span className="ws-welcome__eyebrow">{t('Personalize sua experiência')}</span>

              <h1 id="ws-welcome-title" ref={headingRef} tabIndex={-1}>
                {t('Personalize sua experiência na WS OS.')}
              </h1>

              <p>{t('Escolha o tema visual do sistema.')}</p>
            </div>

            {/* === Tema e idioma === */}
            <div className="ws-welcome__preferences">

              {/* ----- Seleção de tema ----- */}
              <fieldset className="ws-welcome__field">
                <legend>{t('Tema do sistema')}</legend>

                <div className="ws-welcome__options">
                  {[
                    { id: 'dark', name: 'Escuro', Icon: Moon },
                    { id: 'light', name: 'Claro', Icon: Sun },
                  ].map(({ id, name, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      className="ws-welcome__option"
                      aria-pressed={theme === id}
                      onClick={() => setTheme(id)}
                    >
                      <Icon size={21} aria-hidden="true" />
                      <span>{t(name)}</span>
                      {theme === id && (
                        <Check className="ws-welcome__check" size={16} aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* ----- Seleção de idioma ----- */}
              <fieldset className="ws-welcome__field">
                <legend>{t('Idioma do sistema')}</legend>

                <div className="ws-welcome__options">
                  <button
                    type="button"
                    className="ws-welcome__option"
                    aria-pressed={locale === 'pt-BR'}
                    onClick={() => setLocale('pt-BR')}
                  >
                    <span className="ws-welcome__flag">
                      <BrazilFlag />
                    </span>
                    <span>Português (BR)</span>
                    {locale === 'pt-BR' && (
                      <Check className="ws-welcome__check" size={16} aria-hidden="true" />
                    )}
                  </button>

                  <button
                    type="button"
                    className="ws-welcome__option"
                    aria-pressed={locale === 'en'}
                    onClick={() => setLocale('en')}
                  >
                    <span className="ws-welcome__flag">
                      <UnitedKingdomFlag />
                    </span>
                    <span>English</span>
                    {locale === 'en' && (
                      <Check className="ws-welcome__check" size={16} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </fieldset>
            </div>

            {/* === Cores de destaque === */}
            <fieldset className="ws-welcome__field">
              <legend>{t('Cor de destaque')}</legend>

              <div className="ws-welcome__accent-options">
                {ACCENTS.map((accent) => (
                  <button
                    key={accent.id}
                    type="button"
                    className="ws-welcome__accent-option"
                    aria-pressed={appearance.accent === accent.id}
                    onClick={() => setAppearance({ accent: accent.id })}
                  >
                    <span
                      className="ws-welcome__color"
                      style={{ backgroundColor: accent.color }}
                      aria-hidden="true"
                    />
                    <span>{t(accent.name)}</span>
                    {appearance.accent === accent.id && <Check size={16} aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* === Wallpapers oficiais === */}
            <fieldset className="ws-welcome__field">
              <legend>{t('Papel de parede do Desktop')}</legend>

              <div className="ws-welcome__wallpapers">
                {availableWallpapers.map((item) => {
                  const selected = wallpaper === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="ws-welcome__wallpaper-option"
                      aria-pressed={selected}
                      onClick={() => setWallpaper(item.id, 'desktop', theme)}
                    >
                      <span
                        className="ws-welcome__wallpaper-preview"
                        style={{
                          background: getWallpaperDefinition(item.id, 'desktop', theme).background,
                        }}
                        aria-hidden="true"
                      >
                        {selected && <Check size={18} />}
                      </span>

                      <span>{t(item.name)}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* === Navegação final === */}
            <footer className="ws-welcome__actions ws-welcome__actions--split">
              <button type="button" className="ws-welcome__back" onClick={() => setStep(0)}>
                <ArrowLeft size={17} aria-hidden="true" />
                {t('Voltar')}
              </button>

              <button type="button" className="ws-welcome__primary" onClick={onClose}>
                {t('Começar')}
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </footer>
          </div>
        )}
      </section>
    </div>
  );
}