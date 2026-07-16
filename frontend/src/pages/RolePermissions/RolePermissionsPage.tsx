import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { notifySuccess, notifyError } from '../../lib/toast';
import { Modal } from '../../components/ui/Modal';

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
    <Modal title="Nuevo rol" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Nombre *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: supervisor"
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Descripción (opcional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción del rol"
            className="input-field w-full"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
            {submitting ? 'Creando...' : 'Crear rol'}
          </button>
        </div>
      </form>
    </Modal>
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
    notifySuccess('Rol guardado correctamente.');
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
      notifySuccess('Permisos actualizados correctamente.');
    },
    onError: () => notifyError('No se pudieron actualizar los permisos.'),
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
      <div>
        <h2 className="text-2xl font-bold uppercase tracking-wide" style={{ color: 'var(--color-text)' }}>Permisos por rol</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Matriz de acceso por recurso del sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-[16px] p-5" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-soft)' }}>Seleccionar rol</h3>
          <ul className="space-y-1">
            {roles.map((r: Role) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => handleSelectRole(r.id)}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={
                    selectedRoleId === r.id
                      ? { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }
                      : { color: 'var(--color-text-soft)' }
                  }
                >
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ border: '1px dashed var(--color-border-strong)', color: 'var(--color-text-muted)' }}
          >
            + Nuevo rol
          </button>
          {roles.length === 0 && (
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>No hay roles cargados.</p>
          )}
        </div>

        <div className="lg:col-span-2 rounded-[16px] p-5" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
          {!selectedRoleId ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Selecciona un rol para asignar permisos.</p>
          ) : (
            <>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>
                  Permisos para: {selectedRole?.name}
                </h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={selectAll} className="text-sm text-primary font-medium hover:underline">
                    Marcar todos
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Desmarcar todos
                  </button>
                  {hasChanges && (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {(Object.entries(groupedByResource) as [string, Permission[]][]).map(([resource, perms]) => (
                  <div key={resource} className="rounded-lg p-3" style={{ border: '1px solid var(--color-border)' }}>
                    <p className="text-sm font-bold mb-2 capitalize" style={{ color: 'var(--color-text-soft)' }}>{resource}</p>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((p: Permission) => {
                        const checked = selectedIds.has(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`badge ${checked ? 'badge-amber' : 'badge-slate'} gap-1.5 cursor-pointer`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(p.id)}
                              className="sr-only"
                            />
                            <span className="material-icons" style={{ fontSize: 14 }}>
                              {checked ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            {p.action}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {allPermissions.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No hay permisos definidos en el sistema.</p>
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
