import { useLayoutEffect, useState } from 'react';
import { getWindowMotionDuration } from '../../core/windowLifecycle';

/* === Gerenciamento das animações das janelas === */
export default function useWindowMotion(instance, mode) {

  /* ----- Configuração das animações ----- */
  const duration = getWindowMotionDuration();
  const closing = instance.closing === true;

  /* ----- Estado inicial da apresentação ----- */
  const [motion, setMotion] = useState(() => ({
    minimized: instance.minimized,
    closing,
    mode,
    duration,
    phase: instance.minimized
      ? 'hidden'
      : duration
        ? 'opening'
        : 'idle',
    cycle: 0,
  }));

  /* === Sincronização dos estados === */
  /* ----- Atualizar fase da animação ----- */
  let current = motion;

  if (
    motion.minimized !== instance.minimized ||
    motion.closing !== closing ||
    motion.mode !== mode ||
    motion.duration !== duration
  ) {
    let phase = instance.minimized ? 'hidden' : 'idle';

    if (duration && !closing) {
      if (motion.minimized !== instance.minimized) {
        phase = instance.minimized ? 'minimizing' : 'restoring';
      } else if (motion.mode !== mode && !instance.minimized) {
        phase = 'restoring';
      }
    }

    current = {
      minimized: instance.minimized,
      closing,
      mode,
      duration,
      phase,
      cycle: motion.cycle + 1,
    };

    setMotion(current);
  }

  /* === Ciclo das animações === */
  /* ----- Finalizar animações temporárias ----- */
  useLayoutEffect(() => {
    if (
      !['opening', 'restoring', 'minimizing'].includes(motion.phase)
    ) {
      return undefined;
    }

    const timer = setTimeout(
      () => {
        setMotion((latest) =>
          latest.cycle === motion.cycle
            ? {
              ...latest,
              phase: latest.minimized ? 'hidden' : 'idle',
            }
            : latest,
        );
      },
      motion.duration,
    );

    return () => clearTimeout(timer);
  }, [motion]);

  /* === Apresentação da janela === */
  return {
    phase: closing ? 'closing' : current.phase,
    duration,
    visible:
      !instance.minimized ||
      current.phase === 'minimizing',
  };
}