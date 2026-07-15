import { describe, it, expect, vi } from 'vitest';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('lib/toast', () => {
  it('notifySuccess delega en toast.success', async () => {
    const { notifySuccess } = await import('./toast');
    notifySuccess('Guardado correctamente');
    expect(toast.success).toHaveBeenCalledWith('Guardado correctamente');
  });

  it('notifyError delega en toast.error', async () => {
    const { notifyError } = await import('./toast');
    notifyError('Algo salió mal');
    expect(toast.error).toHaveBeenCalledWith('Algo salió mal');
  });
});
