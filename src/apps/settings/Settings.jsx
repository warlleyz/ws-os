import { Accessibility, Languages, Monitor, Palette, RotateCcw, Smartphone } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import SettingsNavigation from './SettingsNavigation';
import SettingsSections from './SettingsSections';

import './Settings.css';

const SETTINGS_SECTIONS = [
  {
    id: 'appearance',
    label: 'Aparência',
    description: 'Escolha o tema visual do sistema.',
    icon: Palette,
  },
  {
    id: 'language',
    label: 'Idioma',
    description: 'Selecione o idioma da interface.',
    icon: Languages,
  },
  {
    id: 'accessibility',
    label: 'Acessibilidade',
    description: 'Ajuste os efeitos visuais e o desempenho da interface.',
    icon: Accessibility,
  },
  {
    id: 'desktop',
    label: 'Área de Trabalho',
    description: 'Personalize o comportamento da interface Desktop.',
    icon: Monitor,
  },
  {
    id: 'widgets',
    label: 'Widgets',
    description: 'Gerencie os widgets disponíveis no Desktop.',
    icon: Monitor,
  },
  {
    id: 'mobile',
    label: 'Mobile',
    description: 'Personalize a apresentação dos aplicativos no Mobile.',
    icon: Smartphone,
  },
  {
    id: 'reset',
    label: 'Restaurar configurações',
    description:
      'Restaure as preferências visuais e de interface para os valores originais da WS OS.',
    icon: RotateCcw,
  },
];

export default function Settings({ instance }) {
  return (
    <SettingsView
      key={instance?.navigationRequestId ?? 0}
      initialSection={instance?.params?.section}
    />
  );
}

function SettingsView({ initialSection }) {
  useLocale();

  const [activeSection, setActiveSection] = useState(() => {
    const requested = initialSection;

    return SETTINGS_SECTIONS.some((section) => section.id === requested) ? requested : 'appearance';
  });
  const contentRef = useRef(null);

  const currentSection =
    SETTINGS_SECTIONS.find((section) => section.id === activeSection) ?? SETTINGS_SECTIONS[0];

  function navigateTo(sectionId) {
    setActiveSection(sectionId);

    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
      contentRef.current.focus({ preventScroll: true });
    }
  }

  useEffect(() => {
    if (initialSection) contentRef.current?.focus({ preventScroll: true });
  }, [initialSection]);

  return (
    <div className="ws-settings">
      <header className="ws-settings__header">
        <span className="ws-settings__brand-icon" aria-hidden="true">
          <SlidersHorizontal size={22} strokeWidth={1.8} />
        </span>

        <div className="ws-settings__brand">
          <h2>{t('Configurações')}</h2>
          <p>{t('Personalize sua experiência na WS OS.')}</p>
        </div>

        <span className="ws-settings__brand-tag">WS OS</span>
      </header>

      <div className="ws-settings__layout">
        <SettingsNavigation
          sections={SETTINGS_SECTIONS}
          activeSection={activeSection}
          onNavigate={navigateTo}
        />

        <div
          ref={contentRef}
          className="ws-settings__content"
          tabIndex={0}
          role="region"
          aria-label={t(currentSection.label)}
        >
          <div className="ws-settings__content-inner">
            <div className="ws-settings__section-heading">
              <div>
                <span className="ws-settings__eyebrow">WS OS / {t('Configurações')}</span>
                <h3>{t(currentSection.label)}</h3>
                <p>{t(currentSection.description)}</p>
              </div>
            </div>

            <SettingsSections key={activeSection} activeSection={activeSection} />
          </div>
        </div>
      </div>
    </div>
  );
}
