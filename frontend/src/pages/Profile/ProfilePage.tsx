import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api.service';

interface ProfileData {
  displayName: string;
  phone: string;
  department: string;
  employeeId: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

const LICENSE_TYPES = [
  { value: '', label: 'Seleccionar...' },
  { value: 'A', label: 'Tipo A — Motocicletas' },
  { value: 'B', label: 'Tipo B — Automóviles' },
  { value: 'C', label: 'Tipo C — Camiones' },
  { value: 'D', label: 'Tipo D — Transporte público' },
  { value: 'E', label: 'Tipo E — Vehículos especiales' },
];

export function ProfilePage() {
  const { userData, currentUser, refreshUserData } = useAuth();
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<ProfileData>({
    displayName: '',
    phone: '',
    department: '',
    employeeId: '',
    licenseNumber: '',
    licenseType: '',
    licenseExpiry: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });

  // Cargar datos completos del perfil desde el backend
  useEffect(() => {
    if (!userData?.id) return;
    apiClient.get(`/users/${userData.id}`).then((res) => {
      const u = res.data;
      setForm({
        displayName: u.displayName || '',
        phone: u.phone || '',
        department: u.department || '',
        employeeId: u.employeeId || '',
        licenseNumber: u.licenseNumber || '',
        licenseType: u.licenseType || '',
        licenseExpiry: u.licenseExpiry ? u.licenseExpiry.slice(0, 10) : '',
        emergencyContactName: u.emergencyContactName || '',
        emergencyContactPhone: u.emergencyContactPhone || '',
        emergencyContactRelationship: u.emergencyContactRelationship || '',
      });
    });
  }, [userData?.id]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ProfileData> & { photoUrl?: string }) => {
      const res = await apiClient.post(`/auth/sync-user`, data);
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setEditing(false);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al guardar los cambios.';
      setError(String(msg));
    },
  });

  const handleSave = () => {
    setError(null);
    const payload: Record<string, unknown> = {};
    if (form.displayName.trim()) payload.displayName = form.displayName.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.department.trim()) payload.department = form.department.trim();
    if (form.employeeId.trim()) payload.employeeId = form.employeeId.trim();
    if (form.licenseNumber.trim()) payload.licenseNumber = form.licenseNumber.trim();
    if (form.licenseType) payload.licenseType = form.licenseType;
    if (form.licenseExpiry) payload.licenseExpiry = form.licenseExpiry;
    if (form.emergencyContactName.trim()) payload.emergencyContactName = form.emergencyContactName.trim();
    if (form.emergencyContactPhone.trim()) payload.emergencyContactPhone = form.emergencyContactPhone.trim();
    if (form.emergencyContactRelationship.trim()) payload.emergencyContactRelationship = form.emergencyContactRelationship.trim();
    updateMutation.mutate(payload as Partial<ProfileData>);
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
    // Recargar datos originales
    if (userData?.id) {
      apiClient.get(`/users/${userData.id}`).then((res) => {
        const u = res.data;
        setForm({
          displayName: u.displayName || '',
          phone: u.phone || '',
          department: u.department || '',
          employeeId: u.employeeId || '',
          licenseNumber: u.licenseNumber || '',
          licenseType: u.licenseType || '',
          licenseExpiry: u.licenseExpiry ? u.licenseExpiry.slice(0, 10) : '',
          emergencyContactName: u.emergencyContactName || '',
          emergencyContactPhone: u.emergencyContactPhone || '',
          emergencyContactRelationship: u.emergencyContactRelationship || '',
        });
      });
    }
  };

  const update = (field: keyof ProfileData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData?.id) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Formato no válido. Usa JPG, PNG, WebP o GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5 MB.');
      return;
    }
    setError(null);
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'user');
      formData.append('entityId', userData.id);
      const uploadRes = await apiClient.post('/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const firebaseUrl = uploadRes.data.firebaseUrl;
      await apiClient.post('/auth/sync-user', { photoUrl: firebaseUrl });
      await refreshUserData();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al subir la foto.';
      setError(String(msg));
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const inputClass = (disabled: boolean) =>
    `w-full px-4 py-2.5 border rounded-[12px] text-sm font-medium transition-colors ${
      disabled
        ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed'
        : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-primary/30 focus:border-primary'
    }`;

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mi perfil</h2>
          <p className="text-sm text-slate-500 mt-1">Gestiona tu información personal y de contacto.</p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-[12px] hover:bg-primary-dark font-medium text-sm transition-colors shadow-sm"
          >
            <span className="material-icons text-lg">edit</span>
            Editar perfil
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-[12px] hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-[12px] hover:bg-primary-dark font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <span className="material-icons text-lg">save</span>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>

      {/* Alertas */}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
          <span className="material-icons text-green-600">check_circle</span>
          Perfil actualizado correctamente.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          <span className="material-icons text-red-500">error_outline</span>
          {error}
        </div>
      )}

      {/* Tarjeta de cabecera del perfil */}
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary to-indigo-500" />
        <div className="relative px-6 pb-6 pt-14 -mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar con opción de subir foto */}
            <div className="relative flex-shrink-0">
              {userData?.photoUrl || currentUser?.photoURL ? (
                <img
                  src={userData?.photoUrl ?? currentUser?.photoURL ?? ''}
                  alt=""
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl bg-slate-100"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center text-slate-400">
                  <span className="material-icons text-5xl">person</span>
                </div>
              )}
              {editing && (
                <>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoUploading}
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/60 transition-colors disabled:opacity-70"
                  >
                    {photoUploading ? (
                      <span className="material-icons text-3xl animate-spin">refresh</span>
                    ) : (
                      <>
                        <span className="material-icons text-2xl">photo_camera</span>
                        <span className="text-xs font-medium mt-1">Subir foto</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
            <div className="min-w-0 pb-1">
              <h3 className="text-xl font-bold text-slate-900 truncate">
                {userData?.displayName || currentUser?.displayName || 'Usuario'}
              </h3>
              <p className="text-sm text-slate-500 truncate mt-0.5">{userData?.email || currentUser?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  <span className="material-icons text-xs">badge</span>
                  {userData?.role?.name || 'Usuario'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones del formulario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información personal */}
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-icons text-primary text-xl">person</span>
            </div>
            <h4 className="text-base font-bold text-slate-900">Información personal</h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre completo</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => update('displayName', e.target.value)}
                disabled={!editing}
                className={inputClass(!editing)}
                placeholder="Tu nombre completo"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                disabled={!editing}
                className={inputClass(!editing)}
                placeholder="+52 614 123 4567"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Departamento</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => update('department', e.target.value)}
                  disabled={!editing}
                  className={inputClass(!editing)}
                  placeholder="Ej. Logística"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">No. empleado</label>
                <input
                  type="text"
                  value={form.employeeId}
                  onChange={(e) => update('employeeId', e.target.value)}
                  disabled={!editing}
                  className={inputClass(!editing)}
                  placeholder="Ej. EMP-001"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Licencia de conducir */}
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <span className="material-icons text-indigo-500 text-xl">directions_car</span>
            </div>
            <h4 className="text-base font-bold text-slate-900">Licencia de conducir</h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Número de licencia</label>
              <input
                type="text"
                value={form.licenseNumber}
                onChange={(e) => update('licenseNumber', e.target.value)}
                disabled={!editing}
                className={inputClass(!editing)}
                placeholder="Número de licencia"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo</label>
                <select
                  value={form.licenseType}
                  onChange={(e) => update('licenseType', e.target.value)}
                  disabled={!editing}
                  className={inputClass(!editing)}
                >
                  {LICENSE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vencimiento</label>
                <input
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(e) => update('licenseExpiry', e.target.value)}
                  disabled={!editing}
                  className={inputClass(!editing)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contacto de emergencia */}
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
              <span className="material-icons text-rose-500 text-xl">emergency</span>
            </div>
            <h4 className="text-base font-bold text-slate-900">Contacto de emergencia</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre</label>
              <input
                type="text"
                value={form.emergencyContactName}
                onChange={(e) => update('emergencyContactName', e.target.value)}
                disabled={!editing}
                className={inputClass(!editing)}
                placeholder="Nombre del contacto"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={form.emergencyContactPhone}
                onChange={(e) => update('emergencyContactPhone', e.target.value)}
                disabled={!editing}
                className={inputClass(!editing)}
                placeholder="+52 614 987 6543"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Parentesco</label>
              <input
                type="text"
                value={form.emergencyContactRelationship}
                onChange={(e) => update('emergencyContactRelationship', e.target.value)}
                disabled={!editing}
                className={inputClass(!editing)}
                placeholder="Ej. Esposo/a, Padre/Madre"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
