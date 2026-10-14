export default function PanelLayer({ layerRef, children }) {
  return (
    <div ref={layerRef} className="taskbar-floating-layer">
      {children}
    </div>
  );
}
