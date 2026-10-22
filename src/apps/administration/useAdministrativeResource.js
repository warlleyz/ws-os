import { useEffect, useRef, useState } from 'react';
import { getAdminSessionVersion, subscribeAdminSession } from '../../services/authService';
import useUnsavedChanges from '../../shared/hooks/useUnsavedChanges';

/* === Ciclo privado: cancelamento, paginação e confirmação de mutações === */
export default function useAdministrativeResource({ authorized, instanceId, dirty, loadPage }) {
  const [items, setItems] = useState([]);
  const [nextOffset, setNextOffset] = useState(null);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const active = useRef(null);
  const mounted = useRef(false);
  useUnsavedChanges(instanceId, dirty || busy);
  useEffect(() => {
    mounted.current = true;
    const unsubscribe = subscribeAdminSession(() => {
      active.current?.abort();
      setItems([]);
      setNextOffset(null);
      setMessage('');
    });
    return () => {
      mounted.current = false;
      active.current?.abort();
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!authorized) active.current?.abort();
  }, [authorized]);
  async function perform(operation, success = '', clearMessage = true) {
    if (!authorized || active.current) return null;
    const controller = new AbortController();
    active.current = controller;
    const version = getAdminSessionVersion();
    setBusy(true);
    if (clearMessage) setMessage('');
    try {
      const result = await operation(controller.signal);
      if (!mounted.current || controller.signal.aborted || version !== getAdminSessionVersion())
        return null;
      if (success) setMessage(success);
      return result;
    } catch (error) {
      if (mounted.current && !controller.signal.aborted && version === getAdminSessionVersion())
        setMessage(
          error.code === 'CONFLICT'
            ? 'O conteúdo mudou em outra janela. Atualize a lista.'
            : error.code === 'HTTP_RESULT_UNKNOWN'
              ? 'Operação não confirmada. Atualize a lista antes de repetir.'
              : 'Não foi possível concluir a operação.',
        );
      return null;
    } finally {
      if (active.current === controller) active.current = null;
      if (mounted.current) setBusy(false);
    }
  }
  async function load(next = 0, preserveMessage = false) {
    if (!Number.isSafeInteger(next) || next < 0) return;
    const result = await perform(
      (signal) => loadPage({ signal, offset: next }),
      '',
      !preserveMessage,
    );
    if (result) {
      setItems(result.items);
      setNextOffset(result.nextOffset);
      setOffset(next);
    }
  }
  return { items: authorized ? items : [], nextOffset, offset, busy, message, load, perform };
}
