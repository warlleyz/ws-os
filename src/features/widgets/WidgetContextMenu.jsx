
import { useState } from 'react';
import {
    Check,
    ChevronLeft,
    ChevronRight,
    EyeOff,
    Maximize2,
    RotateCcw,
    Settings2,
} from 'lucide-react';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import useMenuNavigation from '../../shared/hooks/useMenuNavigation';
import useContextMenuPosition from '../../shells/desktop/useContextMenuPosition';
import { getWidgetDefinition } from '../../core/widgetManager';

export default function WidgetContextMenu({
    menuRef,
    context,
    widget,
    onAction,
}) {
    useLocale();

    const [page, setPage] = useState('main');
    const position = useContextMenuPosition(menuRef, context);
    const definition = getWidgetDefinition(widget.widgetId);

    useMenuNavigation(
        menuRef,
        `${widget.instanceId}:${page}`,
    );

    if (!definition) return null;

    const currentSize = `${widget.size.columns}x${widget.size.rows}`;

    return (
        <div
            ref={menuRef}
            className="desktop__context desktop__context--modern"
            style={position}
            role="group"
            aria-label={t(`Opções de ${definition.name}`)}
        >
            {page === 'main' ? (
                <>
                    <div className="desktop__context-header">
                        <Settings2 size={17} aria-hidden="true" />
                        <strong>{t(definition.name)}</strong>
                    </div>

                    <div className="desktop__context-divider" />

                    <button
                        type="button"
                        onClick={() =>
                            onAction('personalize', widget.instanceId)
                        }
                    >
                        <Settings2 size={16} aria-hidden="true" />
                        <span>{t('Personalizar widget')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPage('sizes')}
                    >
                        <Maximize2 size={16} aria-hidden="true" />
                        <span>{t('Alterar tamanho')}</span>
                        <ChevronRight
                            size={15}
                            className="desktop__context-arrow"
                            aria-hidden="true"
                        />
                    </button>

                    <div className="desktop__context-divider" />

                    <button
                        type="button"
                        onClick={() =>
                            onAction('hide', widget.instanceId)
                        }
                    >
                        <EyeOff size={16} aria-hidden="true" />
                        <span>{t('Ocultar widget')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            onAction('reset', widget.instanceId)
                        }
                    >
                        <RotateCcw size={16} aria-hidden="true" />
                        <span>{t('Restaurar padrão')}</span>
                    </button>
                </>
            ) : (
                <>
                    <button
                        type="button"
                        className="desktop__context-back"
                        onClick={() => setPage('main')}
                    >
                        <ChevronLeft size={16} aria-hidden="true" />
                        <span>{t('Alterar tamanho')}</span>
                    </button>

                    <div className="desktop__context-divider" />

                    {definition.allowedSizes.map((size) => (
                        <button
                            key={size}
                            type="button"
                            aria-pressed={size === currentSize}
                            onClick={() =>
                                onAction('size', widget.instanceId, size)
                            }
                        >
                            <span>{size.replace('x', ' × ')}</span>

                            {size === currentSize && (
                                <Check size={16} aria-hidden="true" />
                            )}
                        </button>
                    ))}
                </>
            )}
        </div>
    );
}
