import { Modal } from './Modal';

export function ConfirmDialog({
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-sm">
      <p className="text-sm mb-6" style={{ color: 'var(--color-text)' }}>{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 px-4 py-2 rounded-lg text-white"
          style={{ background: danger ? '#ef4444' : 'var(--color-primary)' }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
