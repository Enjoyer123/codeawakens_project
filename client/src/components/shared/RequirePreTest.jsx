import { Navigate, useLocation } from "react-router-dom";
import useUserStore from "../../store/useUserStore";

const RequirePreTest = ({ children }) => {
  const { preScore, role } = useUserStore();
  const location = useLocation();

  // If role is null (loading) or admin (bypass), or if preScore exists, allow access
  if (role === null) {
      // Still loading or not signed in? NavbarWrapper handles global loading, 
      // but here we might need to wait? 
      // Actually NavbarWrapper usually blocks rendering children if loading (isLoading prop passed to Navbar).
      // But AppRoutes structure renders Outlet inside NavLayout.
      // Let's assume if role is 'user' and preScore is null/undefined, then redirect.
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
