import { useEffect, useState } from 'react';
import { verifyAdminSession } from '../../services/authService';
import '../../styles/apps.css';

export default function Administration() {
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        let active = true;

        verifyAdminSession().then((authorized) => {
            if (active) setStatus(authorized ? 'authorized' : 'denied');
        });

        return () => {
            active = false;
        };
    }, []);

    if (status === 'checking') {
        return (
            <article className="desktop-window__content ws-app">
                <p>Verificando autorização administrativa...</p>
            </article>
        );
    }

    if (status === 'denied') {
        return (
            <article className="desktop-window__content ws-app">
                <h2>Acesso negado</h2>
                <p>É necessário realizar a autenticação administrativa.</p>
            </article>
        );
    }

    return (
        <article className="desktop-window__content ws-app">
            <h2>Administração</h2>
            <p>Sessão administrativa verificada.</p>
            <p>O painel de gerenciamento será implementado nas próximas etapas.</p>
        </article>
    );
}