import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { getWidgetDefinition } from '../../core/widgetManager';
import { ROW_STEP, getWidgetWidth } from '../../shells/desktop/desktopLayout';

import ClockWidget from './clock/ClockWidget';
import CalendarWidget from './calendar/CalendarWidget';
import WeatherWidget from './weather/WeatherWidget';
import DevInsightsWidget from './dev-insights/DevInsightsWidget';
import { GripVertical } from 'lucide-react';

// Registro dos componentes efetivamente implementados.
// Os demais serão adicionados individualmente nas próximas etapas.
const WIDGET_COMPONENTS = {
  clock: ClockWidget,
  calendar: CalendarWidget,
  weather: WeatherWidget,
  'dev-insights': DevInsightsWidget,
};

export default function WidgetHost({
  widget,
  desktopLayout,
  weatherData,
  startWidgetDrag,
  moveWidgetDrag,
  finishWidgetDrag,
  handleWidgetKeyDown,
  onWidgetContextMenu,
}) {
  useLocale();

  const definition = getWidgetDefinition(widget.widgetId);
  const WidgetComponent = WIDGET_COMPONENTS[widget.widgetId];

  const placement =
    desktopLayout.widgets?.[widget.instanceId] ??
    (widget.widgetId === 'clock' ? desktopLayout.widget : null);

  // Não renderizar widgets sem componente ou sem posição válida.
  if (!definition || !WidgetComponent || !placement) {
    return null;
  }

  return (
    <div
      className="desktop__widget"
      data-widget-id={widget.widgetId}
      data-widget-instance={widget.instanceId}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onWidgetContextMenu?.(event, widget);
      }}
      data-widget-size={`${widget.size.columns}x${widget.size.rows}`}
      style={{
        position: 'absolute',
        left: placement.left,
        top: placement.top,
        width: getWidgetWidth(widget.size.columns, desktopLayout),
        height: widget.size.rows * ROW_STEP,
      }}
    >
      <button
        type="button"
        className="desktop__widget-grip"
        aria-label={t(`Mover ${definition.name}`)}
        title={t('Arrastar ou usar as setas para mover')}
        onKeyDown={(event) => handleWidgetKeyDown(event, widget.instanceId)}
        onPointerDown={(event) => startWidgetDrag(event, widget.instanceId)}
        onPointerMove={moveWidgetDrag}
        onPointerUp={finishWidgetDrag}
        onPointerCancel={finishWidgetDrag}
        onLostPointerCapture={finishWidgetDrag}
        onDragStart={(event) => event.preventDefault()}
      >
        <GripVertical size={15} aria-hidden="true" />
      </button>

      <WidgetComponent weatherData={weatherData} />
    </div>
  );
}
