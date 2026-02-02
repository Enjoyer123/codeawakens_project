import { Navigate, useLocation } from "react-router-dom";
import useUserStore from "../../store/useUserStore";
import { useProfile } from "../../services/hooks/useProfile";
import PageLoader from "./Loading/PageLoader";

const RequirePreTest = ({ children }) => {
  const { role } = useUserStore(); // Still use role for initial check if available
  const location = useLocation();

  // Use profile hook for authoritative data
  const { data: userProfile, isLoading } = useProfile();

  // If loading profile, show nothing or loader to prevent premature redirect
  if (isLoading) {
    return <PageLoader message="Verifying..." />;
  }

  // Check backend data
  const backendPreScore = userProfile?.user?.pre_score;
  const hasPreScore = backendPreScore !== undefined && backendPreScore !== null;
  const userRole = userProfile?.user?.role || role;

  // Bypass for Admin
  if (userRole === 'admin') {
    return children;
  }

  // If User and NO score found in backend
  if (userRole === 'user' && !hasPreScore) {
    return <Navigate to="/test/pre" state={{ from: location }} replace />;
  }

  return children;
};

export default RequirePreTest;
