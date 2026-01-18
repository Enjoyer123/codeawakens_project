import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignInButton, SignUpButton, useAuth, useClerk } from '@clerk/clerk-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Menu, X } from 'lucide-react';
import { fetchUserProfile } from '../../../services/profileService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationBell from './NotificationBell';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Navbar({ navItems = [], isLoading = false, isGamePage = false }) {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user, getToken } = useAuth(); // Added getToken
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(!isGamePage);
  const [dbProfileImage, setDbProfileImage] = useState(null);

  // Reset state when isGamePage changes
  useEffect(() => {
    setIsOpen(!isGamePage);
  }, [isGamePage]);

  // Fetch user profile from DB
  useEffect(() => {
    const loadUserProfile = async () => {
      if (isSignedIn) {
        try {
          const profileData = await fetchUserProfile(getToken);
          if (profileData && profileData.profile_image) {
            setDbProfileImage(profileData.profile_image);
          }
        } catch (error) {
          console.error("Failed to load user profile for navbar:", error);
        }
      }
    };

    if (isLoaded && isSignedIn) {
      loadUserProfile();
    }
  }, [isSignedIn, isLoaded, getToken]);

  // Collapsed state for game page
  if (isGamePage && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-2 left-2 z-50 p-2 bg-gray-800 text-white rounded-md shadow-lg hover:bg-gray-700 transition-colors"
        title="Open User Menu"
      >
        <Menu size={24} />
      </button>
    );
  }

  // Construct image URL
  const getAvatarSrc = () => {
    if (dbProfileImage) {
      if (dbProfileImage.startsWith('http') || dbProfileImage.startsWith('data:')) {
        return dbProfileImage;
      }
      return `${API_BASE_URL}${dbProfileImage}`;
    }
    return user?.imageUrl;
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg relative">
      {isGamePage && (
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 left-2 z-50 p-1 text-gray-400 hover:text-white"
          title="Collapse Menu"
        >
          <X size={24} />
        </button>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            className={`text-xl font-bold cursor-pointer hover:text-gray-300 transition-colors ${isGamePage ? 'ml-8' : ''}`}
            onClick={() => navigate("/")}
          >
            LOGO
          </div>

          <div className="flex items-center space-x-4">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className="px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                {item.label}
              </button>
            ))}

            {isLoading || !isLoaded ? (
              // ซ่อนปุ่ม Login/SignUp และ Avatar ระหว่างโหลด
              null
            ) : !isSignedIn ? (
              <div className="flex items-center space-x-2">
                <SignInButton mode="modal">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors">
                    Login
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition-colors">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <TooltipProvider>
                  <NotificationBell />
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={getAvatarSrc()}
                                alt={user?.fullName || user?.emailAddresses[0]?.emailAddress || "User"}
                              />
                              <AvatarFallback>
                                {user?.fullName?.[0] || user?.emailAddresses[0]?.emailAddress?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open settings</p>
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => navigate('/user/profile')}>
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          signOut();
                          navigate('/');
                        }}
                      >
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;