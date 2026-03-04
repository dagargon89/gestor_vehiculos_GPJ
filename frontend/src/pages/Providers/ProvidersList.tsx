import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { ViewToggle, getStoredView, type ViewMode } from '../../components/ui/ViewToggle';
import { usePagination } from '../../hooks/usePagination';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {provider ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contacto</label>
            <input
              type="text"
              value={form.contactName}
              onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : provider ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProvidersList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(() => getStoredView('providersView'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [filterSearch, setFilterSearch] = useState('');

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await apiClient.get('/providers');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/providers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['providers'] }),
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
    if (!window.confirm(`¿Eliminar el proveedor ${p.name}?`)) return;
    deleteMutation.mutate(p.id);
  };

  const filteredProviders = filterSearch.trim()
    ? providers.filter((p: Provider) => p.name.toLowerCase().includes(filterSearch.trim().toLowerCase()))
    : providers;

  const {
    paginatedData: paginatedProviders,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = usePagination<Provider>(filteredProviders, { pageSize: 25 });

  const exportHeaders = ['Nombre', 'Contacto', 'Teléfono', 'Email'];
  const getExportRows = (list: Provider[]) =>
    list.map((p) => [p.name, p.contactName ?? '—', p.phone ?? '—', p.email ?? '—']);

  if (isLoading) return <div className="text-primary font-bold">Cargando proveedores...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Proveedores</h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Buscar por nombre"
            className="w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <ViewToggle value={view} onChange={setView} storageKey="providersView" />
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
          >
            Nuevo proveedor
          </button>
        </div>
      </div>
      {view === 'table' && (
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
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
            onExportCSV={() => exportToCSV(exportHeaders, getExportRows(filteredProviders), 'proveedores.csv')}
            onExportExcel={() => exportToExcel(exportHeaders, getExportRows(filteredProviders), 'proveedores.xlsx', 'Proveedores')}
            onExportPDF={() => exportToPDF(exportHeaders, getExportRows(filteredProviders), 'proveedores.pdf', 'Proveedores')}
          />
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Nombre</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Contacto</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Teléfono</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Email</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProviders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay proveedores registrados.</td>
                </tr>
              ) : (
                paginatedProviders.map((p: Provider) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600">{p.contactName ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{p.phone ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{p.email ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="text-primary font-medium hover:underline mr-3"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="text-red-600 font-medium hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.length === 0 ? (
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
              No hay proveedores registrados.
            </div>
          ) : (
            providers.map((p: Provider) => (
              <div
                key={p.id}
                className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col"
              >
                <div className="font-medium text-slate-900 text-lg">{p.name}</div>
                <div className="text-slate-600 text-sm mt-1">{p.contactName ?? '—'}</div>
                <div className="text-slate-500 text-sm mt-1">{p.phone ?? '—'}</div>
                <div className="text-slate-500 text-sm">{p.email ?? '—'}</div>
                {p.address && (
                  <div className="text-slate-400 text-xs mt-2 line-clamp-2">{p.address}</div>
                )}
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="text-primary font-medium hover:underline text-sm"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    className="text-red-600 font-medium hover:underline text-sm"
                  >
                    Eliminar
                  </button>
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
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['providers'] })}
        />
      )}
    </div>
  );
}
