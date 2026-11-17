import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ResendVerification from './pages/ResendVerification';
import Home from './pages/Home';
import AdminUsers from './pages/AdminUsers';
import AdminLocations from './pages/AdminLocations';
import AdminMembers from './pages/AdminMembers';
import AdminSeasons from './pages/AdminSeasons';
import AdminPricing from './pages/AdminPricing';
import AdminLocationLayout from './pages/AdminLocationLayout';
import AdminSeasonDashboard from './pages/AdminSeasonDashboard';
import AdminSeasonDetail from './pages/AdminSeasonDetail';
import AdminUnits from './pages/AdminUnits';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
          <Route path="/resend-verification" element={<PublicRoute><ResendVerification /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminRoute access="content">
                  <AdminUsers />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/locations"
            element={
              <ProtectedRoute>
                <AdminRoute access="content">
                  <AdminLocations />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/locations/:locationId"
            element={
              <ProtectedRoute>
                <AdminRoute access="content">
                  <AdminUnits />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/members"
            element={
              <ProtectedRoute>
                <AdminRoute access="community">
                  <AdminMembers />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/seasons"
            element={
              <ProtectedRoute>
                <AdminRoute access="content">
                  <AdminSeasons />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/locations/:locationId/layout"
            element={
              <ProtectedRoute>
                <AdminRoute access="content">
                  <AdminLocationLayout />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/seasons/:seasonId"
            element={
              <ProtectedRoute>
                <AdminRoute access="content">
                  <AdminSeasonDashboard />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/seasons/:seasonId/enrollments"
            element={
              <ProtectedRoute>
                <AdminRoute access="content">
                  <AdminSeasonDetail />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/pricing"
            element={
              <ProtectedRoute>
                <AdminRoute access="pricing">
                  <AdminPricing />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
