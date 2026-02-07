import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import useUserStore from '../../store/useUserStore';

import PageLoader from '../../components/shared/Loading/PageLoader';

import { API_BASE_URL } from '../../config/apiConfig';

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
              `${API_BASE_URL}/profile/check-profile`,
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
      <PageLoader message="Loading..." />
    );
  }

  return null;
};

export default AuthCallback;
