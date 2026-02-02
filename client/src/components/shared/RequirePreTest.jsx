import { Navigate, useLocation } from "react-router-dom";
import useUserStore from "../../store/useUserStore";

const RequirePreTest = ({ children }) => {
  const { preScore, role } = useUserStore();
  const location = useLocation();

  // If role is null (loading) or admin (bypass), or if preScore exists, allow access
  if (role === null) {
    // Still loading role, verify if authentication is also gone or in progress.
    // But typically if we are here, we might be waiting for NavbarWrapper to set the role.
    // So render nothing or a loader? 
    // Actually NavbarWrapper won't render Outlet if loading.
    // So if we are here, Outlet is rendered, meaning NavbarWrapper thinks it's done.
    // BUT, role might be null if not signed in? But this is a ProtectedRoute.
    // If ProtectedRoute passes, role shouldn't be null unless fetch failed.
    return children;
  }

  if (role === 'admin') {
    return children;
  }

  // If user is 'user' and hasn't taken pre-test (preScore is null)
  if (role === 'user' && (preScore === null || preScore === undefined)) {
    return <Navigate to="/test/pre" state={{ from: location }} replace />;
  }

  return children;
};

export default RequirePreTest;
