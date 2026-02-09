import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Auth/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { VehiclesList } from './pages/Vehicles/VehiclesList';
import { ReservationsList } from './pages/Reservations/ReservationsList';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { UsersList } from './pages/Users/UsersList';
import { ProvidersList } from './pages/Providers/ProvidersList';

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
              <Route index element={<Dashboard />} />
              <Route path="vehicles" element={<VehiclesList />} />
              <Route path="reservations" element={<ReservationsList />} />
              <Route path="users" element={<UsersList />} />
              <Route path="providers" element={<ProvidersList />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
