import { useEffect, useState } from 'react';

/* === PAUSA AUTOMÁTICA DOS JOGOS === */
export default function useGamePaused(instance) {
    const [visible, setVisible] = useState(
        () => typeof document === 'undefined' || !document.hidden,
    );

    /* ----- VISIBILIDADE DO NAVEGADOR ----- */
    useEffect(() => {
        const updateVisibility = () => {
            setVisible(!document.hidden);
        };

        document.addEventListener('visibilitychange', updateVisibility);

        return () => {
            document.removeEventListener('visibilitychange', updateVisibility);
        };
    }, []);

    /* ----- ESTADO DE EXECUÇÃO DO SISTEMA ----- */
    return !visible || instance?.executionState === 'paused';
}