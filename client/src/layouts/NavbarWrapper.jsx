import { Outlet, useLocation } from "react-router";
import Navbar from '../components/shared/navbar/Navbar';
import useUserStore from '../store/useUserStore';
import { useAuth } from '@clerk/clerk-react';
import { useProfile } from '../services/hooks/useProfile';
import { useEffect } from 'react';
import PageLoader from '../components/shared/Loading/PageLoader';

const NavbarWrapper = (props) => {
  const { role, setRole, setScores } = useUserStore();
  const { isSignedIn, isLoaded } = useAuth();
  const { pathname } = useLocation();

  // Use the standardized hook for profile data
  const {
    data: profile,
    isLoading: isProfileLoading
  } = useProfile();

  // Sync profile data to store when available
  useEffect(() => {
    if (profile && profile.user) {
      setRole(profile.user.role);
      setScores(profile.user.pre_score, profile.user.post_score);
    } else if (isLoaded && !isSignedIn) {
      // Clear role if not signed in
      setRole(null);
    }
  }, [profile, isSignedIn, isLoaded, setRole, setScores]);

  // Combined loading state
  // We wait for Clerk (isLoaded) and if signed in, wait for Profile (isProfileLoading)
  const isLoading = !isLoaded || (isSignedIn && isProfileLoading);

  // ถ้ายังโหลดอยู่ ให้ส่ง navItems ว่าง
  if (isLoading) {
    return <PageLoader message="Initializing..." />;
  }

  let navItems = [];

  if (!isSignedIn) {
    navItems = [
      {
        label: 'Contact',
        path: '/Contact'
      },
    ];
  } else if (role === 'admin') {
    navItems = [
      {
        label: 'Home',
        path: '/'
      },
      {
        label: 'Contact',
        path: '/Contact'
      },
      {
        label: 'Play',
        path: '/user/mapselect'
      },
      {
        label: 'Leaderboard',
        path: '/user/leaderboard'
      },
      {
        label: 'Profile',
        path: '/user/profile'
      },
      {
        label: 'Dashboard',
        path: '/admin'
      }
    ];
  } else if (role === 'user') {
    navItems = [
      {
        label: 'Home',
        path: '/'
      },
      {
        label: 'Contact',
        path: '/Contact'
      },
      {
        label: 'Play',
        path: '/user/mapselect'
      },
      {
        label: 'Leaderboard',
        path: '/user/leaderboard'
      },
      {
        label: 'Profile',
        path: '/user/profile'
      }
    ];
  }

  const isGamePage = pathname.startsWith('/user/mapselection/');

  return <Navbar navItems={navItems} isLoading={isLoading} isGamePage={isGamePage} {...props} />;
};

export default NavbarWrapper;
