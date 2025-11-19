import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/shared/ProtectedRoute";
import AuthCallback from "../pages/auth/AuthCallback";
import LandingPage from "../pages/Landing";
import UserProfile from "../pages/user/UserProfile";
import MapSelect from "../pages/user/MapSelect";
import AdminDashboard from "../pages/admin/AdminDashBoard";
import UserManagement from "../pages/admin/UserManagement";
import AdminAddBlock from "../pages/admin/AdminAddBlock";
import NavLayout from "../layouts/NavLayout";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<NavLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="auth/callback" element={<AuthCallback />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <NavLayout />
          </ProtectedRoute>
        }
      >
        <Route path="user/profile" element={<UserProfile />} />
        
        <Route path="user/mapselect" element={<MapSelect />} />
      </Route>

      <Route
        element={
          <ProtectedRoute requiredRole="admin">
            <NavLayout />
          </ProtectedRoute>
        }
      >
        <Route path="admin" index element={<AdminDashboard />} />
        <Route path="admin/users" element={<UserManagement />} />
        <Route path="admin/addblock" element={<AdminAddBlock />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
