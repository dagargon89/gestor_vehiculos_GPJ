import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { ViewToggle, getStoredView, type ViewMode } from '../../components/ui/ViewToggle';

type Role = { id: string; name: string; description?: string };

type User = {
  id: string;
  email: string;
  displayName?: string;
  department?: string;
  status: string;
  roleId?: string;
  role?: Role;
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
        roleId: form.roleId || undefined,
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
            <select
              value={form.roleId}
              onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Sin rol</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
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

  const { data: users = [], isLoading } = useQuery({
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

  if (isLoading) return <div className="text-primary font-bold">Cargando usuarios...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Usuarios</h2>
        <ViewToggle value={view} onChange={setView} storageKey="usersView" />
      </div>
      {view === 'table' && (
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Email</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Nombre</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Departamento</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Rol</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Estado</th>
                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No hay usuarios registrados.</td>
                </tr>
              ) : (
                users.map((u: User) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                    <td className="px-6 py-4 text-slate-600">{u.displayName ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{u.department ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{u.role?.name ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {STATUS_OPTIONS.find((o) => o.value === u.status)?.label ?? u.status}
                      </span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.length === 0 ? (
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
              No hay usuarios registrados.
            </div>
          ) : (
            users.map((u: User) => (
              <div
                key={u.id}
                className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col"
              >
                <div className="font-medium text-slate-900">{u.displayName || u.email}</div>
                <div className="text-slate-600 text-sm mt-0.5">{u.email}</div>
                <div className="text-slate-500 text-sm mt-1">{u.department ?? '—'}</div>
                <div className="mt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {u.role?.name ?? 'Sin rol'}
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
            ))
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
