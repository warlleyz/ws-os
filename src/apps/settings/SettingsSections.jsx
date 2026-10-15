import { useEffect, useRef, useState } from 'react';
import { Check, Moon, RotateCcw, Sun } from 'lucide-react';
import {
  WALLPAPERS,
  useWallpaper,
  useWallpaperRevision,
  useWallpaperStatus,
  useCustomWallpaperAvailable,
  setWallpaper,
  uploadCustomWallpaper,
  getWallpaperDefinition,
} from '../../core/wallpaperManager';
import { translate as t, useLocale, setLocale } from '../../shared/i18n/i18n';
import { useTheme, setTheme } from '../../core/themeManager';
import { useAppearance, setAppearance } from '../../core/appearanceManager';
import { useAccessibility, setAccessibility } from '../../core/effectsManager';
import { useTaskbarAutoHide, setTaskbarAutoHide } from '../../core/taskbarPreferences';
import { useMobilePreferences, setMobilePreferences } from '../../core/mobilePreferences';
import { useWidgetPreferences, configureWidget } from '../../core/widgetPreferences';
import { getWidgetDefinition } from '../../core/widgetManager';
import { restoreSystemPreferences } from '../../core/preferencesManager';
import { useSystem } from '../../core/useSystem';

function SettingsCard({ title, description, children }) {
  return (
    <section className="ws-settings__card">
      <div className="ws-settings__card-heading">
        <h4>{title}</h4>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}
function SettingsSelect({ label, value, options, onChange }) {
  return (
    <label className="ws-settings__field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {t(name)}
          </option>
        ))}
      </select>
    </label>
  );
}
function SettingsToggle({ label, checked, onChange }) {
  return (
    <label className="ws-settings__toggle">
      <span className="ws-settings__toggle-copy">
        <strong>{label}</strong>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
function WallpaperGallery({ shell, report, announce }) {
  const selected = useWallpaper(shell);
  const effects = useAccessibility();
  useWallpaperRevision();
  const status = useWallpaperStatus();
  const available = useCustomWallpaperAvailable();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function upload(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const saved = await uploadCustomWallpaper(file, shell);
      report(saved);
      if (saved) announce('Imagem salva e aplicada.');
    } catch (error) {
      announce(error.message, true);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const choices = available ? [...WALLPAPERS, { id: 'custom', name: 'Personalizado' }] : WALLPAPERS;
  return (
    <SettingsCard
      title={t(shell === 'mobile' ? 'Papel de parede do Mobile' : 'Papel de parede do Desktop')}
      description={t(
        'A seleção é independente para cada shell. A imagem pessoal fica somente neste navegador.',
      )}
    >
      <div className="ws-settings__wallpaper-grid" data-shell={shell} aria-busy={busy}>
        {choices.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`ws-settings__wallpaper-option${selected === item.id ? ' is-active' : ''}`}
            aria-pressed={selected === item.id}
            disabled={busy}
            onClick={() => report(setWallpaper(item.id, shell))}
          >
            <span
              className="ws-settings__wallpaper-preview"
              style={{ background: getWallpaperDefinition(item.id, shell).background }}
              aria-hidden="true"
            >
              {selected === item.id && (
                <span className="ws-settings__wallpaper-check">
                  <Check size={16} />
                </span>
              )}
            </span>
            <span className="ws-settings__wallpaper-info">
              <strong>{t(item.name)}</strong>
              <small>{t(selected === item.id ? 'Em uso' : 'Selecionar')}</small>
            </span>
          </button>
        ))}
      </div>
      <div className="ws-settings__upload">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={upload}
          disabled={busy}
          aria-label={t('Escolher imagem personalizada')}
        />
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          {t(
            busy
              ? 'Salvando imagem…'
              : available
                ? 'Substituir imagem pessoal'
                : 'Adicionar imagem pessoal',
          )}
        </button>
      </div>
      <p className="ws-settings__hint">
        {t(
          'PNG, JPEG ou WebP; até 5 MB, 32 megapixels e 8192 pixels por lado. Substituir atualiza a imagem compartilhada pelos shells que a utilizam.',
        )}
      </p>
      {effects.lowEffects && (
        <p role="status">
          {t(
            'O modo de baixo custo suspende o fundo visual. Sua imagem e seleção permanecem salvas.',
          )}
        </p>
      )}
      {status === 'loading' && <p role="status">{t('Recuperando imagem pessoal…')}</p>}
      {['missing', 'error'].includes(status) && (
        <p role="status">
          {t(
            'A imagem pessoal não está disponível. O fundo padrão é exibido sem apagar sua seleção ou dados.',
          )}
        </p>
      )}
    </SettingsCard>
  );
}

export default function SettingsSections({ activeSection }) {
  const locale = useLocale();
  const theme = useTheme();
  const appearance = useAppearance();
  const accessibility = useAccessibility();
  const autoHide = useTaskbarAutoHide();
  const mobile = useMobilePreferences();
  const widgets = useWidgetPreferences();
  const { notify } = useSystem();
  const [message, setMessage] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const confirmRef = useRef(null);
  const resetButtonRef = useRef(null);
  useEffect(() => {
    if (confirmReset) confirmRef.current?.focus();
  }, [confirmReset]);
  function announce(text, error = false) {
    setMessage({ text, error });
    if (error)
      notify({
        title: t('Configurações'),
        message: t(text),
        type: 'warning',
        source: t('Sistema'),
      });
  }
  function report(saved) {
    if (!saved)
      announce('Não foi possível salvar esta preferência. Ela continua ativa nesta sessão.', true);
    else setMessage(null);
  }
  function changeWidget(id, patch) {
    const result = configureWidget(id, patch);
    if (!result.ok)
      announce(
        result.reason === 'capacity'
          ? 'Sem espaço para o relógio. Escolha outro tamanho ou libere espaço na grade.'
          : 'Preferência inválida.',
        true,
      );
    else report(result.saved);
  }
  function closeReset() {
    setConfirmReset(false);
    queueMicrotask(() => resetButtonRef.current?.focus());
  }
  function reset() {
    const result = restoreSystemPreferences();
    closeReset();
    announce(
      result.ok
        ? 'As preferências padrão foram aplicadas.'
        : 'As preferências foram aplicadas nesta sessão, mas algumas não puderam ser salvas.',
      !result.ok,
    );
  }
  let content;
  if (activeSection === 'appearance')
    content = (
      <>
        <SettingsCard
          title={t('Tema do sistema')}
          description={t('Escolha o tema visual do sistema.')}
        >
          <div className="ws-settings__theme-grid">
            {[
              { id: 'dark', label: 'Escuro', Icon: Moon },
              { id: 'light', label: 'Claro', Icon: Sun },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={`ws-settings__theme-option ws-settings__theme-option--${id}${theme === id ? ' is-active' : ''}`}
                aria-pressed={theme === id}
                onClick={() => report(setTheme(id))}
              >
                <span className="ws-settings__theme-preview" aria-hidden="true">
                  <span className="ws-settings__theme-preview-sidebar" />
                  <span className="ws-settings__theme-preview-panel">
                    <span />
                    <span />
                  </span>
                </span>
                <span className="ws-settings__theme-label">
                  <Icon size={17} aria-hidden="true" />
                  <strong>{t(label)}</strong>
                  {theme === id && <Check size={17} aria-hidden="true" />}
                </span>
              </button>
            ))}
          </div>
        </SettingsCard>
        <WallpaperGallery shell="desktop" report={report} announce={announce} />
        <SettingsCard title={t('Personalização visual')}>
          <fieldset className="ws-settings__accent">
            <legend>{t('Cor de destaque')}</legend>
            {[
              ['blue', 'Azul'],
              ['violet', 'Violeta'],
              ['green', 'Verde'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                data-color={id}
                aria-pressed={appearance.accent === id}
                onClick={() => report(setAppearance({ accent: id }))}
              >
                <span aria-hidden="true" />
                {t(label)}
                {appearance.accent === id && <Check size={16} aria-hidden="true" />}
              </button>
            ))}
          </fieldset>
          <div className="ws-settings__field-grid">
            <SettingsSelect
              label={t('Intensidade do desfoque')}
              value={appearance.blur}
              options={[
                ['off', 'Desligado'],
                ['soft', 'Suave'],
                ['normal', 'Normal'],
                ['strong', 'Intenso'],
              ]}
              onChange={(blur) => report(setAppearance({ blur }))}
            />
            <SettingsSelect
              label={t('Transparência')}
              value={appearance.transparency}
              options={[
                ['solid', 'Sólida'],
                ['default', 'Padrão'],
                ['high', 'Elevada'],
              ]}
              onChange={(transparency) => report(setAppearance({ transparency }))}
            />
            <SettingsSelect
              label={t('Intensidade das animações')}
              value={appearance.motion}
              options={[
                ['off', 'Desligado'],
                ['subtle', 'Suave'],
                ['normal', 'Normal'],
              ]}
              onChange={(motion) => report(setAppearance({ motion }))}
            />
          </div>
          <p className="ws-settings__hint">
            {t(
              'Efeitos são aplicados às superfícies do sistema. Conteúdo dos aplicativos permanece legível. Acessibilidade e preferências do sistema têm prioridade.',
            )}
          </p>
        </SettingsCard>
      </>
    );
  if (activeSection === 'language')
    content = (
      <SettingsCard title={t('Idioma do sistema')}>
        <SettingsSelect
          label={t('Idioma')}
          value={locale}
          options={[
            ['pt-BR', 'Português (Brasil)'],
            ['en', 'English'],
          ]}
          onChange={(value) => report(setLocale(value))}
        />
      </SettingsCard>
    );
  if (activeSection === 'accessibility')
    content = (
      <SettingsCard title={t('Acessibilidade')}>
        <div className="ws-settings__options">
          {[
            ['motion', 'Reduzir movimento'],
            ['transparency', 'Reduzir transparência'],
            ['lowEffects', 'Modo de baixo custo'],
          ].map(([key, label]) => (
            <SettingsToggle
              key={key}
              label={t(label)}
              checked={accessibility[key]}
              onChange={(value) => report(setAccessibility({ ...accessibility, [key]: value }))}
            />
          ))}
        </div>
        <p className="ws-settings__hint">
          {t('As preferências de acessibilidade também respeitam as opções do sistema.')}
        </p>
      </SettingsCard>
    );
  if (activeSection === 'desktop')
    content = (
      <SettingsCard title={t('Área de Trabalho')}>
        <SettingsToggle
          label={t('Ocultar automaticamente a barra de tarefas')}
          checked={autoHide}
          onChange={(value) => report(setTaskbarAutoHide(value))}
        />
        <p className="ws-settings__hint">
          {t(
            'A organização dos atalhos é feita no Desktop por arraste, teclado ou menu de contexto. Alterar aparência não muda suas posições.',
          )}
        </p>
      </SettingsCard>
    );

  if (activeSection === 'widgets')
    content = (
      <SettingsCard
        title={t('Widgets do Desktop')}
        description={t(
          'Gerencie os widgets disponíveis. Posição e tamanho são compartilhados com o Desktop.',
        )}
      >
        {widgets.widgets.map((widget) => {
          const definition = getWidgetDefinition(widget.widgetId);
          const isReady = widget.widgetId === 'clock';

          const sizeOptions = (definition?.allowedSizes ?? []).map(
            (size) => [size, size.replace('x', ' × ')],
          );

          return (
            <div
              key={widget.instanceId}
              className="ws-settings__options"
            >
              <div className="ws-settings__card-heading">
                <h4>{t(definition?.name ?? widget.widgetId)}</h4>
                <p>{t(definition?.description ?? '')}</p>
              </div>

              {!isReady && (
                <p className="ws-settings__hint" role="status">
                  {t(
                    'Widget em preparação. Os controles serão habilitados após a integração com a grade do Desktop.',
                  )}
                </p>
              )}

              <div
                style={
                  !isReady
                    ? { opacity: 0.55 }
                    : undefined
                }
              >
                <fieldset
                  disabled={!isReady}
                  style={{
                    border: 0,
                    padding: 0,
                    margin: 0,
                    minWidth: 0,
                  }}
                >
                  <SettingsToggle
                    label={t('Exibir no Desktop')}
                    checked={widget.visible}
                    onChange={(visible) =>
                      changeWidget(widget.instanceId, { visible })
                    }
                  />

                  <SettingsSelect
                    label={t('Tamanho')}
                    value={`${widget.size.columns}x${widget.size.rows}`}
                    options={sizeOptions}
                    onChange={(value) => {
                      const [columns, rows] = value
                        .split('x')
                        .map(Number);

                      changeWidget(widget.instanceId, {
                        size: { columns, rows },
                      });
                    }}
                  />
                </fieldset>
              </div>

              {isReady && (
                <p className="ws-settings__hint">
                  {t(
                    'O relógio segue o idioma e a hora do dispositivo. Mova-o no Desktop. Tamanhos sem espaço são bloqueados; em telas pequenas ele pode ficar temporariamente indisponível.',
                  )}
                </p>
              )}
            </div>
          );
        })}
      </SettingsCard>
    );
  if (activeSection === 'mobile')
    content = (
      <>
        <SettingsCard title={t('Mobile')}>
          <SettingsSelect
            label={t('Espaçamento dos aplicativos')}
            value={mobile.gridDensity}
            options={[
              ['default', 'Padrão'],
              ['comfortable', 'Confortável'],
            ]}
            onChange={(gridDensity) => report(setMobilePreferences({ gridDensity }))}
          />
          <p className="ws-settings__hint">
            {t('Essa preferência altera somente a grade de aplicativos do Mobile.')}
          </p>
        </SettingsCard>
        <WallpaperGallery shell="mobile" report={report} announce={announce} />
      </>
    );
  if (activeSection === 'reset')
    content = (
      <SettingsCard title={t('Preferências padrão')}>
        <div className="ws-settings__reset">
          <p>
            {t(
              'Restaura tema, idioma, cores, efeitos, acessibilidade, Taskbar, densidade Mobile, seleção de wallpapers e tamanho/visibilidade dos widgets.',
            )}
          </p>
          <p>
            <strong>
              {t(
                'Arquivos, dados dos aplicativos, favoritos, imagem pessoal e posições dos atalhos e widgets são preservados.',
              )}
            </strong>
          </p>
          {confirmReset ? (
            <div
              className="ws-settings__confirm"
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  closeReset();
                }
              }}
              role="group"
              aria-label={t('Confirmar restauração')}
            >
              <p>
                {t(
                  'Deseja restaurar as preferências padrão? Os dados dos aplicativos não serão apagados.',
                )}
              </p>
              <button ref={confirmRef} type="button" onClick={reset}>
                {t('Confirmar restauração')}
              </button>
              <button type="button" onClick={closeReset}>
                {t('Cancelar')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              ref={resetButtonRef}
              className="ws-settings__reset-button"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={17} aria-hidden="true" />
              {t('Restaurar padrões')}
            </button>
          )}
        </div>
      </SettingsCard>
    );
  return (
    <div className="ws-settings__stack">
      {content}
      <div
        role="status"
        aria-live="polite"
        className={message?.error ? 'ws-settings__message is-error' : 'ws-settings__message'}
      >
        {message ? t(message.text) : ''}
      </div>
    </div>
  );
}
