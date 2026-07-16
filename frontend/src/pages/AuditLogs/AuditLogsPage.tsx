import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { useDataTable } from '../../hooks/useDataTable';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { QueryErrorState } from '../../components/ui/QueryErrorState';
import { Modal } from '../../components/ui/Modal';

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
  const map: Record<string, { label: string; variant: string }> = {
    create:  { label: 'Crear',    variant: 'badge-green' },
    update:  { label: 'Editar',   variant: 'badge-blue' },
    delete:  { label: 'Eliminar', variant: 'badge-red' },
    login:   { label: 'Login',    variant: 'badge-purple' },
    approve: { label: 'Aprobar',  variant: 'badge-green' },
    reject:  { label: 'Rechazar', variant: 'badge-amber' },
  };
  const s = map[action] ?? { label: action, variant: 'badge-slate' };
  return <span className={`badge ${s.variant}`}>{s.label}</span>;
}

function resourceLabel(resource?: string) {
  if (!resource) return '—';
  return RESOURCE_OPTIONS.find((r) => r.value === resource)?.label ?? resource;
}

function MetadataModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <Modal title="Detalle del registro" subtitle={log.id} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Acción</p>
            <div className="mt-1">{actionBadge(log.action)}</div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Recurso</p>
            <p className="mt-1 font-medium" style={{ color: 'var(--color-text)' }}>{resourceLabel(log.resource)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>ID Recurso</p>
            <p className="mt-1 font-mono-data text-xs break-all" style={{ color: 'var(--color-text-soft)' }}>
              {log.resourceId ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Usuario ID</p>
            <p className="mt-1 font-mono-data text-xs break-all" style={{ color: 'var(--color-text-soft)' }}>
              {log.userId ?? '—'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Fecha</p>
            <p className="mt-1 font-mono-data text-sm" style={{ color: 'var(--color-text)' }}>
              {new Date(log.createdAt).toLocaleString('es-MX')}
            </p>
          </div>
        </div>
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--color-text-muted)' }}>Metadata</p>
            <pre
              className="rounded-lg p-3 text-xs overflow-auto max-h-60 font-mono-data"
              style={{ background: 'var(--color-table-head-bg)', color: 'var(--color-text-soft)' }}
            >
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
}

const EXPORT_HEADERS = ['Fecha', 'Acción', 'Recurso', 'ID Recurso', 'Usuario ID'];

export function AuditLogsPage() {
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logs = [], isLoading, isError, error, refetch } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => (await apiClient.get('/audit-logs')).data,
  });

  const filteredBase = logs.filter((l: AuditLog) => {
    if (filterAction && l.action !== filterAction) return false;
    if (filterResource && l.resource !== filterResource) return false;
    return true;
  });

  const logSearchFields = (l: AuditLog) => [l.action ?? '', l.resource ?? '', l.userId ?? '', l.resourceId ?? ''];

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    paginatedData: paginatedLogs,
    filteredData: filtered,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = useDataTable<AuditLog>(filteredBase, {
    pageSize: 30,
    searchFields: logSearchFields,
  });

  const getExportRows = (list: AuditLog[]) =>
    list.map((l) => [
      new Date(l.createdAt).toLocaleString('es-MX'),
      l.action,
      resourceLabel(l.resource),
      l.resourceId ?? '',
      l.userId ?? '',
    ]);

  if (isError) {
    return (
      <QueryErrorState
        title="la bitácora"
        message={error instanceof Error ? error.message : 'Error desconocido'}
        onRetry={() => refetch()}
      />
    );
  }

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
      <div
        className="rounded-[16px] shadow-sm overflow-hidden"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
      >
        {/* Filtros */}
        <div className="px-4 py-3 flex flex-wrap gap-3 items-center" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por acción, recurso, usuario..."
            className="input-field w-64"
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

        <DataTable<AuditLog>
          columns={[
            {
              key: 'createdAt',
              header: 'Fecha',
              sortAccessor: (l) => l.createdAt,
              cellClassName: 'text-sm font-mono-data',
              cellStyle: { whiteSpace: 'nowrap', color: 'var(--color-text-soft)' },
              render: (l) =>
                new Date(l.createdAt).toLocaleString('es-MX', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                }),
            },
            { key: 'action', header: 'Acción', sortAccessor: (l) => l.action, render: (l) => actionBadge(l.action) },
            {
              key: 'resource',
              header: 'Recurso',
              sortAccessor: (l) => resourceLabel(l.resource),
              cellClassName: 'text-sm font-mono-data',
              cellStyle: { color: 'var(--color-primary)' },
              render: (l) => resourceLabel(l.resource),
            },
            {
              key: 'resourceId',
              header: 'ID Recurso',
              cellClassName: 'text-xs font-mono-data max-w-[140px] truncate',
              cellStyle: { color: 'var(--color-text-muted)' },
              render: (l) => l.resourceId ?? '—',
            },
            {
              key: 'userId',
              header: 'Usuario',
              cellClassName: 'text-xs font-mono-data max-w-[140px] truncate',
              cellStyle: { color: 'var(--color-text-muted)' },
              render: (l) => l.userId ?? '—',
            },
            {
              key: 'actions',
              header: 'Detalle',
              align: 'right',
              render: (l) => (
                <button
                  type="button"
                  onClick={() => setSelectedLog(l)}
                  className="text-primary font-medium hover:underline text-sm"
                >
                  Ver
                </button>
              ),
            },
          ]}
          rows={paginatedLogs}
          getRowKey={(l) => l.id}
          emptyMessage={isLoading ? 'Cargando...' : 'No hay registros de auditoría.'}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
        />
      </div>

      {selectedLog && (
        <MetadataModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
