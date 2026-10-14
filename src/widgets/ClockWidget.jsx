import { useEffect, useState } from 'react';

export default function ClockWidget() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    return (
        <section
            className="ws-widget ws-widget--clock"
            aria-label="Widget de relógio"
        >
            <time dateTime={now.toISOString()}>
                {now.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </time>

            <span>
                {now.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                })}
            </span>
        </section>
    );
}

