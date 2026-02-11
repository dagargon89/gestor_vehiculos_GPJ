import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';

type Permission = { id: string; resource: string; action: string };
type Role = { id: string; name: string; description?: string; permissions?: Permission[] };

function CreateRoleModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (newRoleId: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('El nombre del rol es obligatorio.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post<{ id: string }>('/roles', {
        name: trimmed,
        description: description.trim() || undefined,
      });
      onSuccess(res.data.id);
      onClose();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Error al crear el rol';
      setError(String(msg));
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
          <h3 className="text-lg font-bold text-slate-900">Nuevo rol</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: supervisor"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del rol"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex gap-3 pt-2">
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
              {submitting ? 'Creando...' : 'Crear rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RolePermissionsPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles');
      return res.data;
    },
  });

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await apiClient.get('/permissions');
      return res.data;
    },
  });

  const selectedRole = roles.find((r: Role) => r.id === selectedRoleId) as Role | undefined;

  const rolePermIdsJson = JSON.stringify(selectedRole?.permissions?.map((p: Permission) => p.id) ?? []);
  useEffect(() => {
    if (!selectedRoleId || !selectedRole?.permissions) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(selectedRole.permissions.map((p: Permission) => p.id)));
  }, [selectedRoleId, rolePermIdsJson]);

  const handleSelectRole = (roleId: string) => {
    setSelectedRoleId(roleId);
  };

  const handleRoleCreated = (newRoleId: string) => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
    setSelectedRoleId(newRoleId);
  };

  const togglePermission = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(allPermissions.map((p: Permission) => p.id)));
  const clearAll = () => setSelectedIds(new Set());

  const updateMutation = useMutation({
    mutationFn: (payload: { roleId: string; permissionIds: string[] }) =>
      apiClient.put(`/roles/${payload.roleId}`, { permissionIds: payload.permissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const handleSave = () => {
    if (!selectedRoleId) return;
    updateMutation.mutate({
      roleId: selectedRoleId,
      permissionIds: Array.from(selectedIds),
    });
  };

  const rolePermissionIds = new Set((selectedRole?.permissions ?? []).map((p: Permission) => p.id));
  const hasChanges =
    !!selectedRoleId &&
    (selectedIds.size !== rolePermissionIds.size ||
      Array.from(selectedIds).some((id) => !rolePermissionIds.has(id)) ||
      Array.from(rolePermissionIds).some((id) => !selectedIds.has(id)));

  const groupedByResource = allPermissions.reduce((acc: Record<string, Permission[]>, p: Permission) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Permisos por rol</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Seleccionar rol</h3>
          <ul className="space-y-1">
            {roles.map((r: Role) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => handleSelectRole(r.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedRoleId === r.id ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 w-full px-4 py-2.5 border border-dashed border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-primary hover:text-primary transition-colors"
          >
            + Nuevo rol
          </button>
          {roles.length === 0 && (
            <p className="text-slate-500 text-sm mt-2">No hay roles cargados.</p>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-[16px] shadow-sm border border-slate-200 p-5">
          {!selectedRoleId ? (
            <p className="text-slate-500">Selecciona un rol para asignar permisos.</p>
          ) : (
            <>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h3 className="text-sm font-bold text-slate-700">
                  Permisos para: {selectedRole?.name}
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Marcar todos
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm text-slate-600 font-medium hover:underline"
                  >
                    Desmarcar todos
                  </button>
                  {hasChanges && (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium"
                    >
                      {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {(Object.entries(groupedByResource) as [string, Permission[]][]).map(([resource, perms]) => (
                  <div key={resource} className="border border-slate-200 rounded-lg p-3">
                    <p className="text-sm font-bold text-slate-700 mb-2 capitalize">{resource}</p>
                    <div className="flex flex-wrap gap-3">
                      {perms.map((p: Permission) => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => togglePermission(p.id)}
                            className="rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-slate-700">{p.action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {allPermissions.length === 0 && (
                <p className="text-slate-500 text-sm">No hay permisos definidos en el sistema.</p>
              )}
            </>
          )}
        </div>
      </div>

      {createModalOpen && (
        <CreateRoleModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleRoleCreated}
        />
      )}
    </div>
  );
}
