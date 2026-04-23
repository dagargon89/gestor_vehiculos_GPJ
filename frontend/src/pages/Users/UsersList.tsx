import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { ViewToggle, getStoredView, type ViewMode } from '../../components/ui/ViewToggle';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { usePagination } from '../../hooks/usePagination';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Editar usuario</h3>
          <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
      </div>
    </div>
  );
}

export function UsersList() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(() => getStoredView('usersView'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filterRoleId, setFilterRoleId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const openEdit = (u: User) => {
    setEditingUser(u);
    setModalOpen(true);
  };

  const handleDelete = (u: User) => {
    if (!window.confirm(`¿Eliminar al usuario ${u.displayName || u.email}?`)) return;
    deleteMutation.mutate(u.id);
  };

  const filteredUsers = users.filter((u: User) => {
    if (filterRoleId && (u.roleId ?? '') !== filterRoleId) return false;
    if (filterStatus && u.status !== filterStatus) return false;
    return true;
  });

  const {
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
  } = usePagination<User>(filteredUsers, { pageSize: 25 });

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
        <h2 className="text-2xl font-bold text-slate-900">Usuarios</h2>
        <div className="bg-red-50 border border-red-200 rounded-[16px] px-6 py-4 text-red-700">
          <p className="font-medium">Error al cargar la lista de usuarios.</p>
          <p className="text-sm mt-1">{message}</p>
          <p className="text-sm mt-2">Comprobando: <code className="bg-red-100 px-1 rounded">{baseURL}</code></p>
          <p className="text-sm mt-2">El usuario con el que iniciaste sesión se crea o sincroniza en la base de datos al entrar; si ves este error, revisa que el backend esté en marcha y que la sesión sea válida.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Usuarios</h2>
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
            onExportCSV={() => exportToCSV(exportHeaders, getExportRows(filteredUsers), 'usuarios.csv')}
            onExportExcel={() => exportToExcel(exportHeaders, getExportRows(filteredUsers), 'usuarios.xlsx', 'Usuarios')}
            onExportPDF={() => exportToPDF(exportHeaders, getExportRows(filteredUsers), 'usuarios.pdf', 'Usuarios')}
          />
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Email</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Nombre</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Departamento</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Rol</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Último acceso</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No hay usuarios registrados.</td>
                </tr>
              ) : (
                paginatedUsers.map((u: User) => {
                  const roleName = getRoleName(u);
                  return (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                    <td className="px-6 py-4 text-slate-600">{u.displayName ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{u.department ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{roleName}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {STATUS_OPTIONS.find((o) => o.value === u.status)?.label ?? u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono-data text-slate-500 whitespace-nowrap">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString('es-MX', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="text-primary font-medium hover:underline mr-3"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        className="text-red-600 font-medium hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.length === 0 ? (
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
              No hay usuarios registrados.
            </div>
          ) : (
            users.map((u: User) => {
              const roleName = u.role?.name ?? (u.roleId && roles.find((r: Role) => r.id === u.roleId)?.name) ?? 'Sin rol';
              return (
              <div
                key={u.id}
                className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col"
              >
                <div className="font-medium text-slate-900">{u.displayName || u.email}</div>
                <div className="text-slate-600 text-sm mt-0.5">{u.email}</div>
                <div className="text-slate-500 text-sm mt-1">{u.department ?? '—'}</div>
                <div className="mt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {roleName}
                  </span>
                  <span className="ml-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    {STATUS_OPTIONS.find((o) => o.value === u.status)?.label ?? u.status}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    className="text-primary font-medium hover:underline text-sm"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
                    className="text-red-600 font-medium hover:underline text-sm"
                  >
                    Eliminar
                  </button>
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
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
        />
      )}
    </div>
  );
}
