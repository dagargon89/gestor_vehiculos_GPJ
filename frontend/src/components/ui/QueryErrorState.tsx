export function QueryErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-[16px] px-6 py-4"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
    >
      <p className="font-medium">Error al cargar {title}.</p>
      <p className="text-sm mt-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: '#ef4444', color: '#fff' }}
      >
        Reintentar
      </button>
    </div>
  );
}
