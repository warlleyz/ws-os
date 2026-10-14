export default function AppHost({ appName, instance }) {
  return (
    <div className="desktop-window__content">
      <h2>{appName}</h2>
      <p>Aplicativo em desenvolvimento.</p>
      <small>Instância: {instance.id.slice(0, 8)}</small>
    </div>
  );
}
