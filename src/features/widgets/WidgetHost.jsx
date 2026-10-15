
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { getWidgetDefinition } from '../../core/widgetManager';
import {
  ROW_STEP,
  getWidgetWidth,
} from '../../shells/desktop/desktopLayout';

import ClockWidget from './clock/ClockWidget';

// Registro dos componentes efetivamente implementados.
// Os demais serão adicionados individualmente nas próximas etapas.
const WIDGET_COMPONENTS = {
  clock: ClockWidget,
};

export default function WidgetHost({
  widget,
  desktopLayout,
  startWidgetDrag,
  moveWidgetDrag,
  finishWidgetDrag,
  changeWidgetSize,
  handleWidgetKeyDown,
}) {
  useLocale();

  const definition = getWidgetDefinition(widget.widgetId);
  const WidgetComponent = WIDGET_COMPONENTS[widget.widgetId];

  const placement =
    desktopLayout.widgets?.[widget.instanceId] ??
    (widget.widgetId === 'clock'
      ? desktopLayout.widget
      : null);

  // Não renderizar widgets sem componente ou sem posição válida.
  if (!definition || !WidgetComponent || !placement) {
    return null;
  }

  const sizeOptions = definition.allowedSizes ?? [];
  const widgetName = t(definition.name);

  return (
    <div
      className="desktop__widget"
      data-widget-id={widget.widgetId}
      data-widget-instance={widget.instanceId}
      data-widget-size={`${widget.size.columns}x${widget.size.rows}`}
      style={{
        position: 'absolute',
        left: placement.left,
        top: placement.top,
        width: getWidgetWidth(
          widget.size.columns,
          desktopLayout,
        ),
        height: widget.size.rows * ROW_STEP,
      }}
    >
      <div className="desktop__widget-controls">
        <button
          type="button"
          className="desktop__widget-drag"
          aria-label={t(`Arrastar ${definition.name}`)}
          title={t('Arrastar ou usar as setas para mover')}

          onKeyDown={(event) =>
            handleWidgetKeyDown(event, widget.instanceId)
          }
          onPointerDown={(event) =>
            startWidgetDrag(event, widget.instanceId)
          }

          onPointerMove={moveWidgetDrag}
          onPointerUp={finishWidgetDrag}
          onPointerCancel={finishWidgetDrag}
          onLostPointerCapture={finishWidgetDrag}
          onDragStart={(event) => event.preventDefault()}
        >
          {t('Arrastar')}
        </button>

        <label className="desktop__widget-size">
          <span>{t('Tamanho')}</span>

          <select
            aria-label={`${t('Tamanho')} — ${widgetName}`}
            value={`${widget.size.columns}x${widget.size.rows}`}
            onChange={(event) =>
              changeWidgetSize(
                widget.instanceId,
                event.target.value,
              )
            }
          >
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size.replace('x', ' × ')}
              </option>
            ))}
          </select>
        </label>
      </div>

      <WidgetComponent />
    </div>
  );
}
