import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { usePagination } from '../../hooks/usePagination';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
import { SearchSelect } from '../../components/ui/SearchSelect';

type AuditLog = {
  id: string;
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

const ACTION_OPTIONS = [
  { value: 'create', label: 'Crear' },
  { value: 'update', label: 'Actualizar' },
  { value: 'delete', label: 'Eliminar' },
  { value: 'login', label: 'Inicio de sesión' },
  { value: 'approve', label: 'Aprobar' },
  { value: 'reject', label: 'Rechazar' },
];

const RESOURCE_OPTIONS = [
  { value: 'vehicles', label: 'Vehículos' },
  { value: 'reservations', label: 'Reservas' },
  { value: 'users', label: 'Usuarios' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'incidents', label: 'Incidentes' },
  { value: 'sanctions', label: 'Sanciones' },
  { value: 'costs', label: 'Costos' },
  { value: 'fuel_records', label: 'Combustible' },
  { value: 'providers', label: 'Proveedores' },
];

function actionBadge(action: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    create:  { label: 'Crear',    color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
    update:  { label: 'Editar',   color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
    delete:  { label: 'Eliminar', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
    login:   { label: 'Login',    color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    approve: { label: 'Aprobar',  color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
    reject:  { label: 'Rechazar', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  };
  const s = map[action] ?? { label: action, color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

function resourceLabel(resource?: string) {
  if (!resource) return '—';
  return RESOURCE_OPTIONS.find((r) => r.value === resource)?.label ?? resource;
}

function MetadataModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900">Detalle del registro</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono-data">{log.id}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Acción</p>
              <div className="mt-1">{actionBadge(log.action)}</div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Recurso</p>
              <p className="mt-1 font-medium text-slate-800">{resourceLabel(log.resource)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">ID Recurso</p>
              <p className="mt-1 font-mono-data text-xs text-slate-600 break-all">
                {log.resourceId ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Usuario ID</p>
              <p className="mt-1 font-mono-data text-xs text-slate-600 break-all">
                {log.userId ?? '—'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Fecha</p>
              <p className="mt-1 font-mono-data text-sm text-slate-800">
                {new Date(log.createdAt).toLocaleString('es-MX')}
              </p>
            </div>
          </div>
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Metadata</p>
              <pre className="bg-slate-50 rounded-lg p-3 text-xs overflow-auto max-h-60 text-slate-700 font-mono-data">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const EXPORT_HEADERS = ['Fecha', 'Acción', 'Recurso', 'ID Recurso', 'Usuario ID'];

export function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => (await apiClient.get('/audit-logs')).data,
  });

  const filtered = logs.filter((l: AuditLog) => {
    if (filterAction && l.action !== filterAction) return false;
    if (filterResource && l.resource !== filterResource) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (l.action ?? '').toLowerCase().includes(q) ||
      (l.resource ?? '').toLowerCase().includes(q) ||
      (l.userId ?? '').toLowerCase().includes(q) ||
      (l.resourceId ?? '').toLowerCase().includes(q)
    );
  });

  const getExportRows = (list: AuditLog[]) =>
    list.map((l) => [
      new Date(l.createdAt).toLocaleString('es-MX'),
      l.action,
      resourceLabel(l.resource),
      l.resourceId ?? '',
      l.userId ?? '',
    ]);

  const {
    paginatedData: paginatedLogs,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = usePagination<AuditLog>(filtered, { pageSize: 30 });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2
          className="text-xl sm:text-2xl font-bold"
          style={{ color: 'var(--color-text)', letterSpacing: '-0.3px' }}
        >
          Bitácora de Auditoría
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Historial de acciones realizadas en el sistema.
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['create', 'update', 'delete', 'login'] as const).map((action) => {
          const count = logs.filter((l: AuditLog) => l.action === action).length;
          return (
            <div key={action} className="glass-panel p-4">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {ACTION_OPTIONS.find((o) => o.value === action)?.label ?? action}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                {count}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
        {/* Filtros */}
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por acción, recurso, usuario..."
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary w-64"
          />
          <SearchSelect
            options={[{ value: '', label: 'Todas las acciones' }, ...ACTION_OPTIONS]}
            value={filterAction}
            onChange={setFilterAction}
            placeholder="Acción"
            className="w-44"
          />
          <SearchSelect
            options={[{ value: '', label: 'Todos los recursos' }, ...RESOURCE_OPTIONS]}
            value={filterResource}
            onChange={setFilterResource}
            placeholder="Recurso"
            className="w-44"
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
          onExportCSV={() =>
            exportToCSV(EXPORT_HEADERS, getExportRows(filtered), 'auditoria.csv')
          }
          onExportExcel={() =>
            exportToExcel(EXPORT_HEADERS, getExportRows(filtered), 'auditoria.xlsx', 'Auditoría')
          }
          onExportPDF={() =>
            exportToPDF(
              EXPORT_HEADERS,
              getExportRows(filtered),
              'auditoria.pdf',
              'Bitácora de Auditoría',
            )
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Fecha</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Acción</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Recurso</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                  ID Recurso
                </th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Usuario</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No hay registros de auditoría.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((l: AuditLog) => (
                  <tr
                    key={l.id}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedLog(l)}
                  >
                    <td className="px-6 py-4 text-sm font-mono-data text-slate-600 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">{actionBadge(l.action)}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {resourceLabel(l.resource)}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono-data text-slate-500 max-w-[140px] truncate">
                      {l.resourceId ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono-data text-slate-500 max-w-[140px] truncate">
                      {l.userId ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(l);
                        }}
                        className="text-primary font-medium hover:underline text-sm"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <MetadataModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
