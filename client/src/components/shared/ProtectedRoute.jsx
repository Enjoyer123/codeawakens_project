import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchUserProfile } from '../../services/profileService';
import PageLoader from "./Loading/PageLoader";
import useUserStore from '../../store/useUserStore';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { setRole, role } = useUserStore();
  // Optimize: If role is already loaded in store, don't start with loading=true
  const [loading, setLoading] = useState(() => {
    if (!isLoaded) return true;
    if (isSignedIn && role === null) return true;
    return false;
  });

  useEffect(() => {
    const fetchRole = async () => {
      if (!isLoaded) {
        setLoading(true);
        return;
      }

      if (isSignedIn && role === null) {
        setLoading(true);
        try {
          const profile = await fetchUserProfile(getToken);
          setRole(profile.role);
        } catch (error) {
          console.error('Failed to fetch user role:', error);
        } finally {
          setLoading(false);
        }
      } else if (!isSignedIn) {
        setRole(null);
        setLoading(false);
      } else if (isSignedIn && role !== null) {
        setLoading(false);
      }
    };

    fetchRole();
  }, [isSignedIn, isLoaded, role, getToken, setRole]);

  // รอให้ Clerk โหลดเสร็จก่อน
  if (!isLoaded) {
    return <PageLoader message="Authentication..." />;
  }

  // ถ้ายังโหลด role อยู่ ให้แสดง loading state แทนที่จะ render children
  if (loading) {
    return (
      <PageLoader message="Checking permissions..." />
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (role === null) {
    // ถ้าไม่สามารถโหลด role ได้ ให้ redirect กลับหน้าแรก
    return <Navigate to="/" replace />;
  }

  // ตรวจสอบ role ก่อน render children เพื่อป้องกันการแสดงหน้าแวปนึง
  if (requiredRole && role !== requiredRole) {
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

