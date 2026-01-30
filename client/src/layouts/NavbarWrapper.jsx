import { Outlet, useLocation } from "react-router";
import Navbar from '../components/shared/navbar/Navbar';
import useUserStore from '../store/useUserStore';
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { fetchUserProfile } from '../services/profileService';
import PageLoader from '../components/shared/Loading/PageLoader';

const NavbarWrapper = () => {
  const { role, setRole, setScores } = useUserStore();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  // If we are signed in but role is missing, we are loading. 
  // If not loaded yet, we treat as loading (or let isLoaded handle it).
  // But strictly for roleLoading:
  const [roleLoading, setRoleLoading] = useState(() => {
    if (!isLoaded) return true;
    if (isSignedIn && role === null) return true;
    return false;
  });
  const { pathname } = useLocation();

  useEffect(() => {
    const fetchRole = async () => {
      if (!isLoaded) {
        setRoleLoading(true);
        return;
      }

      if (isSignedIn && role === null) {
        try {
          const profile = await fetchUserProfile(getToken);
          setRole(profile.role);
          setScores(profile.pre_score, profile.post_score);
        } catch (error) {
          console.error('Failed to fetch user role:', error);
        } finally {
          setRoleLoading(false);
        }
      } else if (!isSignedIn) {
        setRole(null);
        setRoleLoading(false);
      } else if (isSignedIn && role !== null) {
        setRoleLoading(false);
      }
    };

    fetchRole();
  }, [isSignedIn, isLoaded, role, getToken, setRole]);

  // รอให้ Clerk และ role โหลดเสร็จก่อน
  const isLoading = !isLoaded || roleLoading;

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
        label: 'Profile',
        path: '/user/profile'
      }
    ];
  }

  const isGamePage = pathname.startsWith('/user/mapselection/');

  return <Navbar navItems={navItems} isLoading={isLoading} isGamePage={isGamePage} />;
};

export default NavbarWrapper;
