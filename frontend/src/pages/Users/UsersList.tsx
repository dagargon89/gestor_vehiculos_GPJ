import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { notifySuccess, notifyError } from '../../lib/toast';
import { ViewToggle } from '../../components/ui/ViewToggle';
import { getStoredView, type ViewMode } from '../../components/ui/viewMode';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { useDataTable } from '../../hooks/useDataTable';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

type Role = { id: string; name: string; description?: string };

type User = {
  id: string;
  email: string;
  displayName?: string;
  department?: string;
  status: string;
  roleId?: string;
  role?: Role;
  lastLoginAt?: string;
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'inactive', label: 'Inactivo' },
];

const ROLE_ICONS: Record<string, string> = {
  admin: 'admin_panel_settings',
  manager_flotilla: 'supervisor_account',
  conductor: 'directions_car',
  solicitante: 'assignment_ind',
};
const ROLE_VARIANTS = ['blue', 'green', 'amber', 'purple', 'red'];
const getRoleIcon = (roleName: string) => ROLE_ICONS[roleName] ?? 'group';
const getInitials = (nameOrEmail: string) => {
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : trimmed.slice(0, 2).toUpperCase();
};

function UserFormModal({
  user,
  roles,
  onClose,
  onSuccess,
}: {
  user: User;
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    displayName: user.displayName ?? '',
    department: user.department ?? '',
    roleId: user.roleId ?? '',
    status: user.status ?? 'active',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        displayName: form.displayName.trim() || undefined,
        department: form.department.trim() || undefined,
        roleId: form.roleId?.trim() || null,
        status: form.status,
      };
      await apiClient.put(`/users/${user.id}`, payload);
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
    <Modal title="Editar usuario" subtitle={user.email} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
            <SearchSelect
              options={[{ value: '', label: 'Sin rol' }, ...roles.map((r) => ({ value: r.id, label: r.name }))]}
              value={form.roleId}
              onChange={(v) => setForm((f) => ({ ...f, roleId: v }))}
              placeholder="Sin rol"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <SearchSelect
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              placeholder="Estado"
              className="w-full"
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
              {submitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
      </form>
    </Modal>
  );
}

export function UsersList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(() => getStoredView('usersView'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filterRoleId, setFilterRoleId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notifySuccess('Usuario eliminado correctamente.');
    },
    onError: () => notifyError('No se pudo eliminar el usuario.'),
  });

  const openEdit = (u: User) => {
    setEditingUser(u);
    setModalOpen(true);
  };

  const handleDelete = (u: User) => {
    setDeleteTarget(u);
  };

  const filteredUsers = users.filter((u: User) => {
    if (filterRoleId && (u.roleId ?? '') !== filterRoleId) return false;
    if (filterStatus && u.status !== filterStatus) return false;
    return true;
  });

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    paginatedData: paginatedUsers,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = useDataTable<User>(filteredUsers, {
    pageSize: 25,
    searchFields: (u) => [u.email, u.displayName ?? '', u.department ?? ''],
  });

  const getRoleName = (u: User) => u.role?.name ?? (u.roleId && roles.find((r: Role) => r.id === u.roleId)?.name) ?? '—';
  const exportHeaders = ['Email', 'Nombre', 'Departamento', 'Rol', 'Estado'];
  const getExportRows = (list: User[]) =>
    list.map((u: User) => [
      u.email,
      u.displayName ?? '—',
      u.department ?? '—',
      getRoleName(u),
      STATUS_OPTIONS.find((o) => o.value === u.status)?.label ?? u.status,
    ]);

  if (isLoading) return <div className="text-primary font-bold">Cargando usuarios...</div>;

  if (isError) {
    const message = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : 'Error desconocido';
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Usuarios</h2>
        <div className="bg-red-50 border border-red-200 rounded-[16px] px-6 py-4 text-red-700">
          <p className="font-medium">Error al cargar la lista de usuarios.</p>
          <p className="text-sm mt-1">{message}</p>
          <p className="text-sm mt-2">Comprobando: <code className="bg-red-100 px-1 rounded">{baseURL}</code></p>
          <p className="text-sm mt-2">El usuario con el que iniciaste sesión se crea o sincroniza en la base de datos al entrar; si ves este error, revisa que el backend esté en marcha y que la sesión sea válida.</p>
        </div>
      </div>
    );
  }

  const getRoleUserCount = (roleId: string) => users.filter((u: User) => u.roleId === roleId).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wide" style={{ color: 'var(--color-text)' }}>Usuarios y roles</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Cuentas activas y permisos por rol.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchSelect
            options={[{ value: '', label: 'Todos los roles' }, ...roles.map((r: Role) => ({ value: r.id, label: r.name }))]}
            value={filterRoleId}
            onChange={setFilterRoleId}
            placeholder="Todos los roles"
            className="w-48"
          />
          <SearchSelect
            options={[{ value: '', label: 'Todos los estados' }, ...STATUS_OPTIONS]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Todos los estados"
            className="w-48"
          />
          <ViewToggle value={view} onChange={setView} storageKey="usersView" />
        </div>
      </div>
      {roles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {roles.map((r: Role, i: number) => (
            <div key={r.id} className={`stat-card ${ROLE_VARIANTS[i % ROLE_VARIANTS.length]}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="stat-card__icon">
                  <span className="material-icons" style={{ fontSize: 18 }}>{getRoleIcon(r.name)}</span>
                </div>
                <span className="stat-card__value" style={{ fontSize: 20 }}>{getRoleUserCount(r.id)}</span>
              </div>
              <div className="stat-card__label" style={{ textTransform: 'none' }}>{r.name}</div>
              {r.description && <div className="stat-card__sub">{r.description}</div>}
            </div>
          ))}
        </div>
      )}
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
              placeholder="Buscar por email, nombre o departamento..."
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
            onExportCSV={() => exportToCSV(exportHeaders, getExportRows(filteredUsers), 'usuarios.csv')}
            onExportExcel={() => exportToExcel(exportHeaders, getExportRows(filteredUsers), 'usuarios.xlsx', 'Usuarios')}
            onExportPDF={() => exportToPDF(exportHeaders, getExportRows(filteredUsers), 'usuarios.pdf', 'Usuarios')}
          />
          <DataTable<User>
            columns={[
              {
                key: 'email',
                header: 'Usuario',
                sortAccessor: (u) => u.displayName || u.email,
                render: (u) => (
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', color: 'var(--color-text-on-primary)' }}
                    >
                      {getInitials(u.displayName || u.email)}
                    </span>
                    <span className="font-medium">{u.displayName || u.email}</span>
                  </div>
                ),
              },
              { key: 'emailAddr', header: 'Correo', sortAccessor: (u) => u.email, render: (u) => u.email },
              { key: 'department', header: 'Departamento', render: (u) => u.department ?? '—' },
              {
                key: 'role',
                header: 'Rol',
                render: (u) => <span className="badge badge-amber">{getRoleName(u)}</span>,
              },
              {
                key: 'lastLoginAt',
                header: 'Último acceso',
                sortAccessor: (u) => u.lastLoginAt ?? '',
                cellClassName: 'text-sm font-mono-data',
                cellStyle: { whiteSpace: 'nowrap', color: 'var(--color-text-muted)' },
                render: (u) =>
                  u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString('es-MX', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })
                    : '—',
              },
              {
                key: 'status',
                header: 'Estado',
                render: (u) => {
                  const variant = u.status === 'active' ? 'green' : u.status === 'suspended' ? 'red' : 'slate';
                  return (
                    <span className={`badge badge-${variant} gap-1.5`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                      {STATUS_OPTIONS.find((o) => o.value === u.status)?.label ?? u.status}
                    </span>
                  );
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                align: 'right',
                render: (u) => (
                  <>
                    <button type="button" onClick={() => openEdit(u)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                    <button type="button" onClick={() => handleDelete(u)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                  </>
                ),
              },
            ]}
            rows={paginatedUsers}
            getRowKey={(u) => u.id}
            emptyMessage="No hay usuarios registrados."
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        </div>
      )}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.length === 0 ? (
            <div
              className="col-span-full rounded-[16px] px-6 py-12 text-center"
              style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              No hay usuarios registrados.
            </div>
          ) : (
            users.map((u: User) => {
              const roleName = u.role?.name ?? (u.roleId && roles.find((r: Role) => r.id === u.roleId)?.name) ?? 'Sin rol';
              const statusVariant = u.status === 'active' ? 'green' : u.status === 'suspended' ? 'red' : 'slate';
              return (
              <div
                key={u.id}
                className="rounded-[16px] p-5 flex flex-col"
                style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', color: 'var(--color-text-on-primary)' }}
                  >
                    {getInitials(u.displayName || u.email)}
                  </span>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--color-text)' }}>{u.displayName || u.email}</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{u.email}</div>
                  </div>
                </div>
                <div className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>{u.department ?? '—'}</div>
                <div className="mt-2 flex gap-2">
                  <span className="badge badge-amber">{roleName}</span>
                  <span className={`badge badge-${statusVariant} gap-1.5`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                    {STATUS_OPTIONS.find((o) => o.value === u.status)?.label ?? u.status}
                  </span>
                </div>
                <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => openEdit(u)} className="text-primary font-medium hover:underline text-sm">Editar</button>
                  <button type="button" onClick={() => handleDelete(u)} className="text-red-600 font-medium hover:underline text-sm">Eliminar</button>
                </div>
              </div>
              );
            })
          )}
        </div>
      )}
      {modalOpen && editingUser && (
        <UserFormModal
          user={editingUser}
          roles={roles}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            notifySuccess('Usuario guardado correctamente.');
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`¿Eliminar al usuario ${deleteTarget.displayName || deleteTarget.email}?`}
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
