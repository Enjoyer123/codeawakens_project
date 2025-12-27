import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "../components/shared/ProtectedRoute";
import AuthCallback from "../pages/auth/AuthCallback";
import LandingPage from "../pages/Landing";
import UserProfile from "../pages/user/UserProfile";
import MapSelect from "../pages/user/MapSelect";
import CategoryLevels from "../pages/user/CategoryLevels";
import LevelGame from "../pages/user/LevelGame";
import TestPage from "../pages/user/TestPage";
import AdminDashboard from "../pages/admin/dashboard/AdminDashBoard";
import UserManagement from "../pages/admin/user/UserManagement";
import WeaponManagement from "../pages/admin/weapon/WeaponManagement";
import LevelManagement from "../pages/admin/level/LevelManagement";
import LevelCreateEdit from "../pages/admin/level/LevelCreateEdit";
import LevelHintManagement from "../pages/admin/level/LevelHintManagement";
import PatternCreateEdit from "../pages/admin/pattern/PatternCreateEdit";
import StarterCreateEdit from "../pages/admin/level/StarterCreateEdit";
import PreviewLevel from "../pages/admin/level/PreviewLevel";
import RewardManagement from "../pages/admin/reward/RewardManagement";
import BlockManagement from "../pages/admin/block/BlockManagement";
import VictoryConditionManagement from "../pages/admin/victoryCondition/VictoryConditionManagement";
import LevelCategoryManagement from "../pages/admin/levelCategory/LevelCategoryManagement";
import TestCaseManagement from "../pages/admin/level/TestCaseManagement";
import LevelGuideManagement from "../pages/admin/level/LevelGuideManagement";
import TestManagement from "../pages/admin/test/TestManagement";
import NavLayout from "../layouts/NavLayout";
import RequirePreTest from "../components/shared/RequirePreTest";

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

        <Route element={<RequirePreTest><Outlet /></RequirePreTest>}>
          <Route path="user/mapselect" element={<MapSelect />} />
          <Route path="user/mapselect/:categoryId" element={<CategoryLevels />} />
          <Route path="user/mapselection/:levelId" element={<LevelGame />} />
        </Route>

        {/* Test Routes */}
        <Route path="test/:type" element={<TestPage />} />
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
        <Route path="admin/levels/:levelId/hints" element={<LevelHintManagement />} />
        <Route path="admin/levels/:levelId/guides" element={<LevelGuideManagement />} />
        <Route path="admin/levels/:levelId/test-cases" element={<TestCaseManagement />} />
        <Route path="admin/tests" element={<TestManagement />} />
        <Route path="admin/levels/:levelId/patterns/create" element={<PatternCreateEdit />} />
        <Route path="admin/levels/:levelId/patterns/:patternId/edit" element={<PatternCreateEdit />} />
        <Route path="admin/levels/:levelId/starters/create" element={<StarterCreateEdit />} />
        <Route path="admin/levels/:levelId/preview" element={<PreviewLevel />} />
        <Route path="admin/levels/:levelId/preview/:patternId" element={<PreviewLevel />} />
        <Route path="admin/level-categories" element={<LevelCategoryManagement />} />
        <Route path="admin/rewards" element={<RewardManagement />} />
        <Route path="admin/blocks" element={<BlockManagement />} />
        <Route path="admin/victory-conditions" element={<VictoryConditionManagement />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;