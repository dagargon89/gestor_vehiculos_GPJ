import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { usePagination } from '../../hooks/usePagination';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';

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

export function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [togglingAutoApprove, setTogglingAutoApprove] = useState(false);

  const { data: settings = [], isLoading } = useQuery({
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/system-settings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-settings'] }),
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
    if (!window.confirm(`¿Eliminar la configuración "${s.key}"?`)) return;
    deleteMutation.mutate(s.id);
  };

  const {
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
  } = usePagination<SystemSetting>(settings, { pageSize: 25 });

  const exportHeaders = ['Clave', 'Valor'];
  const getExportRows = (list: SystemSetting[]) => list.map((s) => [s.key, s.value]);

  if (isLoading) return <div className="text-primary font-bold">Cargando configuración...</div>;

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
          onExportCSV={() => exportToCSV(exportHeaders, getExportRows(settings), 'configuracion-sistema.csv')}
          onExportExcel={() => exportToExcel(exportHeaders, getExportRows(settings), 'configuracion-sistema.xlsx', 'Configuración')}
          onExportPDF={() => exportToPDF(exportHeaders, getExportRows(settings), 'configuracion-sistema.pdf', 'Configuración del sistema')}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Clave</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Valor</th>
              <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSettings.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  No hay configuraciones. Añade una para parámetros globales del sistema.
                </td>
              </tr>
            ) : (
              paginatedSettings.map((s: SystemSetting) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900 font-mono text-sm">{s.key}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-md truncate">{s.value}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="text-primary font-medium hover:underline mr-3"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
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

      {modalOpen && (
        <SettingFormModal
          setting={editingSetting}
          onClose={() => setModalOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['system-settings'] })}
        />
      )}
    </div>
  );
}
