import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { ViewToggle, getStoredView, type ViewMode } from '../../components/ui/ViewToggle';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { usePagination } from '../../hooks/usePagination';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
import { useAuth } from '../../contexts/AuthContext';
import { isConductor } from '../../config/routePermissions';

type User = { id: string; displayName?: string; email?: string };

type Sanction = {
  id: string;
  userId: string;
  reason: string;
  effectiveDate: string;
  endDate?: string;
  user?: User;
};

function SanctionFormModal({
  sanction,
  users,
  onClose,
  onSuccess,
}: {
  sanction: Sanction | null;
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { userData } = useAuth();
  const esConductor = isConductor(userData?.role?.name);

  const [form, setForm] = useState({
    userId: sanction?.userId ?? (esConductor && userData?.id ? userData.id : ''),
    reason: sanction?.reason ?? '',
    effectiveDate: sanction?.effectiveDate ? sanction.effectiveDate.slice(0, 10) : '',
    endDate: sanction?.endDate ? sanction.endDate.slice(0, 10) : '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        userId: form.userId,
        reason: form.reason.trim(),
        effectiveDate: form.effectiveDate,
        endDate: form.endDate || undefined,
      };
      if (sanction) {
        await apiClient.put(`/sanctions/${sanction.id}`, payload);
      } else {
        await apiClient.post('/sanctions', payload);
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
            {sanction ? 'Editar sanción' : 'Nueva sanción'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario *</label>
            {esConductor ? (
              <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium flex items-center gap-2">
                <span className="material-icons text-slate-400 text-base">person</span>
                {userData?.displayName || userData?.email || 'Usuario actual'}
              </div>
            ) : (
              <SearchSelect
                options={users.map((u) => ({ value: u.id, label: u.displayName || u.email || u.id }))}
                value={form.userId}
                onChange={(v) => setForm((f) => ({ ...f, userId: v }))}
                placeholder="Seleccionar..."
                required
                className="w-full"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo *</label>
            <textarea
              rows={3}
              required
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha efectiva *</label>
            <input
              type="date"
              required
              value={form.effectiveDate}
              onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha fin (opcional)</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
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
              {submitting ? 'Guardando...' : sanction ? 'Guardar cambios' : 'Crear sanción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SanctionList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(() => getStoredView('sanctionView'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSanction, setEditingSanction] = useState<Sanction | null>(null);
  const [filterUserId, setFilterUserId] = useState('');

  const { data: sanctionList = [], isLoading } = useQuery({
    queryKey: ['sanctions', filterUserId || undefined],
    queryFn: async () => {
      const params = filterUserId ? { userId: filterUserId } : {};
      const res = await apiClient.get('/sanctions', { params });
      return res.data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/sanctions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sanctions'] }),
  });

  const openCreate = () => {
    setEditingSanction(null);
    setModalOpen(true);
  };

  const openEdit = (s: Sanction) => {
    setEditingSanction(s);
    setModalOpen(true);
  };

  const handleDelete = (s: Sanction) => {
    if (!window.confirm('¿Eliminar esta sanción?')) return;
    deleteMutation.mutate(s.id);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  const getUserLabel = (s: Sanction) => {
    const fromList = s.userId?.trim() ? users.find((x: User) => x.id === s.userId) : null;
    const u = s.user ?? fromList;
    if (!u) return '—';
    const name = (u as { displayName?: string; display_name?: string }).displayName
      ?? (u as { displayName?: string; display_name?: string }).display_name;
    return name || u.email || '—';
  };

  const {
    paginatedData: paginatedSanctions,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = usePagination<Sanction>(sanctionList, { pageSize: 25 });

  const exportHeaders = ['Usuario', 'Motivo', 'Fecha efectiva', 'Fecha fin'];
  const getExportRows = (list: Sanction[]) =>
    list.map((s) => [
      getUserLabel(s),
      s.reason,
      formatDate(s.effectiveDate),
      s.endDate ? formatDate(s.endDate) : '—',
    ]);

  if (isLoading) return <div className="text-primary font-bold">Cargando sanciones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Sanciones</h2>
        <div className="flex items-center gap-3">
          <SearchSelect
            options={[{ value: '', label: 'Todos los usuarios' }, ...users.map((u: User) => ({ value: u.id, label: u.displayName || u.email || u.id }))]}
            value={filterUserId}
            onChange={setFilterUserId}
            placeholder="Todos los usuarios"
            className="w-48"
          />
          <ViewToggle value={view} onChange={setView} storageKey="sanctionView" />
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
          >
            Nueva sanción
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
            onExportCSV={() => exportToCSV(exportHeaders, getExportRows(sanctionList), 'sanciones.csv')}
            onExportExcel={() => exportToExcel(exportHeaders, getExportRows(sanctionList), 'sanciones.xlsx', 'Sanciones')}
            onExportPDF={() => exportToPDF(exportHeaders, getExportRows(sanctionList), 'sanciones.pdf', 'Sanciones')}
          />
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Usuario</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Motivo</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Fecha efectiva</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Fecha fin</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSanctions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay sanciones registradas.</td>
                </tr>
              ) : (
                paginatedSanctions.map((s: Sanction) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {getUserLabel(s)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-[280px] truncate">{s.reason}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(s.effectiveDate)}</td>
                    <td className="px-6 py-4 text-slate-600">{s.endDate ? formatDate(s.endDate) : '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={() => openEdit(s)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                      <button type="button" onClick={() => handleDelete(s)} className="text-red-600 font-medium hover:underline">Eliminar</button>
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
          {sanctionList.length === 0 ? (
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
              No hay sanciones registradas.
            </div>
          ) : (
            sanctionList.map((s: Sanction) => (
              <div key={s.id} className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col">
                <div className="font-medium text-slate-900">
                  {getUserLabel(s)}
                </div>
                <p className="text-slate-600 text-sm mt-1 line-clamp-3">{s.reason}</p>
                <div className="text-slate-500 text-sm mt-2">
                  Efectiva: {formatDate(s.effectiveDate)}
                  {s.endDate && ` — Fin: ${formatDate(s.endDate)}`}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                  <button type="button" onClick={() => openEdit(s)} className="text-primary font-medium hover:underline text-sm">Editar</button>
                  <button type="button" onClick={() => handleDelete(s)} className="text-red-600 font-medium hover:underline text-sm">Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <SanctionFormModal
          sanction={editingSanction}
          users={users}
          onClose={() => setModalOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['sanctions'] })}
        />
      )}
    </div>
  );
}
