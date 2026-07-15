import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renderiza título y contenido con role="dialog"', () => {
    render(
      <Modal title="Editar usuario" onClose={() => {}}>
        <button>Guardar</button>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Editar usuario')).toBeInTheDocument();
  });

  it('llama a onClose al presionar Escape', () => {
    const onClose = vi.fn();
    render(<Modal title="X" onClose={onClose}><button>ok</button></Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('llama a onClose al hacer click en el overlay pero no al hacer click dentro del diálogo', () => {
    const onClose = vi.fn();
    render(
      <Modal title="X" onClose={onClose}>
        <button>Contenido</button>
      </Modal>,
    );
    fireEvent.click(screen.getByText('Contenido'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('enfoca el primer control interactivo al montar', () => {
    render(
      <Modal title="X" onClose={() => {}}>
        <input placeholder="primero" />
        <button>segundo</button>
      </Modal>,
    );
    expect(screen.getByPlaceholderText('primero')).toHaveFocus();
  });
});
