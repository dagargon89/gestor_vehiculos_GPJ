import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { SearchSelect } from '../../components/ui/SearchSelect';

type Role = { id: string; name: string; description?: string };

type User = {
  id: string;
  email: string;
  displayName?: string;
  roleId?: string;
  role?: Role;
};

export function AssignRolesPage() {
  const queryClient = useQueryClient();
  const [localRoleIds, setLocalRoleIds] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data;
    },
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles');
      return res.data;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string | null }) => {
      await apiClient.put(`/users/${userId}`, { roleId });
    },
    onSuccess: (_, { userId }) => {
      setSavingId(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setLocalRoleIds((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    },
    onError: (err: unknown) => {
      setSavingId(null);
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Error al guardar';
      setError(String(msg));
    },
  });

  const getCurrentRoleId = (u: User) =>
    localRoleIds[u.id] !== undefined ? localRoleIds[u.id] : (u.roleId ?? '');

  const handleRoleChange = (userId: string, value: string) => {
    setLocalRoleIds((prev) => ({ ...prev, [userId]: value }));
    setError(null);
  };

  const handleSave = (u: User) => {
    const roleId = getCurrentRoleId(u).trim() || null;
    const same = (u.roleId ?? '') === (roleId ?? '');
    if (same) return;
    setSavingId(u.id);
    updateRoleMutation.mutate({ userId: u.id, roleId });
  };

  const isLoading = usersLoading || rolesLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-primary font-bold">Cargando usuarios y roles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-slate-900">Asignar roles a usuarios</h2>
      <p className="text-slate-600 text-sm">
        Usuarios registrados en el sistema. Elige un rol y pulsa Guardar para actualizar.
      </p>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Usuario</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Email</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Rol actual</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Nuevo rol</th>
              <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((u: User) => {
                const currentRoleId = getCurrentRoleId(u);
                const hasChange = (u.roleId ?? '') !== (currentRoleId.trim() || '');
                return (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {u.displayName || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {u.role?.name ?? (u.roleId && roles.find((r: Role) => r.id === u.roleId)?.name) ?? 'Sin rol'}
                    </td>
                    <td className="px-6 py-4">
                      <SearchSelect
                        options={[
                          { value: '', label: 'Sin rol' },
                          ...roles.map((r: Role) => ({ value: r.id, label: r.name })),
                        ]}
                        value={currentRoleId}
                        onChange={(v) => handleRoleChange(u.id, v)}
                        placeholder="Seleccionar rol"
                        className="w-48"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSave(u)}
                        disabled={!hasChange || savingId === u.id}
                        className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {savingId === u.id ? 'Guardando…' : 'Guardar'}
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
    </div>
  );
}
