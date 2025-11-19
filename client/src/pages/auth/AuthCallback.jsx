import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import useUserStore from '../../store/useUserStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const AuthCallback = () => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { setRole } = useUserStore();

  useEffect(() => {
    const handleAuth = async () => {
      if (isLoaded) {
        if (isSignedIn) {
          try {
            const token = await getToken();
            const response = await fetch(
              `${API_BASE_URL}/api/profile/check-profile`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            
            if (!response.ok) {
              throw new Error('Failed to check profile');
            }
            
            const data = await response.json();
            setRole(data.role);
            
            if (data.loggedIn) {
              if (data.hasProfile) {
                if (data.role === 'admin') {
                  navigate("/admin");
                } else {
                  navigate("/user/profile");
                }
              } else {
                navigate("/user/profile");
              }
            } else {
              navigate("/");
            }
          } catch (error) {
            navigate("/");
          }
        } else {
          navigate("/");
        }
        setLoading(false);
      }
    };

    handleAuth();
  }, [isSignedIn, isLoaded, navigate, getToken, setRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
