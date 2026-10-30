import { useEffect, useRef, useState } from 'react';
import { Check, Moon, RotateCcw, Sun } from 'lucide-react';
import Select from '../../shared/components/Select';

import {
  useWallpaper,
  useWallpaperRevision,
  useWallpaperStatus,
  usePersonalWallpapers,
  setWallpaper,
  getWallpaper,
  uploadCustomWallpaper,
  deleteWallpaperFromCollection,
  isPersonalWallpaperInUse,
  getWallpaperDefinition,
  getWallpaperFit,
  setWallpaperFit,
} from '../../core/wallpaperManager';
import { getOfficialWallpapersByTheme, getDefaultWallpaper } from '../../core/wallpaperCatalog';
import { translate as t, useLocale, setLocale } from '../../shared/i18n/i18n';
import { useTheme, setTheme } from '../../core/themeManager';
import { useAppearance, setAppearance } from '../../core/appearanceManager';
import { useCursorMode, setCursorMode } from '../../core/cursorManager';
import { useAccessibility, setAccessibility } from '../../core/effectsManager';
import { useTaskbarAutoHide, setTaskbarAutoHide } from '../../core/taskbarPreferences';
import { useMobilePreferences, setMobilePreferences } from '../../core/mobilePreferences';
import { useWidgetPreferences, configureWidget } from '../../core/widgetPreferences';
import { getWidgetDefinition } from '../../core/widgetManager';
import { restoreSystemPreferences } from '../../core/preferencesManager';
import { useSystem } from '../../core/useSystem';

import './SettingsSections.css';

/* === ELEMENTOS COMPARTILHADOS === */
/* ----- Grupo de preferências ----- */
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

/* ----- Seleção de preferência ----- */
function SettingsSelect({ label, value, options, onChange, description }) {
  return (
    <div className="ws-settings__field">
      <span className="ws-settings__field-label">{label}</span>
      {description && (
        <small className="ws-settings__field-description">{description}</small>
      )}

      <Select
        label={label}
        value={value}
        options={options.map(([id, name]) => ({
          value: id,
          label: t(name),
        }))}
        onChange={onChange}
      />
    </div>
  );
}

/* ----- Alternância de preferência ----- */
function SettingsToggle({ label, checked, onChange, description }) {
  return (
    <label className="ws-settings__preference-row">
      <span className="ws-settings__preference-copy">
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <span className="ws-settings__switch">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={label} />
        <span aria-hidden="true" />
      </span>
    </label>
  );
}

/* === CONTROLE DE INTENSIDADE VISUAL === */
/* ----- Opções discretas compatíveis com as preferências do Core ----- */
function SettingsIntensity({ label, description, value, options, onChange }) {
  return (
    <div className="ws-settings__intensity">
      <div className="ws-settings__intensity-heading">
        <strong>{label}</strong>
        <p>{description}</p>
      </div>

      <div className="ws-settings__intensity-options" role="group" aria-label={label}>
        {options.map(([id, name]) => (
          <button
            key={id}
            type="button"
            className={value === id ? 'is-active' : ''}
            aria-pressed={value === id}
            onClick={() => onChange(id)}
          >
            {t(name)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* === GALERIA DE PAPÉIS DE PAREDE === */
/* ----- Seleção, upload e exclusão de imagens ----- */
function WallpaperGallery({ shell, report, announce }) {
  const theme = useTheme();
  const selected = useWallpaper(shell);
  useWallpaperRevision();
  const status = useWallpaperStatus();
  const personalWallpapers = usePersonalWallpapers();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const officialChoices = getOfficialWallpapersByTheme(theme);

  async function upload(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file || busy) return;
    setBusy(true);
    try {
      const saved = await uploadCustomWallpaper(file, shell);
      if (!mounted.current) return;
      announce(
        saved ? 'Imagem salva e aplicada.' : 'Não foi possível salvar a imagem. A imagem anterior foi preservada.',
        !saved,
      );
    } catch (error) {
      if (mounted.current) announce(error?.message || 'Não foi possível concluir a operação.', true);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  /* === EXCLUSÃO DE IMAGEM PESSOAL === */
  /* ----- Libera o uso da imagem antes de removê-la da coleção ----- */
  async function removeWallpaper(id) {
    if (busy || id === 'personal:legacy') return;

    setBusy(true);

    try {
      /* ----- Substituir a imagem em todas as plataformas e temas ----- */
      for (const targetShell of ['desktop', 'mobile']) {
        for (const targetTheme of ['dark', 'light']) {
          if (getWallpaper(targetShell, targetTheme) !== id) continue;

          const saved = setWallpaper(
            getDefaultWallpaper(targetTheme),
            targetShell,
            targetTheme,
          );

          if (!saved) {
            announce('Não foi possível liberar a imagem em uso. A exclusão foi cancelada.', true);
            return;
          }
        }
      }

      const result = await deleteWallpaperFromCollection(id);
      if (!mounted.current) return;

      if (result.ok) {
        announce('Imagem pessoal excluída.');
      } else {
        announce('Não foi possível excluir a imagem pessoal.', true);
      }
    } catch {
      if (mounted.current) announce('Não foi possível concluir a operação.', true);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <SettingsCard
      title={t(shell === 'mobile' ? 'Papel de parede do Mobile' : 'Papel de parede do Desktop')}
      description={t('Escolha uma imagem oficial ou adicione a sua. Cada tema mantém sua própria seleção.')}
    >
      <SettingsSelect
        label={t('Enquadramento da imagem')}
        value={getWallpaperFit(shell, theme)}
        options={[["cover", 'Preencher'], ["contain", 'Ajustar'], ["center", 'Centralizar']]}
        onChange={(fit) => report(setWallpaperFit(fit, shell, theme))}
      />
      <div className="ws-settings__wallpaper-preview ws-settings__wallpaper-current" role="img"
        aria-label={t('Prévia do papel de parede')}
        style={{ background: getWallpaperDefinition(selected, shell, theme).background }} />
      <div className="ws-settings__wallpaper-grid" data-shell={shell} aria-busy={busy}>
        {officialChoices.map((item) => {
          const active = selected === item.id;
          return (
            <button key={item.id} type="button" className={`ws-settings__wallpaper-option${active ? ' is-active' : ''}`}
              aria-pressed={active} disabled={busy} onClick={() => report(setWallpaper(item.id, shell, theme))}>
              <span className="ws-settings__wallpaper-preview" aria-hidden="true"
                style={{ background: getWallpaperDefinition(item.id, shell, theme).background }}>
                {active && <span className="ws-settings__wallpaper-check"><Check size={16} aria-hidden="true" /></span>}
              </span>
              <span className="ws-settings__wallpaper-info"><strong>{t(item.name)}</strong><small>{t(active ? 'Em uso' : 'Selecionar')}</small></span>
            </button>
          );
        })}
      </div>
      {personalWallpapers.length > 0 && (
        <div className="ws-settings__personal-section">
          <p className="ws-settings__subheading">{t('Minhas imagens')}</p>
          <div className="ws-settings__wallpaper-grid" data-shell={shell} aria-busy={busy}>
            {personalWallpapers.map((item) => {
              const active = selected === item.id || (selected === 'custom' && item.id === 'personal:legacy');
              const inUse = isPersonalWallpaperInUse(item.id);
              return (
                <div key={item.id} className="ws-settings__personal-wallpaper">
                  <button type="button" className={`ws-settings__wallpaper-option${active ? ' is-active' : ''}`}
                    aria-pressed={active} disabled={busy} onClick={() => report(setWallpaper(item.id, shell, theme))}>
                    <span className="ws-settings__wallpaper-preview" aria-hidden="true"
                      style={{ background: getWallpaperDefinition(item.id, shell, theme).background }}>
                      {active && <span className="ws-settings__wallpaper-check"><Check size={16} aria-hidden="true" /></span>}
                    </span>
                    <span className="ws-settings__wallpaper-info"><strong title={item.name}>{item.name}</strong><small>{t(active ? 'Em uso' : 'Selecionar')}</small></span>
                  </button>
                  <button type="button" className="ws-settings__personal-wallpaper-delete"
                    disabled={busy || item.id === 'personal:legacy'}
                    title={t(inUse ? 'Excluir e substituir o wallpaper em uso' : 'Excluir')}
                    aria-label={`${t('Excluir')}: ${item.name}`} onClick={() => removeWallpaper(item.id)}>
                    {t('Excluir')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="ws-settings__upload">
        <input
          ref={inputRef}
          className="ws-settings__file-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={upload}
          disabled={busy}
          tabIndex={-1}
          aria-label={t('Escolher imagem personalizada')}
        />
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          {t(busy ? 'Salvando imagem…' : 'Adicionar imagem pessoal')}
        </button>
      </div>
      <p className="ws-settings__hint">{t('PNG, JPEG ou WebP; até 5 MB, 32 megapixels e 8192 pixels por lado. Coleção de até 100 MB, sem exclusão automática.')}</p>
      {status === 'loading' && <p role="status">{t('Recuperando imagem pessoal…')}</p>}
      {['missing', 'error'].includes(status) && <p role="status">{t('A imagem pessoal não está disponível. O fundo padrão é exibido sem apagar sua seleção ou dados.')}</p>}
    </SettingsCard>
  );
}

/* === SEÇÕES DE CONFIGURAÇÕES === */
/* ----- Estado e integrações das preferências ----- */
export default function SettingsSections({ activeSection }) {
  const locale = useLocale();
  const theme = useTheme();
  const appearance = useAppearance();
  const cursorMode = useCursorMode();
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
    if (error) notify({ title: t('Configurações'), message: t(text), type: 'warning', source: t('Sistema') });
  }

  function report(saved) {
    if (!saved) announce('Não foi possível salvar esta preferência. Ela continua ativa nesta sessão.', true);
    else setMessage(null);
  }

  function changeWidget(id, patch) {
    const result = configureWidget(id, patch);
    if (!result.ok) {
      announce(result.reason === 'capacity'
        ? 'Sem espaço na grade do Desktop. Escolha outro tamanho ou libere espaço.'
        : 'Preferência inválida.', true);
    } else if (result.saved) report(true);
    else announce('Não foi possível concluir a operação.', true);
  }

  function closeReset() {
    setConfirmReset(false);
    queueMicrotask(() => resetButtonRef.current?.focus());
  }

  function reset() {
    const result = restoreSystemPreferences();
    closeReset();
    announce(result.ok
      ? 'As preferências padrão foram aplicadas.'
      : 'As preferências foram aplicadas nesta sessão, mas algumas não puderam ser salvas.', !result.ok);
  }

  /* === ALTERAÇÃO DO TEMA === */
  /* ----- Recuperar as preferências próprias do tema selecionado ----- */
  function changeTheme(nextTheme) {
    if (nextTheme === theme) return;

    report(setTheme(nextTheme));
  }

  let content = null;

  /* === APARÊNCIA === */
  if (activeSection === 'appearance') {
    content = (
      <>
        <SettingsCard title={t('Tema do sistema')} description={t('Escolha o visual geral da interface. A alteração é aplicada imediatamente.')}>
          <div className="ws-settings__theme-grid">
            {[{ id: 'dark', label: 'Escuro', Icon: Moon }, { id: 'light', label: 'Claro', Icon: Sun }].map(({ id, label, Icon }) => {
              const active = theme === id;
              return (
                <button key={id} type="button" className={`ws-settings__theme-option ws-settings__theme-option--${id}${active ? ' is-active' : ''}`}
                  aria-pressed={active} onClick={() => changeTheme(id)}>
                  <span className="ws-settings__theme-preview" aria-hidden="true">
                    <span className="ws-settings__theme-preview-sidebar" />
                    <span className="ws-settings__theme-preview-panel"><span /><span /></span>
                  </span>
                  <span className="ws-settings__theme-label"><Icon size={17} aria-hidden="true" /><strong>{t(label)}</strong>{active && <Check size={17} aria-hidden="true" />}</span>
                </button>
              );
            })}
          </div>
        </SettingsCard>
        <WallpaperGallery shell="desktop" report={report} announce={announce} />
        <SettingsCard title={t('Cores e cursor')} description={t('Ajuste a cor de destaque e como o ponteiro aparece no WS OS.')}>
          <SettingsToggle label={t('Ocultar papel de parede')}
            description={t('Exibe uma superfície uniforme no lugar da imagem de fundo.')}
            checked={appearance.hideWallpaper === true} onChange={(hideWallpaper) => report(setAppearance({ hideWallpaper }))} />
          <div className="ws-settings__field-grid">
            <SettingsSelect label={t('Cursor do sistema')} value={cursorMode}
              options={[["custom", 'Personalizado'], ["native", 'Nativo do dispositivo']]}
              onChange={(mode) => report(setCursorMode(mode))} />
            <SettingsSelect label={t('Modo da cor de destaque')} value={appearance.accentMode ?? 'auto'}
              options={[["auto", 'Automática pelo papel de parede'], ["manual", 'Manual neste tema']]}
              onChange={(accentMode) => report(setAppearance({ accentMode }))} />
          </div>
          <fieldset className="ws-settings__accent">
            <legend>{t('Cor de destaque')}</legend>
            {[["blue", 'Azul'], ["violet", 'Violeta'], ["green", 'Verde']].map(([id, label]) => (
              <button key={id} type="button" data-color={id}
                aria-pressed={appearance.accentMode === 'manual' && appearance.accent === id}
                onClick={() => report(setAppearance({ accent: id }))}>
                <span aria-hidden="true" />{t(label)}
                {appearance.accentMode === 'manual' && appearance.accent === id && <Check size={16} aria-hidden="true" />}
              </button>
            ))}
          </fieldset>
          <p className="ws-settings__hint">{t('A cor automática é calculada a partir do papel de parede. Cada tema mantém sua preferência de cor.')}</p>
        </SettingsCard>
        <SettingsCard title={t('Superfícies e animações')} description={t('Controle os efeitos visuais sem comprometer a leitura dos aplicativos.')}>
          {/* ----- Desfoque das superfícies ----- */}
          <SettingsIntensity
            label={t('Intensidade do desfoque')}
            description={t('Suaviza o conteúdo visível atrás das superfícies do sistema.')}
            value={appearance.blur}
            options={[
              ['off', 'Desligado'],
              ['soft', 'Suave'],
              ['normal', 'Normal'],
              ['strong', 'Intenso'],
            ]}
            onChange={(blur) => report(setAppearance({ blur }))}
          />

          {/* ----- Transparência das superfícies ----- */}
          <SettingsIntensity
            label={t('Transparência')}
            description={t('Define quanto do papel de parede aparece através das superfícies.')}
            value={appearance.transparency}
            options={[
              ['solid', 'Sólida'],
              ['default', 'Padrão'],
              ['high', 'Elevada'],
            ]}
            onChange={(transparency) => report(setAppearance({ transparency }))}
          />

          {/* ----- Intensidade das animações ----- */}
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
          <p className="ws-settings__hint">{t('As preferências de Acessibilidade e as configurações do dispositivo têm prioridade sobre os efeitos decorativos.')}</p>
        </SettingsCard>
      </>
    );
  }

  /* === IDIOMA === */
  if (activeSection === 'language') {
    content = (
      <SettingsCard title={t('Idioma da interface')} description={t('Defina como menus, aplicativos e mensagens do WS OS são apresentados.')}>
        <div className="ws-settings__language-preview">
          <div className="ws-settings__language-symbol" aria-hidden="true">{locale === 'en' ? 'EN' : 'PT'}</div>
          <div><strong>{locale === 'en' ? 'English' : 'Português (Brasil)'}</strong><small>{t('Idioma atual do sistema')}</small></div>
        </div>
        <SettingsSelect label={t('Idioma')} value={locale}
          options={[["pt-BR", 'Português (Brasil)'], ["en", 'English']]}
          onChange={(value) => report(setLocale(value))}
          description={t('A mudança é aplicada imediatamente à interface.')} />
        <p className="ws-settings__hint">{t('Nomes próprios, tecnologias e conteúdos externos podem permanecer em seu idioma original.')}</p>
      </SettingsCard>
    );
  }

  /* === ACESSIBILIDADE === */
  if (activeSection === 'accessibility') {
    content = (
      <SettingsCard title={t('Conforto visual e desempenho')} description={t('Reduza efeitos que podem atrapalhar a navegação ou exigir mais do dispositivo.')}>
        <div className="ws-settings__preference-list">
          {[
            ['motion', 'Reduzir movimento', 'Diminui animações e transições da interface.'],
            ['transparency', 'Reduzir transparência', 'Prioriza superfícies mais opacas para melhorar a legibilidade.'],
            ['lowEffects', 'Modo de baixo custo', 'Reduz efeitos visuais exigentes para poupar processamento gráfico.'],
          ].map(([key, label, description]) => (
            <SettingsToggle key={key} label={t(label)} description={t(description)} checked={accessibility[key]}
              onChange={(value) => report(setAccessibility({ ...accessibility, [key]: value }))} />
          ))}
        </div>
        <p className="ws-settings__hint">{t('Essas opções têm prioridade sobre os ajustes decorativos de Aparência.')}</p>
      </SettingsCard>
    );
  }

  /* === ÁREA DE TRABALHO === */
  if (activeSection === 'desktop') {
    content = (
      <>
        <SettingsCard title={t('Barra de tarefas')} description={t('Defina como a Taskbar se comporta durante o uso do Desktop.')}>
          <SettingsToggle label={t('Ocultar automaticamente a barra de tarefas')}
            description={t('Recolhe a barra quando não está em uso, ampliando a área disponível para as janelas.')}
            checked={autoHide} onChange={(value) => report(setTaskbarAutoHide(value))} />
        </SettingsCard>
        <SettingsCard title={t('Organização do Desktop')} description={t('Os itens podem ser organizados diretamente na Área de Trabalho.')}>
          <div className="ws-settings__information-list">
            <div><strong>{t('Atalhos')}</strong><p>{t('Mova e organize aplicativos por arraste, teclado ou menu de contexto.')}</p></div>
            <div><strong>{t('Widgets')}</strong><p>{t('Configure visibilidade e dimensões na seção Widgets.')}</p></div>
            <div><strong>{t('Posições preservadas')}</strong><p>{t('A alteração de tema ou aparência não reorganiza os atalhos existentes.')}</p></div>
          </div>
        </SettingsCard>
      </>
    );
  }

  /* === WIDGETS === */
  if (activeSection === 'widgets') {
    content = (
      <SettingsCard title={t('Widgets do Desktop')} description={t('Altere a visibilidade, o tamanho e as preferências de cada widget. A posição continua sendo gerenciada no Desktop.')}>
        <div className="ws-settings__widget-list">
          {widgets.widgets.map((widget) => {
            const definition = getWidgetDefinition(widget.widgetId);
            const ready = ['clock', 'calendar', 'weather', 'dev-insights'].includes(widget.widgetId);
            const sizes = (definition?.allowedSizes ?? []).map((size) => [size, size.replace('x', ' × ')]);
            return (
              <section className="ws-settings__widget-item" key={widget.instanceId}>
                <div className="ws-settings__widget-heading">
                  <div><h5>{t(definition?.name ?? widget.widgetId)}</h5><p>{t(definition?.description ?? '')}</p></div>
                  <span className="ws-settings__widget-size">{widget.size.columns} × {widget.size.rows}</span>
                </div>
                {!ready && <p className="ws-settings__hint" role="status">{t('Widget em preparação. Os controles serão habilitados após a integração com a grade do Desktop.')}</p>}
                <fieldset disabled={!ready} className="ws-settings__widget-controls">
                  <SettingsToggle label={t('Exibir no Desktop')} checked={widget.visible}
                    onChange={(visible) => changeWidget(widget.instanceId, { visible })} />
                  <SettingsSelect label={t('Tamanho')} value={`${widget.size.columns}x${widget.size.rows}`}
                    options={sizes} onChange={(value) => {
                      const [columns, rows] = value.split('x').map(Number);
                      changeWidget(widget.instanceId, { size: { columns, rows } });
                    }} />
                  {widget.widgetId === 'clock' && (
                    <SettingsSelect label={t('Fuso horário do relógio')} value={widget.settings?.timeZone ?? ''}
                      options={[
                        ['', 'Automático (dispositivo)'], ['America/Sao_Paulo', 'Brasília'],
                        ['America/Manaus', 'Manaus'], ['America/Rio_Branco', 'Rio Branco'],
                        ['America/Noronha', 'Fernando de Noronha'], ['America/New_York', 'Nova York'],
                        ['America/Los_Angeles', 'Los Angeles'], ['Europe/London', 'Londres'],
                        ['Europe/Paris', 'Paris'], ['Asia/Tokyo', 'Tóquio'], ['UTC', 'UTC'],
                      ]}
                      onChange={(timeZone) => changeWidget(widget.instanceId, { settings: { ...widget.settings, timeZone } })} />
                  )}
                  {widget.widgetId === 'weather' && (
                    <>
                      <div className="ws-settings__field-grid">
                        <SettingsSelect label={t('Unidade de temperatura')} value={widget.settings?.temperatureUnit ?? 'celsius'}
                          options={[["celsius", 'Celsius (°C)'], ["fahrenheit", 'Fahrenheit (°F)']]}
                          onChange={(temperatureUnit) => changeWidget(widget.instanceId, { settings: { ...widget.settings, temperatureUnit } })} />
                        <SettingsSelect label={t('Velocidade do vento')} value={widget.settings?.windUnit ?? 'kmh'}
                          options={[["kmh", 'Quilômetros por hora (km/h)'], ["mph", 'Milhas por hora (mph)']]}
                          onChange={(windUnit) => changeWidget(widget.instanceId, { settings: { ...widget.settings, windUnit } })} />
                      </div>
                      <SettingsToggle label={t('Mostrar sensação térmica')} checked={widget.settings?.showFeelsLike !== false}
                        onChange={(showFeelsLike) => changeWidget(widget.instanceId, { settings: { ...widget.settings, showFeelsLike } })} />
                      <SettingsToggle label={t('Mostrar previsão dos próximos dias')} checked={widget.settings?.showForecast !== false}
                        onChange={(showForecast) => changeWidget(widget.instanceId, { settings: { ...widget.settings, showForecast } })} />
                    </>
                  )}
                </fieldset>
              </section>
            );
          })}
        </div>
      </SettingsCard>
    );
  }

  /* === MOBILE === */
  if (activeSection === 'mobile') {
    content = (
      <>
        <SettingsCard title={t('Organização dos aplicativos')} description={t('Personalize o espaçamento da tela inicial no Mobile.')}>
          <div className="ws-settings__density-preview" aria-hidden="true">
            <div className="ws-settings__density-device">
              <div className={`ws-settings__density-icons${mobile.gridDensity === 'comfortable' ? ' is-comfortable' : ''}`}>
                {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
              </div>
            </div>
          </div>
          <SettingsSelect label={t('Espaçamento dos aplicativos')} value={mobile.gridDensity}
            options={[["default", 'Padrão'], ["comfortable", 'Confortável']]}
            onChange={(gridDensity) => report(setMobilePreferences({ gridDensity }))}
            description={t('O modo Confortável aumenta a distância entre os aplicativos.')} />
          <p className="ws-settings__hint">{t('Essa configuração altera somente a grade de aplicativos do Mobile.')}</p>
        </SettingsCard>
        <WallpaperGallery shell="mobile" report={report} announce={announce} />
      </>
    );
  }

  /* === RESTAURAÇÃO === */
  if (activeSection === 'reset') {
    content = (
      <SettingsCard title={t('Restaurar preferências')} description={t('Retorne as configurações visuais aos valores originais sem apagar os dados dos aplicativos.')}>
        <div className="ws-settings__reset">
          <div className="ws-settings__restore-summary">
            <div><strong>{t('O que será restaurado')}</strong><p>{t('Tema, idioma, cores, efeitos, acessibilidade, barra de tarefas, densidade Mobile, seleção de wallpapers e tamanho/visibilidade dos widgets.')}</p></div>
            <div><strong>{t('O que será preservado')}</strong><p>{t('Arquivos, dados dos aplicativos, favoritos, imagens pessoais e posições de atalhos e widgets.')}</p></div>
          </div>
          {confirmReset ? (
            <div className="ws-settings__confirm" role="group" aria-label={t('Confirmar restauração')}
              onKeyDown={(event) => {
                if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeReset(); }
              }}>
              <p>{t('Deseja restaurar as preferências padrão? Os dados dos aplicativos não serão apagados.')}</p>
              <button ref={confirmRef} type="button" onClick={reset}>{t('Confirmar restauração')}</button>
              <button type="button" onClick={closeReset}>{t('Cancelar')}</button>
            </div>
          ) : (
            <button ref={resetButtonRef} type="button" className="ws-settings__reset-button" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={17} aria-hidden="true" />{t('Restaurar padrões')}
            </button>
          )}
        </div>
      </SettingsCard>
    );
  }

  return (
    <div className="ws-settings__stack">
      {content}
      <div role="status" aria-live="polite"
        className={message?.error ? 'ws-settings__message is-error' : 'ws-settings__message'}>
        {message ? t(message.text) : ''}
      </div>
    </div>
  );
}
