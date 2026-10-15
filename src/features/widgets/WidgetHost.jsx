import { COLUMN_STEP } from '../../shells/desktop/desktopLayout';
import { ROW_STEP } from '../../shells/desktop/desktopLayout';
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
        width: widget.size.columns * COLUMN_STEP,
        height: widget.size.rows * ROW_STEP,
      }}
    >
      <div className="desktop__widget-controls">
        <button
          type="button"
          className="desktop__widget-drag"
          aria-label="Arrastar relógio"
          title="Arrastar relógio ou usar as setas para mover"
          onKeyDown={handleWidgetKeyDown}
          onPointerDown={startWidgetDrag}
          onPointerMove={moveWidgetDrag}
          onPointerUp={finishWidgetDrag}
          onPointerCancel={finishWidgetDrag}
          onLostPointerCapture={finishWidgetDrag}
          onDragStart={(event) => event.preventDefault()}
        >
          Arrastar
        </button>

        <label className="desktop__widget-size">
          <span>Tamanho</span>
          <select
            aria-label="Tamanho do relógio"
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
