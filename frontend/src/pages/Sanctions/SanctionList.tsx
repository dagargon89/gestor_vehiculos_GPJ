import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { notifySuccess, notifyError } from '../../lib/toast';
import { ViewToggle, getStoredView, type ViewMode } from '../../components/ui/ViewToggle';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { useDataTable } from '../../hooks/useDataTable';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
import { useAuth } from '../../contexts/AuthContext';
import { isConductor } from '../../config/routePermissions';
import { QueryErrorState } from '../../components/ui/QueryErrorState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';

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
    <Modal title={sanction ? 'Editar sanción' : 'Nueva sanción'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
    </Modal>
  );
}

export function SanctionList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(() => getStoredView('sanctionView'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSanction, setEditingSanction] = useState<Sanction | null>(null);
  const [filterUserId, setFilterUserId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Sanction | null>(null);

  const { data: sanctionList = [], isLoading, isError, error, refetch } = useQuery({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sanctions'] });
      notifySuccess('Sanción eliminada correctamente.');
    },
    onError: () => notifyError('No se pudo eliminar la sanción.'),
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
    setDeleteTarget(s);
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
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
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
  } = useDataTable<Sanction>(sanctionList, {
    pageSize: 25,
    searchFields: (s) => [getUserLabel(s), s.reason],
  });

  const exportHeaders = ['Usuario', 'Motivo', 'Fecha efectiva', 'Fecha fin'];
  const getExportRows = (list: Sanction[]) =>
    list.map((s) => [
      getUserLabel(s),
      s.reason,
      formatDate(s.effectiveDate),
      s.endDate ? formatDate(s.endDate) : '—',
    ]);

  if (isLoading) return <div className="text-primary font-bold">Cargando sanciones...</div>;

  if (isError) {
    return (
      <QueryErrorState
        title="sanciones"
        message={error instanceof Error ? error.message : 'Error desconocido'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2
          className="text-2xl font-bold"
          style={{
            color: 'var(--color-text)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
          }}
        >
          Sanciones
        </h2>
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
        <div
          className="rounded-[16px] shadow-sm overflow-hidden"
          style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
        >
          <div className="px-4 pt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por usuario o motivo..."
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
            onExportCSV={() => exportToCSV(exportHeaders, getExportRows(sanctionList), 'sanciones.csv')}
            onExportExcel={() => exportToExcel(exportHeaders, getExportRows(sanctionList), 'sanciones.xlsx', 'Sanciones')}
            onExportPDF={() => exportToPDF(exportHeaders, getExportRows(sanctionList), 'sanciones.pdf', 'Sanciones')}
          />
          <DataTable<Sanction>
            columns={[
              { key: 'user', header: 'Usuario', sortAccessor: (s) => getUserLabel(s), cellClassName: 'font-medium', render: (s) => getUserLabel(s) },
              { key: 'reason', header: 'Motivo', cellClassName: 'max-w-[280px] truncate', render: (s) => s.reason },
              { key: 'effectiveDate', header: 'Fecha efectiva', sortAccessor: (s) => s.effectiveDate, cellClassName: 'font-mono-data text-sm', render: (s) => formatDate(s.effectiveDate) },
              { key: 'endDate', header: 'Fecha fin', sortAccessor: (s) => s.endDate ?? '', cellClassName: 'font-mono-data text-sm', render: (s) => (s.endDate ? formatDate(s.endDate) : '—') },
              {
                key: 'estado',
                header: 'Estado',
                render: (s) => {
                  const vigente = !s.endDate || new Date(s.endDate) >= new Date();
                  return (
                    <span className={`badge ${vigente ? 'badge-red' : 'badge-slate'}`}>
                      {vigente ? 'Vigente' : 'Vencida'}
                    </span>
                  );
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                align: 'right',
                render: (s) => (
                  <>
                    <button type="button" onClick={() => openEdit(s)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                    <button type="button" onClick={() => handleDelete(s)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                  </>
                ),
              },
            ]}
            rows={paginatedSanctions}
            getRowKey={(s) => s.id}
            emptyMessage="No hay sanciones registradas."
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        </div>
      )}

      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sanctionList.length === 0 ? (
            <div
              className="col-span-full rounded-[16px] shadow-sm px-6 py-12 text-center"
              style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              No hay sanciones registradas.
            </div>
          ) : (
            sanctionList.map((s: Sanction) => (
              <div
                key={s.id}
                className="rounded-[16px] shadow-sm p-5 flex flex-col"
                style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
              >
                <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {getUserLabel(s)}
                </div>
                <p className="text-sm mt-1 line-clamp-3" style={{ color: 'var(--color-text-soft)' }}>{s.reason}</p>
                <div className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  Efectiva: {formatDate(s.effectiveDate)}
                  {s.endDate && ` — Fin: ${formatDate(s.endDate)}`}
                </div>
                <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
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
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['sanctions'] });
            notifySuccess('Sanción guardada correctamente.');
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message="¿Eliminar esta sanción?"
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
