import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { notifySuccess, notifyError } from '../../lib/toast';
import { ViewToggle, getStoredView, type ViewMode } from '../../components/ui/ViewToggle';
import { useDataTable } from '../../hooks/useDataTable';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
import { QueryErrorState } from '../../components/ui/QueryErrorState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';

type Provider = {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
};

function ProviderFormModal({
  provider,
  onClose,
  onSuccess,
}: {
  provider: Provider | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: provider?.name ?? '',
    contactName: provider?.contactName ?? '',
    phone: provider?.phone ?? '',
    email: provider?.email ?? '',
    address: provider?.address ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        contactName: form.contactName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
      };
      if (provider) {
        await apiClient.put(`/providers/${provider.id}`, payload);
      } else {
        await apiClient.post('/providers', payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Error al guardar';
      setError(String(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={provider ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Nombre *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Contacto</label>
          <input
            type="text"
            value={form.contactName}
            onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
            className="input-field w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Teléfono</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input-field w-full"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Dirección</label>
          <textarea
            rows={2}
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="input-field w-full"
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
            {submitting ? 'Guardando...' : provider ? 'Guardar cambios' : 'Crear proveedor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ProvidersList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(() => getStoredView('providersView'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);

  const { data: providers = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await apiClient.get('/providers');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/providers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      notifySuccess('Proveedor eliminado correctamente.');
    },
    onError: () => notifyError('No se pudo eliminar el proveedor.'),
  });

  const openCreate = () => {
    setEditingProvider(null);
    setModalOpen(true);
  };

  const openEdit = (p: Provider) => {
    setEditingProvider(p);
    setModalOpen(true);
  };

  const handleDelete = (p: Provider) => {
    setDeleteTarget(p);
  };

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    paginatedData: paginatedProviders,
    filteredData,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = useDataTable<Provider>(providers, {
    pageSize: 25,
    searchFields: (p) => [p.name, p.contactName ?? '', p.email ?? ''],
  });

  const exportHeaders = ['Nombre', 'Contacto', 'Teléfono', 'Email'];
  const getExportRows = (list: Provider[]) =>
    list.map((p) => [p.name, p.contactName ?? '—', p.phone ?? '—', p.email ?? '—']);

  if (isLoading) return <div className="text-primary font-bold">Cargando proveedores...</div>;

  if (isError) {
    return (
      <QueryErrorState
        title="proveedores"
        message={error instanceof Error ? error.message : 'Error desconocido'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wide" style={{ color: 'var(--color-text)' }}>Proveedores</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Talleres, agencias y servicios para la flota.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewToggle value={view} onChange={setView} storageKey="providersView" />
          <button type="button" onClick={openCreate} className="btn-primary">
            <span className="material-icons" style={{ fontSize: 17 }}>add</span>
            Nuevo proveedor
          </button>
        </div>
      </div>
      {view === 'table' && (
        <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
          <div className="px-4 pt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, contacto o email..."
              className="input-field w-full max-w-sm"
            />
          </div>
          <TableToolbar
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            startIndex={startIndex}
            endIndex={endIndex}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onExportCSV={() => exportToCSV(exportHeaders, getExportRows(filteredData), 'proveedores.csv')}
            onExportExcel={() => exportToExcel(exportHeaders, getExportRows(filteredData), 'proveedores.xlsx', 'Proveedores')}
            onExportPDF={() => exportToPDF(exportHeaders, getExportRows(filteredData), 'proveedores.pdf', 'Proveedores')}
          />
          <DataTable<Provider>
            columns={[
              {
                key: 'name',
                header: 'Proveedor',
                sortAccessor: (p) => p.name,
                render: (p) => (
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                      <span className="material-icons" style={{ fontSize: 16 }}>business</span>
                    </span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                ),
              },
              { key: 'contactName', header: 'Contacto', sortAccessor: (p) => p.contactName ?? '', render: (p) => p.contactName ?? '—' },
              { key: 'phone', header: 'Teléfono', cellClassName: 'font-mono-data', render: (p) => p.phone ?? '—' },
              { key: 'email', header: 'Email', sortAccessor: (p) => p.email ?? '', render: (p) => p.email ?? '—' },
              {
                key: 'actions',
                header: 'Acciones',
                align: 'right',
                render: (p) => (
                  <>
                    <button type="button" onClick={() => openEdit(p)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                    <button type="button" onClick={() => handleDelete(p)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                  </>
                ),
              },
            ]}
            rows={paginatedProviders}
            getRowKey={(p) => p.id}
            emptyMessage="No hay proveedores registrados."
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        </div>
      )}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.length === 0 ? (
            <div
              className="col-span-full rounded-[16px] px-6 py-12 text-center"
              style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              No hay proveedores registrados.
            </div>
          ) : (
            providers.map((p: Provider) => (
              <div
                key={p.id}
                className="rounded-[16px] p-5 flex flex-col"
                style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                    <span className="material-icons" style={{ fontSize: 18 }}>business</span>
                  </span>
                  <div className="font-medium text-lg" style={{ color: 'var(--color-text)' }}>{p.name}</div>
                </div>
                <div className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>{p.contactName ?? '—'}</div>
                <div className="text-sm font-mono-data" style={{ color: 'var(--color-text-muted)' }}>{p.phone ?? '—'}</div>
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.email ?? '—'}</div>
                {p.address && (
                  <div className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{p.address}</div>
                )}
                <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => openEdit(p)} className="text-primary font-medium hover:underline text-sm">Editar</button>
                  <button type="button" onClick={() => handleDelete(p)} className="text-red-600 font-medium hover:underline text-sm">Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {modalOpen && (
        <ProviderFormModal
          provider={editingProvider}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            notifySuccess('Proveedor guardado correctamente.');
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`¿Eliminar el proveedor ${deleteTarget.name}?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteMutation.mutate(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
