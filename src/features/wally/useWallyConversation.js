
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

        const history = messagesRef.current
            .filter((message) =>
                message.role === 'user' ||
                message.role === 'assistant'
            )
            .slice(-10)
            .map((message) => ({
                role: message.role,
                text: message.text.slice(0, MAX_QUESTION_LENGTH),
            }));

        const userMessage = {
            id: createId(),
            role: 'user',
            text: question,
        };

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
                abortRef.current = null;
            }
        } else if (REMOTE_ENABLED) {
            remoteError = 'VERIFICATION_REQUIRED';
        }

        if (generation !== generationRef.current) {
            busyRef.current = false;
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

        setProvider(response.provider);
        setLastError(remoteError);
        setStatus('idle');
        busyRef.current = false;

        return true;
    }, [locale, createId, updateMessages]);

    const clearConversation = useCallback(() => {
        generationRef.current += 1;
        abortRef.current?.abort();
        abortRef.current = null;
        busyRef.current = false;

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
        clearConversation,
        maxQuestionLength: MAX_QUESTION_LENGTH,
    };
}
