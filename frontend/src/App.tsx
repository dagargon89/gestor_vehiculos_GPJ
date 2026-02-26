import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PermissionRoute } from './components/auth/PermissionRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Auth/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { VehiclesList } from './pages/Vehicles/VehiclesList';
import { ReservationsList } from './pages/Reservations/ReservationsList';
import { VehicleRequestPage } from './pages/VehicleRequest/VehicleRequestPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { UsersList } from './pages/Users/UsersList';
import { ProvidersList } from './pages/Providers/ProvidersList';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { MyRequestsPage } from './pages/MyRequests/MyRequestsPage';
import { MaintenanceList } from './pages/Maintenance/MaintenanceList';
import { IncidentList } from './pages/Incidents/IncidentList';
import { SanctionList } from './pages/Sanctions/SanctionList';
import { RolePermissionsPage } from './pages/RolePermissions/RolePermissionsPage';
import { SystemSettingsPage } from './pages/SystemSettings/SystemSettingsPage';
import { FuelRecordsList } from './pages/FuelRecords/FuelRecordsList';
import { AssignRolesPage } from './pages/AssignRoles/AssignRolesPage';
import { canAccessDashboard } from './config/routePermissions';
import { useAuth } from './contexts/AuthContext';

function DashboardOrRedirect() {
  const { userData } = useAuth();
  if (canAccessDashboard(userData?.permissions, userData?.role?.name))
    return <Dashboard />;
  return <Navigate to="/profile" replace />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardOrRedirect />} />
              <Route path="vehicles" element={<PermissionRoute resource="vehicles" action="read"><VehiclesList /></PermissionRoute>} />
              <Route path="solicitud-vehiculos" element={<PermissionRoute oneOf={[{ resource: 'reservations', action: 'read' }, { resource: 'reservations', action: 'create' }]}><VehicleRequestPage /></PermissionRoute>} />
              <Route path="reservations" element={<PermissionRoute resource="reservations" action="read"><ReservationsList /></PermissionRoute>} />
              <Route path="users" element={<PermissionRoute resource="users" action="read"><UsersList /></PermissionRoute>} />
              <Route path="providers" element={<PermissionRoute resource="providers" action="read"><ProvidersList /></PermissionRoute>} />
              <Route path="reports" element={<PermissionRoute resource="reports" action="read"><ReportsPage /></PermissionRoute>} />
              <Route path="maintenance" element={<PermissionRoute resource="maintenance" action="read"><MaintenanceList /></PermissionRoute>} />
              <Route path="fuel-records" element={<PermissionRoute resource="fuel_records" action="read"><FuelRecordsList /></PermissionRoute>} />
              <Route path="incidents" element={<PermissionRoute resource="incidents" action="read"><IncidentList /></PermissionRoute>} />
              <Route path="sanctions" element={<PermissionRoute resource="sanctions" action="read"><SanctionList /></PermissionRoute>} />
              <Route path="role-permissions" element={<PermissionRoute resource="roles" action="read"><RolePermissionsPage /></PermissionRoute>} />
              <Route path="system-settings" element={<PermissionRoute resource="system_settings" action="read"><SystemSettingsPage /></PermissionRoute>} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="asignar-roles" element={<AssignRolesPage />} />
              <Route path="mis-solicitudes" element={<PermissionRoute oneOf={[{ resource: 'reservations', action: 'read' }, { resource: 'reservations', action: 'create' }]}><MyRequestsPage /></PermissionRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
