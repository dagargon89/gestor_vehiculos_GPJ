import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { notifySuccess, notifyError } from '../../lib/toast';
import { useDataTable } from '../../hooks/useDataTable';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
import { QueryErrorState } from '../../components/ui/QueryErrorState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

type SystemSetting = { id: string; key: string; value: string };

function SettingFormModal({
  setting,
  onClose,
  onSuccess,
}: {
  setting: SystemSetting | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    key: setting?.key ?? '',
    value: setting?.value ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (setting) {
        await apiClient.put(`/system-settings/${setting.id}`, form);
      } else {
        await apiClient.post('/system-settings', form);
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
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {setting ? 'Editar configuración' : 'Nueva configuración'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clave *</label>
            <input
              type="text"
              required
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              disabled={!!setting}
              placeholder="ej. max_reservation_days"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-slate-100 disabled:text-slate-500"
            />
            {setting && (
              <p className="text-xs text-slate-500 mt-1">La clave no se puede modificar.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor *</label>
            <textarea
              rows={3}
              required
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              placeholder="Valor de la configuración"
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
              {submitting ? 'Guardando...' : setting ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const AUTO_APPROVE_KEY = 'auto_approve_reservations';
const ADMIN_OVERDUE_KEY = 'admin_overdue_enabled';

export function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [togglingAutoApprove, setTogglingAutoApprove] = useState(false);
  const [togglingAdminOverdue, setTogglingAdminOverdue] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SystemSetting | null>(null);

  const { data: settings = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/system-settings');
      return res.data;
    },
  });

  const autoApproveSetting: SystemSetting | undefined = settings.find(
    (s: SystemSetting) => s.key === AUTO_APPROVE_KEY,
  );
  const autoApproveEnabled = autoApproveSetting?.value === 'true';

  const adminOverdueSetting: SystemSetting | undefined = settings.find(
    (s: SystemSetting) => s.key === ADMIN_OVERDUE_KEY,
  );
  // Absent = true (current behavior: admins subject to overdue like everyone else)
  const adminOverdueEnabled = adminOverdueSetting === undefined || adminOverdueSetting.value !== 'false';

  const handleToggleAutoApprove = async () => {
    setTogglingAutoApprove(true);
    try {
      const newValue = autoApproveEnabled ? 'false' : 'true';
      if (autoApproveSetting) {
        await apiClient.put(`/system-settings/${autoApproveSetting.id}`, { value: newValue });
      } else {
        await apiClient.post('/system-settings', { key: AUTO_APPROVE_KEY, value: newValue });
      }
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    } finally {
      setTogglingAutoApprove(false);
    }
  };

  const handleToggleAdminOverdue = async () => {
    setTogglingAdminOverdue(true);
    try {
      const newValue = adminOverdueEnabled ? 'false' : 'true';
      if (adminOverdueSetting) {
        await apiClient.put(`/system-settings/${adminOverdueSetting.id}`, { value: newValue });
      } else {
        await apiClient.post('/system-settings', { key: ADMIN_OVERDUE_KEY, value: newValue });
      }
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    } finally {
      setTogglingAdminOverdue(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/system-settings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      notifySuccess('Configuración eliminada correctamente.');
    },
    onError: () => notifyError('No se pudo eliminar la configuración.'),
  });

  const openCreate = () => {
    setEditingSetting(null);
    setModalOpen(true);
  };

  const openEdit = (s: SystemSetting) => {
    setEditingSetting(s);
    setModalOpen(true);
  };

  const handleDelete = (s: SystemSetting) => {
    setDeleteTarget(s);
  };

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    paginatedData: paginatedSettings,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = useDataTable<SystemSetting>(settings, {
    pageSize: 25,
    searchFields: (s) => [s.key, s.value],
  });

  const exportHeaders = ['Clave', 'Valor'];
  const getExportRows = (list: SystemSetting[]) => list.map((s) => [s.key, s.value]);

  if (isLoading) return <div className="text-primary font-bold">Cargando configuración...</div>;

  if (isError) {
    return (
      <QueryErrorState
        title="configuración"
        message={error instanceof Error ? error.message : 'Error desconocido'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Configuración del sistema</h2>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
        >
          Nueva configuración
        </button>
      </div>

      {/* Opciones rápidas */}
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="material-icons text-primary text-xl">tune</span>
          Comportamiento de reservas
        </h3>
        <div className="space-y-5 divide-y divide-slate-100">
          {/* Auto-aprobación */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Auto-aprobación de reservas</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Cuando está activo, las solicitudes de reserva se aprueban automáticamente si el
                  vehículo está disponible en las fechas solicitadas. Si hay conflicto, la reserva
                  queda en estado pendiente para revisión manual.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoApprove}
                disabled={togglingAutoApprove}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  autoApproveEnabled ? 'bg-primary' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={autoApproveEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoApproveEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  autoApproveEnabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${autoApproveEnabled ? 'bg-green-500' : 'bg-slate-400'}`} />
                {autoApproveEnabled ? 'Activo' : 'Inactivo — aprobación manual requerida'}
              </span>
            </div>
          </div>

          {/* Vencimiento para administradores */}
          <div className="pt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Vencimiento de reservas para administradores</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Cuando está activo, las reservas de administradores vencen igual que las del resto
                  de los usuarios. Si está desactivado, los administradores quedan exentos del
                  proceso automático de vencimiento.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAdminOverdue}
                disabled={togglingAdminOverdue}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  adminOverdueEnabled ? 'bg-primary' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={adminOverdueEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    adminOverdueEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  adminOverdueEnabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${adminOverdueEnabled ? 'bg-green-500' : 'bg-amber-400'}`} />
                {adminOverdueEnabled ? 'Activo — aplica a todos los usuarios' : 'Inactivo — administradores exentos'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 pt-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por clave o valor..."
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
          onExportCSV={() => exportToCSV(exportHeaders, getExportRows(settings), 'configuracion-sistema.csv')}
          onExportExcel={() => exportToExcel(exportHeaders, getExportRows(settings), 'configuracion-sistema.xlsx', 'Configuración')}
          onExportPDF={() => exportToPDF(exportHeaders, getExportRows(settings), 'configuracion-sistema.pdf', 'Configuración del sistema')}
        />
        <DataTable<SystemSetting>
          columns={[
            { key: 'key', header: 'Clave', sortAccessor: (s) => s.key, cellClassName: 'font-medium font-mono text-sm', render: (s) => s.key },
            { key: 'value', header: 'Valor', cellClassName: 'max-w-md truncate', render: (s) => s.value },
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
          rows={paginatedSettings}
          getRowKey={(s) => s.id}
          emptyMessage="No hay configuraciones. Añade una para parámetros globales del sistema."
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
        />
      </div>

      {modalOpen && (
        <SettingFormModal
          setting={editingSetting}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['system-settings'] });
            notifySuccess('Configuración guardada correctamente.');
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`¿Eliminar la configuración "${deleteTarget.key}"?`}
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
