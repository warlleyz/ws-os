
import { useState } from 'react';
import {
    Palette,
    Languages,
    Accessibility,
    Monitor,
    Moon,
    Sun,
} from 'lucide-react';
import { RotateCcw } from 'lucide-react';

import { Smartphone } from 'lucide-react';

import {
    useMobilePreferences,
    setMobilePreferences,
} from '../../core/mobilePreferences';

import {
    useAppearance,
    setAppearance,
} from '../../core/appearanceManager';

import { translate as t, useLocale, setLocale } from '../../shared/i18n/i18n';
import { useTheme, setTheme } from '../../core/themeManager';
import {
    useAccessibility,
    setAccessibility,
} from '../../core/effectsManager';
import { useSystem } from '../../core/useSystem';

import './Settings.css';

import { PanelBottom } from 'lucide-react';

import {
    useTaskbarAutoHide,
    setTaskbarAutoHide,
} from '../../core/taskbarPreferences';

const sections = [
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'language', label: 'Idioma', icon: Languages },
    { id: 'accessibility', label: 'Acessibilidade', icon: Accessibility },
    { id: 'desktop', label: 'Área de Trabalho', icon: PanelBottom },
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
    {
        id: 'reset',
        label: 'Restaurar configurações',
        icon: RotateCcw,
    },
];

export default function Settings() {
    const locale = useLocale();
    const theme = useTheme();
    const accessibility = useAccessibility();
    const appearance = useAppearance();
    const autoHideTaskbar = useTaskbarAutoHide();
    const mobilePreferences = useMobilePreferences();
    const { notify } = useSystem();

    const [activeSection, setActiveSection] = useState('appearance');

    function reportPersistence(saved) {
        if (saved) return;

        notify({
            title: 'Preferência não salva',
            message:
                'Não foi possível salvar esta preferência. Ela continua ativa nesta sessão.',
            type: 'warning',
            source: 'Sistema',
        });
    }

    function changeTheme(nextTheme) {
        reportPersistence(setTheme(nextTheme));
    }

    function changeAppearance(key, value) {
        reportPersistence(setAppearance({ [key]: value }));
    }

    function changeLocale(nextLocale) {
        reportPersistence(setLocale(nextLocale));
    }

    function changeAccessibility(key, checked) {
        reportPersistence(
            setAccessibility({
                ...accessibility,
                [key]: checked,
            }),
        );
    }


    function restoreDefaultSettings() {
        const confirmed = window.confirm(
            t(
                'Deseja restaurar as preferências padrão? Os dados dos aplicativos não serão apagados.',
            ),
        );

        if (!confirmed) return;

        const results = [
            setTheme('dark'),
            setLocale('pt-BR'),
            setAppearance({
                accent: 'blue',
                blur: 'normal',
                transparency: 'default',
            }),
            setAccessibility({
                motion: false,
                transparency: false,
                lowEffects: false,
            }),
            setTaskbarAutoHide(false),
            setMobilePreferences({
                gridDensity: 'default',
            }),
        ];

        if (results.every(Boolean)) {
            notify({
                title: 'Configurações restauradas',
                message: 'As preferências padrão foram aplicadas.',
                type: 'success',
                source: 'Sistema',
            });
        } else {
            notify({
                title: 'Restauração parcialmente concluída',
                message:
                    'As preferências foram aplicadas nesta sessão, mas algumas não puderam ser salvas.',
                type: 'warning',
                source: 'Sistema',
            });
        }
    }


    return (
        <div className="ws-settings">
            <header className="ws-settings__header">
                <Monitor size={24} aria-hidden="true" />

                <div>
                    <h2>{t('Configurações')}</h2>
                    <p>{t('Personalize sua experiência na WS OS.')}</p>
                </div>
            </header>

            <div className="ws-settings__layout">
                <nav
                    className="ws-settings__sidebar"
                    aria-label={t('Seções das configurações')}
                >
                    {sections.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            className={
                                activeSection === id
                                    ? 'ws-settings__navigation-button is-active'
                                    : 'ws-settings__navigation-button'
                            }
                            aria-current={activeSection === id ? 'page' : undefined}
                            onClick={() => setActiveSection(id)}
                        >
                            <Icon size={18} aria-hidden="true" />
                            <span>{t(label)}</span>
                        </button>
                    ))}
                </nav>

                <main className="ws-settings__content">
                    {activeSection === 'appearance' && (
                        <section aria-labelledby="settings-appearance">
                            <h3 id="settings-appearance">{t('Aparência')}</h3>
                            <p>{t('Escolha o tema visual do sistema.')}</p>

                            <div className="ws-settings__theme-grid">
                                {[
                                    { id: 'dark', label: 'Escuro', Icon: Moon },
                                    { id: 'light', label: 'Claro', Icon: Sun },
                                ].map(({ id, label, Icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        className={
                                            theme === id
                                                ? 'ws-settings__theme-option is-active'
                                                : 'ws-settings__theme-option'
                                        }
                                        aria-pressed={theme === id}
                                        onClick={() => changeTheme(id)}
                                    >
                                        <Icon size={24} aria-hidden="true" />
                                        <strong>{t(label)}</strong>
                                        <small>
                                            {theme === id
                                                ? t('Tema ativo')
                                                : t('Selecionar tema')}
                                        </small>
                                    </button>
                                ))}
                            </div>

                            <div className="ws-settings__customization">
                                <h4>{t('Personalização visual')}</h4>

                                <label className="ws-settings__field">
                                    <span>{t('Cor de destaque')}</span>
                                    <select
                                        value={appearance.accent}
                                        onChange={(event) =>
                                            changeAppearance('accent', event.target.value)
                                        }
                                    >
                                        <option value="blue">{t('Azul')}</option>
                                        <option value="violet">{t('Violeta')}</option>
                                        <option value="green">{t('Verde')}</option>
                                    </select>
                                </label>

                                <label className="ws-settings__field">
                                    <span>{t('Intensidade do desfoque')}</span>
                                    <select
                                        value={appearance.blur}
                                        onChange={(event) =>
                                            changeAppearance('blur', event.target.value)
                                        }
                                    >
                                        <option value="off">{t('Desligado')}</option>
                                        <option value="soft">{t('Suave')}</option>
                                        <option value="normal">{t('Normal')}</option>
                                        <option value="strong">{t('Intenso')}</option>
                                    </select>
                                </label>

                                <label className="ws-settings__field">
                                    <span>{t('Transparência')}</span>
                                    <select
                                        value={appearance.transparency}
                                        onChange={(event) =>
                                            changeAppearance('transparency', event.target.value)
                                        }
                                    >
                                        <option value="solid">{t('Sólida')}</option>
                                        <option value="default">{t('Padrão')}</option>
                                        <option value="high">{t('Elevada')}</option>
                                    </select>
                                </label>
                            </div>

                        </section>
                    )}

                    {activeSection === 'language' && (
                        <section aria-labelledby="settings-language">
                            <h3 id="settings-language">{t('Idioma')}</h3>
                            <p>{t('Selecione o idioma da interface.')}</p>

                            <label className="ws-settings__field">
                                <span>{t('Idioma do sistema')}</span>

                                <select
                                    value={locale}
                                    onChange={(event) => changeLocale(event.target.value)}
                                >
                                    <option value="pt-BR">Português (Brasil)</option>
                                    <option value="en">English</option>
                                </select>
                            </label>
                        </section>
                    )}

                    {activeSection === 'accessibility' && (
                        <section aria-labelledby="settings-accessibility">
                            <h3 id="settings-accessibility">{t('Acessibilidade')}</h3>
                            <p>
                                {t('Ajuste os efeitos visuais e o desempenho da interface.')}
                            </p>

                            <div className="ws-settings__options">
                                {[
                                    ['motion', 'Reduzir movimento'],
                                    ['transparency', 'Reduzir transparência'],
                                    ['lowEffects', 'Modo de baixo custo'],
                                ].map(([key, label]) => (
                                    <label key={key} className="ws-settings__toggle">
                                        <span>{t(label)}</span>
                                        <input
                                            type="checkbox"
                                            checked={accessibility[key]}
                                            onChange={(event) =>
                                                changeAccessibility(key, event.target.checked)
                                            }
                                        />
                                    </label>
                                ))}
                            </div>
                        </section>
                    )}


                    {activeSection === 'desktop' && (
                        <section aria-labelledby="settings-desktop">
                            <h3 id="settings-desktop">
                                {t('Área de Trabalho')}
                            </h3>

                            <p>
                                {t('Personalize o comportamento da interface Desktop.')}
                            </p>

                            <div className="ws-settings__options">
                                <label className="ws-settings__toggle">
                                    <span>
                                        {t('Ocultar automaticamente a barra de tarefas')}
                                    </span>

                                    <input
                                        type="checkbox"
                                        checked={autoHideTaskbar}
                                        onChange={(event) =>
                                            reportPersistence(
                                                setTaskbarAutoHide(event.target.checked),
                                            )
                                        }
                                    />
                                </label>
                            </div>
                        </section>
                    )}


                    {activeSection === 'mobile' && (
                        <section aria-labelledby="settings-mobile">
                            <h3 id="settings-mobile">Mobile</h3>

                            <p>
                                {t('Personalize a apresentação dos aplicativos no Mobile.')}
                            </p>

                            <label className="ws-settings__field">
                                <span>{t('Espaçamento dos aplicativos')}</span>

                                <select
                                    value={mobilePreferences.gridDensity}
                                    onChange={(event) =>
                                        reportPersistence(
                                            setMobilePreferences({
                                                gridDensity: event.target.value,
                                            }),
                                        )
                                    }
                                >
                                    <option value="default">
                                        {t('Padrão')}
                                    </option>
                                    <option value="comfortable">
                                        {t('Confortável')}
                                    </option>
                                </select>
                            </label>

                            <p className="ws-settings__hint">
                                {t(
                                    'Essa preferência altera somente a grade de aplicativos do Mobile.',
                                )}
                            </p>
                        </section>
                    )}


                    {activeSection === 'reset' && (
                        <section aria-labelledby="settings-reset">
                            <h3 id="settings-reset">
                                {t('Restaurar configurações')}
                            </h3>

                            <p>
                                {t(
                                    'Restaure as preferências visuais e de interface para os valores originais da WS OS.',
                                )}
                            </p>

                            <div className="ws-settings__reset">
                                <div>
                                    <h4>{t('Preferências padrão')}</h4>

                                    <p>
                                        {t(
                                            'Serão restaurados o tema, idioma, cores, transparência, desfoque, acessibilidade e preferências de Desktop e Mobile.',
                                        )}
                                    </p>

                                    <p>
                                        <strong>
                                            {t(
                                                'Seus arquivos, projetos e dados dos aplicativos não serão apagados.',
                                            )}
                                        </strong>
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="ws-settings__reset-button"
                                    onClick={restoreDefaultSettings}
                                >
                                    <RotateCcw size={18} aria-hidden="true" />
                                    {t('Restaurar padrões')}
                                </button>
                            </div>
                        </section>
                    )}


                </main>
            </div>
        </div>
    );
}
