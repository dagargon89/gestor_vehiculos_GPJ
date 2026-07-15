import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryErrorState } from './QueryErrorState';

describe('QueryErrorState', () => {
  it('muestra el título y el mensaje de error', () => {
    render(<QueryErrorState title="Vehículos" message="Network Error" onRetry={() => {}} />);
    expect(screen.getByText('Error al cargar Vehículos.')).toBeInTheDocument();
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  it('llama a onRetry al hacer click en Reintentar', () => {
    const onRetry = vi.fn();
    render(<QueryErrorState title="Vehículos" message="Network Error" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
