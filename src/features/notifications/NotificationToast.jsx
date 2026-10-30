
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  TriangleAlert,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

/* === CONFIGURAÇÕES DAS NOTIFICAÇÕES === */
/* ----- Duração das etapas ----- */
const COMPACT_DURATION = 220;
const EXPAND_DURATION = 300;
const READ_DURATION = 2500;
const COLLAPSE_DURATION = 200;
const LEAVE_DURATION = 260;

/* ----- Ícones por tipo ----- */
const TYPE_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
};

/* ----- Rótulos por tipo ----- */
const TYPE_LABELS = {
  info: 'Informação',
  success: 'Sucesso',
  warning: 'Atenção',
  error: 'Erro',
};

/* === COMPONENTE DE NOTIFICAÇÃO TEMPORÁRIA === */
export function NotificationToast({ notification, onDismiss, onAction }) {
  useLocale();
  const [phase, setPhase] = useState('compact');
  const phaseRef = useRef('compact');
  const hoveringRef = useRef(false);
  const remainingRef = useRef(READ_DURATION);
  const startedRef = useRef(null);
  const timerRef = useRef(null);
  const dismissRef = useRef(onDismiss);

  /* ----- Atualização da função de descarte ----- */
  useLayoutEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  const Icon = TYPE_ICONS[notification.type] ?? Info;

  /* === GERENCIAMENTO DAS FASES === */
  /* ----- Alteração da fase atual ----- */
  const changePhase = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  /* ----- Limpeza do temporizador ----- */
  const clearTimer = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  /* === CONTROLE DO TEMPO DE LEITURA === */
  /* ----- Pausar a contagem ----- */
  const pauseReading = useCallback(() => {
    if (startedRef.current === null) return;
    remainingRef.current = Math.max(
      0,
      remainingRef.current - (Date.now() - startedRef.current),
    );
    startedRef.current = null;
    clearTimer();
  }, [clearTimer]);

  /* ----- Iniciar recolhimento e saída ----- */
  const startCollapse = useCallback(() => {
    if (phaseRef.current === 'collapsing' || phaseRef.current === 'leaving') {
      return;
    }
    clearTimer();
    startedRef.current = null;
    changePhase('collapsing');
    timerRef.current = window.setTimeout(() => {
      changePhase('leaving');
      timerRef.current = window.setTimeout(() => {
        dismissRef.current(notification.id);
      }, LEAVE_DURATION);
    }, COLLAPSE_DURATION);
  }, [changePhase, clearTimer, notification.id]);

  /* ----- Retomar a contagem ----- */
  const resumeReading = useCallback(() => {
    if (
      phaseRef.current !== 'expanded' ||
      hoveringRef.current ||
      startedRef.current !== null
    ) {
      return;
    }
    if (remainingRef.current <= 0) {
      startCollapse();
      return;
    }
    startedRef.current = Date.now();
    timerRef.current = window.setTimeout(() => {
      startedRef.current = null;
      remainingRef.current = 0;
      startCollapse();
    }, remainingRef.current);
  }, [startCollapse]);

  /* === CICLO DE VIDA DA NOTIFICAÇÃO === */
  /* ----- Entrada, expansão e leitura ----- */
  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      changePhase('expanding');
      timerRef.current = window.setTimeout(() => {
        changePhase('expanded');
        resumeReading();
      }, EXPAND_DURATION);
    }, COMPACT_DURATION);
    return () => clearTimer();
  }, [changePhase, clearTimer, resumeReading]);

  /* === INTERAÇÕES DO USUÁRIO === */
  /* ----- Pausar ao passar o mouse ou receber foco ----- */
  function handlePause() {
    hoveringRef.current = true;
    pauseReading();
  }

  /* ----- Retomar ao retirar o mouse ----- */
  function handleResume(event) {
    if (
      event?.currentTarget?.contains(document.activeElement) &&
      document.activeElement !== document.body
    ) {
      return;
    }
    hoveringRef.current = false;
    resumeReading();
  }

  /* ----- Retomar quando o foco sair da notificação ----- */
  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      hoveringRef.current = false;
      if (!event.currentTarget.matches(':hover')) {
        resumeReading();
      }
    }
  }

  /* === RENDERIZAÇÃO DA NOTIFICAÇÃO === */
  return (
    <article
      className={`ws-toast ws-toast--${notification.type} ws-toast--${phase}`}
      role={notification.type === 'error' ? 'alert' : 'status'}
      aria-label={t(`Notificação: ${notification.title}`)}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocusCapture={handlePause}
      onBlurCapture={handleBlur}
    >
      {/* ----- Conteúdo principal ----- */}
      <div className="ws-toast__body">
        <div className="ws-toast__content">
          <div className="ws-toast__header">
            <span className="ws-toast__source">
              {t(notification.source)}
            </span>
            <span className="ws-toast__type">
              {t(TYPE_LABELS[notification.type] ?? 'Informação')}
            </span>
          </div>

          {/* ----- Título e mensagem ----- */}
          <strong className="ws-toast__title">
            {t(notification.title)}
          </strong>
          {notification.message && (
            <p className="ws-toast__message">
              {t(notification.message)}
            </p>
          )}

          {/* ----- Ação da notificação ----- */}
          {notification.action?.type === 'open-app' && (
            <button
              type="button"
              className="ws-toast__action"
              onClick={() => onAction(notification)}
            >
              <ExternalLink size={13} aria-hidden="true" />
              {t(notification.action.label ?? 'Abrir aplicativo')}
            </button>
          )}
        </div>

        {/* ----- Botão de descarte ----- */}
        <button
          type="button"
          className="ws-toast__close"
          aria-label={t('Dispensar')}
          onClick={startCollapse}
        >
          <X size={15} />
        </button>
      </div>

      {/* ----- Ícone de identificação ----- */}
      <span className="ws-toast__icon" aria-hidden="true">
        <Icon size={21} strokeWidth={1.8} />
      </span>
    </article>
  );
}
