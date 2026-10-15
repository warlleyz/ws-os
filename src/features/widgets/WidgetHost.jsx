import { translate as t, useLocale } from '../../shared/i18n/i18n';
import {
  ROW_STEP,
  getWidgetWidth,
} from '../../shells/desktop/desktopLayout';
import ClockWidget from './clock/ClockWidget';

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
  return (
    <div
      key={widget.instanceId}
      className="desktop__widget"
      data-widget-id={widget.widgetId}
      data-widget-size={`${widget.size.columns}x${widget.size.rows}`}
      style={{
        position: 'absolute',
        left: desktopLayout.widget.left,
        top: desktopLayout.widget.top,
        width: getWidgetWidth(widget.size.columns, desktopLayout),
        height: widget.size.rows * ROW_STEP,
      }}
    >
      <div className="desktop__widget-controls">
        <button
          type="button"
          className="desktop__widget-drag"
          aria-label={t('Arrastar relógio')}
          title={t('Arrastar relógio ou usar as setas para mover')}
          onKeyDown={handleWidgetKeyDown}
          onPointerDown={startWidgetDrag}
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
            aria-label={t('Tamanho do relógio')}
            value={`${widget.size.columns}x${widget.size.rows}`}
            onChange={(event) => changeWidgetSize(event.target.value)}
          >
            <option value="2x2">2 × 2</option>
            <option value="3x2">3 × 2</option>
            <option value="3x3">3 × 3</option>
          </select>
        </label>
      </div>

      <ClockWidget />
    </div>
  );
}
