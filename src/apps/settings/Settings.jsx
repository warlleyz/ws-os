
import { useEffect, useRef, useState } from 'react';
import {
  Accessibility,
  Languages,
  LayoutGrid,
  Monitor,
  Palette,
  RotateCcw,
  Settings2,
  Smartphone,
} from 'lucide-react';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import SettingsNavigation from './SettingsNavigation';
import SettingsSections from './SettingsSections';

import './Settings.css';

/* === CATEGORIAS DE PREFERÊNCIAS === */
const SETTINGS_SECTIONS = [
  {
    id: 'appearance',
    group: 'personalization',
    label: 'Aparência',
    description: 'Temas, cores, papéis de parede e efeitos visuais.',
    icon: Palette,
  },
  {
    id: 'language',
    group: 'personalization',
    label: 'Idioma',
    description: 'Idioma de exibição do WS OS.',
    icon: Languages,
  },
  {
    id: 'accessibility',
    group: 'personalization',
    label: 'Acessibilidade',
    description: 'Preferências de movimento, transparência e desempenho.',
    icon: Accessibility,
  },
  {
    id: 'desktop',
    group: 'environment',
    label: 'Área de Trabalho',
    description: 'Comportamento do ambiente Desktop.',
    icon: Monitor,
  },
  {
    id: 'widgets',
    group: 'environment',
    label: 'Widgets',
    description: 'Visibilidade, tamanho e opções dos widgets.',
    icon: LayoutGrid,
  },
  {
    id: 'mobile',
    group: 'environment',
    label: 'Mobile',
    description: 'Organização e aparência em dispositivos móveis.',
    icon: Smartphone,
  },
  {
    id: 'reset',
    group: 'system',
    label: 'Restaurar configurações',
    description: 'Recupere as preferências originais do sistema.',
    icon: RotateCcw,
  },
];

/* === ENTRADA DO APLICATIVO === */
export default function Settings({ instance }) {
  return (
    <SettingsView
      key={instance?.navigationRequestId ?? 0}
      initialSection={instance?.params?.section}
    />
  );
}

/* === PAINEL DE CONFIGURAÇÕES === */
function SettingsView({ initialSection }) {
  useLocale();

  const [activeSection, setActiveSection] = useState(() => {
    const exists = SETTINGS_SECTIONS.some(
      (section) => section.id === initialSection,
    );

    return exists ? initialSection : 'appearance';
  });

  const contentRef = useRef(null);

  const currentSection =
    SETTINGS_SECTIONS.find(
      (section) => section.id === activeSection,
    ) ?? SETTINGS_SECTIONS[0];

  const SectionIcon = currentSection.icon;

  /* === NAVEGAÇÃO ENTRE SEÇÕES === */
  function navigateTo(sectionId) {
    if (sectionId === activeSection) return;

    setActiveSection(sectionId);

    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }

  /* === ACESSO POR ATALHOS EXTERNOS === */
  useEffect(() => {
    if (initialSection) {
      contentRef.current?.focus({ preventScroll: true });
    }
  }, [initialSection]);

  return (
    <div className="ws-settings">
      {/* === BARRA SUPERIOR === */}
      <header className="ws-settings__header">
        <div className="ws-settings__brand-icon" aria-hidden="true">
          <Settings2 size={20} strokeWidth={1.8} />
        </div>

        <div className="ws-settings__brand">
          <h2>{t('Configurações')}</h2>
          <p>{t('Preferências do sistema')}</p>
        </div>

        <span className="ws-settings__brand-tag">WS OS</span>
      </header>

      {/* === CORPO DO APLICATIVO === */}
      <div className="ws-settings__layout">
        <SettingsNavigation
          sections={SETTINGS_SECTIONS}
          activeSection={activeSection}
          onNavigate={navigateTo}
        />

        <main
          ref={contentRef}
          className="ws-settings__content"
          role="region"
          aria-label={t(currentSection.label)}
          tabIndex={-1}
        >
          <div className="ws-settings__content-inner">
            {/* === TÍTULO DA SEÇÃO ATIVA === */}
            <header className="ws-settings__section-heading">
              <div className="ws-settings__section-heading-copy">
                <span className="ws-settings__section-overline">
                  {currentSection.group === 'personalization'
                    ? t('Personalização')
                    : currentSection.group === 'environment'
                      ? t('Ambiente')
                      : t('Sistema')}
                </span>

                <h3>{t(currentSection.label)}</h3>
                <p>{t(currentSection.description)}</p>
              </div>

              <span className="ws-settings__section-symbol" aria-hidden="true">
                <SectionIcon size={24} strokeWidth={1.5} />
              </span>
            </header>

            {/* === FUNCIONALIDADES EXISTENTES === */}
            <SettingsSections
              key={activeSection}
              activeSection={activeSection}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
