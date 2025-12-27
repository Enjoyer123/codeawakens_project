import { Outlet, useLocation } from "react-router";
import Navbar from '../components/shared/navbar/Navbar';
import useUserStore from '../store/useUserStore';
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { fetchUserProfile } from '../services/profileService';

const NavbarWrapper = () => {
  const { role, setRole, setScores } = useUserStore();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [roleLoading, setRoleLoading] = useState(true);
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
    return <Navbar navItems={[]} isLoading={isLoading} />;
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
