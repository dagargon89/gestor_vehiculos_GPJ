import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable } from './DataTable';

type Row = { id: string; name: string };

describe('DataTable', () => {
  it('renderiza encabezados y filas', () => {
    render(
      <DataTable<Row>
        columns={[{ key: 'name', header: 'Nombre', render: (r) => r.name }]}
        rows={[{ id: '1', name: 'Ana' }]}
        getRowKey={(r) => r.id}
        emptyMessage="No hay datos."
      />,
    );
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('muestra emptyMessage cuando rows está vacío', () => {
    render(
      <DataTable<Row>
        columns={[{ key: 'name', header: 'Nombre', render: (r) => r.name }]}
        rows={[]}
        getRowKey={(r) => r.id}
        emptyMessage="No hay datos."
      />,
    );
    expect(screen.getByText('No hay datos.')).toBeInTheDocument();
  });
});
