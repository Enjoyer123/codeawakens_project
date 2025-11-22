import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/shared/ProtectedRoute";
import AuthCallback from "../pages/auth/AuthCallback";
import LandingPage from "../pages/Landing";
import UserProfile from "../pages/user/UserProfile";
import MapSelect from "../pages/user/MapSelect";
import AdminDashboard from "../pages/admin/AdminDashBoard";
import UserManagement from "../pages/admin/UserManagement";
import WeaponManagement from "../pages/admin/weapon/WeaponManagement";
import LevelManagement from "../pages/admin/LevelManagement";
import LevelCreateEdit from "../pages/admin/LevelCreateEdit";
import RewardManagement from "../pages/admin/reward/RewardManagement";
import GuideManagement from "../pages/admin/GuideManagement";
import BlockManagement from "../pages/admin/BlockManagement";
import VictoryConditionManagement from "../pages/admin/VictoryConditionManagement";
import LevelCategoryManagement from "../pages/admin/LevelCategoryManagement";
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
        <Route path="admin/weapons" element={<WeaponManagement />} />
        <Route path="admin/levels" element={<LevelManagement />} />
        <Route path="admin/levels/create" element={<LevelCreateEdit />} />
        <Route path="admin/levels/:levelId/edit" element={<LevelCreateEdit />} />
        <Route path="admin/level-categories" element={<LevelCategoryManagement />} />
        <Route path="admin/rewards" element={<RewardManagement />} />
        <Route path="admin/guides" element={<GuideManagement />} />
        <Route path="admin/blocks" element={<BlockManagement />} />
        <Route path="admin/victory-conditions" element={<VictoryConditionManagement />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
