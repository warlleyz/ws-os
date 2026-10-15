
import { useCallback, useRef, useState } from 'react';

import { localWallyAnswer } from '../../services/wallyService';
import { portfolio, contentText } from '../../content/portfolioContent';
import { useLocale } from '../../shared/i18n/i18n';

const MAX_QUESTION_LENGTH = 1000;
const MAX_MESSAGES = 60;

export default function useWallyConversation() {
    const locale = useLocale();

    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('idle');
    const nextId = useRef(0);

    const createId = useCallback(() => {
        nextId.current += 1;
        return `wally-message-${nextId.current}`;
    }, []);

    const sendMessage = useCallback(
        (value) => {
            if (typeof value !== 'string') return false;

            const question = value.trim();

            if (
                question.length === 0 ||
                question.length > MAX_QUESTION_LENGTH
            ) {
                return false;
            }

            setStatus('responding');

            try {
                const summary = contentText(
                    portfolio.profile.summary,
                    locale,
                );

                const response = localWallyAnswer(question, summary);

                const userMessage = {
                    id: createId(),
                    role: 'user',
                    text: question,
                };

                const assistantMessage = {
                    id: createId(),
                    role: 'assistant',
                    text: response.message,
                    actions: Array.isArray(response.actions)
                        ? response.actions
                        : [],
                    provider: 'local',
                };

                setMessages((current) =>
                    [...current, userMessage, assistantMessage].slice(
                        -MAX_MESSAGES,
                    ),
                );

                setStatus('idle');
                return true;
            } catch {
                setStatus('error');
                return false;
            }
        },
        [locale, createId],
    );

    const clearConversation = useCallback(() => {
        setMessages([]);
        setStatus('idle');
    }, []);

    return {
        messages,
        status,
        sendMessage,
        clearConversation,
        provider: 'local',
        maxQuestionLength: MAX_QUESTION_LENGTH,
    };
}
