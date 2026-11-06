import { useCallback, useEffect, useRef, useState } from 'react';

import { askWallyRemote } from '../../services/wallyRemoteService';
import { useLocale } from '../../shared/i18n/i18n';

const MAX_QUESTION_LENGTH = 1000;
const MAX_MESSAGES = 60;
const MAX_HISTORY_MESSAGES = 10;

const REMOTE_ENABLED = import.meta.env.VITE_WALLY_REMOTE_ENABLED === 'true';

/* === CONTROLADOR DE CONVERSA DO WALLY === */
export default function useWallyConversation() {
  const locale = useLocale();

  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [provider, setProvider] = useState(null);
  const [lastError, setLastError] = useState(null);

  const messagesRef = useRef([]);
  const nextId = useRef(0);
  const busyRef = useRef(false);
  const abortRef = useRef(null);
  const generationRef = useRef(0);
  const pendingMessageIdRef = useRef(null);

  /* === CICLO DE VIDA === */

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  /* ----- Identificação de mensagens ----- */
  const createId = useCallback(() => {
    nextId.current += 1;
    return `wally-message-${nextId.current}`;
  }, []);

  /* ----- Atualização do histórico compartilhado ----- */
  const updateMessages = useCallback((next) => {
    messagesRef.current = next.slice(-MAX_MESSAGES);
    setMessages(messagesRef.current);
  }, []);

  /* === HISTÓRICO PARA O GEMINI === */
  const getCompletedHistory = useCallback(() => {
    const completedHistory = [];
    const currentMessages = messagesRef.current;

    for (let i = 0; i < currentMessages.length - 1; i += 1) {
      const user = currentMessages[i];
      const assistant = currentMessages[i + 1];

      if (
        user.role === 'user' &&
        !user.cancelled &&
        !user.failed &&
        assistant.role === 'assistant' &&
        assistant.provider === 'gemini' &&
        typeof assistant.text === 'string' &&
        assistant.text.trim()
      ) {
        completedHistory.push(
          { role: 'user', text: user.text },
          { role: 'assistant', text: assistant.text },
        );

        i += 1;
      }
    }

    return completedHistory
      .slice(-MAX_HISTORY_MESSAGES)
      .map((message) => ({
        role: message.role,
        text: message.text.slice(0, MAX_QUESTION_LENGTH),
      }));
  }, []);

  /* === ENVIO DE MENSAGENS === */
  const sendMessage = useCallback(
    async (value, options = {}) => {
      if (typeof value !== 'string' || busyRef.current) {
        return false;
      }

      const question = value.trim();

      if (!question || question.length > MAX_QUESTION_LENGTH) {
        return false;
      }

      /* ----- Verificar disponibilidade da integração ----- */
      if (!REMOTE_ENABLED) {
        setLastError('AI_DISABLED');
        setStatus('error');
        return false;
      }

      /* ----- Exigir verificação antes do envio ----- */
      if (!options.turnstileToken) {
        setLastError('VERIFICATION_REQUIRED');
        setStatus('error');
        return false;
      }

      busyRef.current = true;

      const generation = generationRef.current;
      const controller = new AbortController();

      abortRef.current = controller;

      setStatus('responding');
      setLastError(null);

      /* ----- Preparar contexto anterior ----- */
      const history = getCompletedHistory();

      /* ----- Registrar pergunta do visitante ----- */
      const userMessage = {
        id: createId(),
        role: 'user',
        text: question,
      };

      pendingMessageIdRef.current = userMessage.id;

      updateMessages([...messagesRef.current, userMessage]);

      try {

        /* ----- Consultar exclusivamente o Gemini ----- */
        const response = await askWallyRemote({
          question,
          locale,
          history,
          turnstileToken: options.turnstileToken,
          signal: controller.signal,
        });

        /* ----- Ignorar resultados de operações canceladas ----- */
        if (
          generation !== generationRef.current ||
          controller.signal.aborted
        ) {
          return false;
        }

        /* ----- Validar a resposta remota ----- */
        if (
          response?.provider !== 'gemini' ||
          typeof response.message !== 'string' ||
          !response.message.trim()
        ) {
          throw new Error('INVALID_SERVER_RESPONSE');
        }

        /* ----- Adicionar resposta da IA ----- */
        updateMessages([
          ...messagesRef.current,
          {
            id: createId(),
            role: 'assistant',
            text: response.message,
            actions: [],
            provider: 'gemini',
          },
        ]);

        pendingMessageIdRef.current = null;

        setProvider('gemini');
        setLastError(null);
        setStatus('idle');

        return true;
      } catch (error) {
        if (generation !== generationRef.current) {
          return false;
        }

        /* ----- Manter a pergunta e identificar a falha ----- */
        const pendingId = pendingMessageIdRef.current;

        if (pendingId) {
          updateMessages(
            messagesRef.current.map((message) =>
              message.id === pendingId
                ? { ...message, failed: true }
                : message,
            ),
          );
        }

        pendingMessageIdRef.current = null;

        const errorCode =
          controller.signal.aborted
            ? 'AI_TIMEOUT'
            : error?.message || 'REMOTE_UNAVAILABLE';

        setLastError(errorCode);
        setStatus('error');

        return false;
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }

        if (generation === generationRef.current) {
          busyRef.current = false;
        }
      }
    },
    [locale, createId, updateMessages, getCompletedHistory],
  );

  /* === CANCELAMENTO === */
  const cancelResponse = useCallback(() => {
    if (!busyRef.current) return;

    generationRef.current += 1;

    const controller = abortRef.current;
    abortRef.current = null;
    busyRef.current = false;

    const pendingId = pendingMessageIdRef.current;
    pendingMessageIdRef.current = null;

    /* ----- Identificar pergunta cancelada ----- */
    if (pendingId) {
      updateMessages(
        messagesRef.current.map((message) =>
          message.id === pendingId
            ? { ...message, cancelled: true }
            : message,
        ),
      );
    }

    controller?.abort();

    setStatus('idle');
    setLastError(null);
  }, [updateMessages]);

  /* === LIMPEZA DA CONVERSA === */
  const clearConversation = useCallback(() => {
    generationRef.current += 1;

    abortRef.current?.abort();
    abortRef.current = null;

    busyRef.current = false;
    pendingMessageIdRef.current = null;

    updateMessages([]);

    setProvider(null);
    setLastError(null);
    setStatus('idle');
  }, [updateMessages]);

  /* === CONTRATO PÚBLICO DO CONTROLADOR === */
  return {
    messages,
    status,
    provider,
    lastError,
    remoteEnabled: REMOTE_ENABLED,
    sendMessage,
    cancelResponse,
    clearConversation,
    maxQuestionLength: MAX_QUESTION_LENGTH,
  };
}