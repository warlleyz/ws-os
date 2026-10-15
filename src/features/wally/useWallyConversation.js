
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import { localWallyAnswer } from '../../services/wallyService';
import { askWallyRemote } from '../../services/wallyRemoteService';
import { portfolio, contentText } from '../../content/portfolioContent';
import { useLocale } from '../../shared/i18n/i18n';

const MAX_QUESTION_LENGTH = 1000;
const MAX_MESSAGES = 60;

const REMOTE_ENABLED =
    import.meta.env.VITE_WALLY_REMOTE_ENABLED === 'true';

export default function useWallyConversation() {
    const locale = useLocale();

    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('idle');
    const [provider, setProvider] = useState('local');
    const [lastError, setLastError] = useState(null);

    const messagesRef = useRef([]);
    const nextId = useRef(0);
    const busyRef = useRef(false);
    const abortRef = useRef(null);
    const generationRef = useRef(0);
    const pendingMessageIdRef = useRef(null);

    useEffect(() => {
        return () => {
            generationRef.current += 1;
            abortRef.current?.abort();
        };
    }, []);

    const createId = useCallback(() => {
        nextId.current += 1;
        return `wally-message-${nextId.current}`;
    }, []);

    const updateMessages = useCallback((next) => {
        messagesRef.current = next.slice(-MAX_MESSAGES);
        setMessages(messagesRef.current);
    }, []);

    const sendMessage = useCallback(async (value, options = {}) => {
        if (typeof value !== 'string' || busyRef.current) {
            return false;
        }

        const question = value.trim();

        if (!question || question.length > MAX_QUESTION_LENGTH) {
            return false;
        }

        busyRef.current = true;
        const generation = generationRef.current;

        setStatus('responding');
        setLastError(null);


        // Envia apenas pares completos de pergunta e resposta.
        // Perguntas canceladas não entram no contexto do Gemini.
        const completedHistory = [];

        for (let i = 0; i < messagesRef.current.length - 1; i += 1) {
            const user = messagesRef.current[i];
            const assistant = messagesRef.current[i + 1];

            if (
                user.role === 'user' &&
                !user.cancelled &&
                assistant.role === 'assistant'
            ) {
                completedHistory.push(
                    { role: 'user', text: user.text },
                    { role: 'assistant', text: assistant.text },
                );

                i += 1;
            }
        }

        const history = completedHistory.slice(-10).map((message) => ({
            role: message.role,
            text: message.text.slice(0, MAX_QUESTION_LENGTH),
        }));


        const userMessage = {
            id: createId(),
            role: 'user',
            text: question,
        };

        pendingMessageIdRef.current = userMessage.id;

        updateMessages([...messagesRef.current, userMessage]);

        let response;
        let remoteError = null;

        if (REMOTE_ENABLED && options.turnstileToken) {
            const controller = new AbortController();
            abortRef.current = controller;

            try {
                response = await askWallyRemote({
                    question,
                    history,
                    turnstileToken: options.turnstileToken,
                    signal: controller.signal,
                });
            } catch (error) {
                remoteError = error.message || 'REMOTE_UNAVAILABLE';
            } finally {
                if (abortRef.current === controller) {
                    abortRef.current = null;
                }
            }
        } else if (REMOTE_ENABLED) {
            remoteError = 'VERIFICATION_REQUIRED';
        }

        if (generation !== generationRef.current) {
            return false;
        }

        if (!response) {
            try {
                const summary = contentText(
                    portfolio.profile.summary,
                    locale,
                );

                response = {
                    ...localWallyAnswer(question, summary),
                    provider: 'local',
                };
            } catch {
                setStatus('error');
                busyRef.current = false;
                return false;
            }
        }

        updateMessages([
            ...messagesRef.current,
            {
                id: createId(),
                role: 'assistant',
                text: response.message,
                actions: Array.isArray(response.actions)
                    ? response.actions
                    : [],
                provider: response.provider,
            },
        ]);

        pendingMessageIdRef.current = null;

        setProvider(response.provider);
        setLastError(remoteError);
        setStatus('idle');
        busyRef.current = false;

        return true;
    }, [locale, createId, updateMessages]);



    const cancelResponse = useCallback(() => {
        if (!busyRef.current) return;

        generationRef.current += 1;

        const controller = abortRef.current;
        abortRef.current = null;
        busyRef.current = false;

        const pendingId = pendingMessageIdRef.current;
        pendingMessageIdRef.current = null;

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




    const clearConversation = useCallback(() => {
        generationRef.current += 1;
        abortRef.current?.abort();
        abortRef.current = null;
        busyRef.current = false;
        pendingMessageIdRef.current = null;
        updateMessages([]);
        setProvider('local');
        setLastError(null);
        setStatus('idle');
    }, [updateMessages]);

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
