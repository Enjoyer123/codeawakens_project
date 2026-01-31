import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { API_BASE_URL } from '../../../config/apiConfig';

function Navbar({ navItems = [], isLoading = false, isGamePage = false, isTransparent = false }) {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user, getToken } = useAuth();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const [dbProfileImage, setDbProfileImage] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for transparent mode
  useEffect(() => {
    if (!isTransparent) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTransparent]);

  // Collapsed state for game page
  useEffect(() => {
    if (isGamePage) {
      setIsOpen(false);
    }
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

  if (isGamePage && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-2 left-2 z-50 p-2 bg-[#a855f7] border-2 border-white text-white shadow-lg hover:bg-[#9333ea] transition-colors pixel-font text-xs"
        title="Open User Menu"
      >
        <Menu size={20} />
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

  const navbarClasses = isTransparent
    ? `fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#120a1f]/95 py-2 border-b-4 border-[#a855f7]' : 'bg-transparent py-6'}`
    : 'relative w-full z-50 bg-[#120a1f] border-b-4 border-[#a855f7] py-2';

  return (
    <nav className={navbarClasses}>
      {isGamePage && (
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 left-2 z-50 p-1 text-white hover:text-[#c084fc]"
          title="Collapse Menu"
        >
          <X size={24} />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center scale-90 md:scale-100 origin-left">
            <img
              src="https://eastwardgame.com/wp-content/themes/eastward/assets/images/logo-eastward.png"
              alt="Eastward Logo"
              className="h-10 md:h-14 object-contain brightness-0 invert hue-rotate-[280deg]"
            />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-4">
          <Button
            className="p-1 bg-[#a855f7] border-2 border-white rounded-none h-auto"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex flex-1 justify-end items-center gap-8">
          <div className="flex gap-8 items-center mr-8">
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
                className="pixel-font text-xs hover:text-[#c084fc] transition-colors text-white uppercase"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {isLoading || !isLoaded ? (
              null
            ) : !isSignedIn ? (
              <>
                <SignInButton mode="modal">
                  <Button className="pixel-btn-purple text-xs px-6 py-2 rounded-none h-auto">
                    LOGIN
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="pixel-btn-white text-xs px-6 py-2 rounded-none h-auto">
                    SIGN UP
                  </Button>
                </SignUpButton>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <TooltipProvider>
                  <NotificationBell />
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#120a1f] focus:ring-[#a855f7]">
                            <Avatar className="h-10 w-10 border-2 border-white">
                              <AvatarImage
                                src={getAvatarSrc()}
                                alt={user?.fullName || user?.emailAddresses[0]?.emailAddress || "User"}
                              />
                              <AvatarFallback className="text-black bg-[#c084fc]">
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
                    <DropdownMenuContent align="end" className="w-56 bg-[#1e1430] border-[#a855f7] text-white">
                      <DropdownMenuItem
                        onClick={() => navigate('/user/profile')}
                        className="focus:bg-[#a855f7] focus:text-white cursor-pointer"
                      >
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          signOut();
                          navigate('/');
                        }}
                        className="focus:bg-[#a855f7] focus:text-white cursor-pointer"
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

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#1e1430] border-b-8 border-[#a855f7] flex flex-col p-6 gap-6 animate-in slide-in-from-top duration-300 z-50 shadow-2xl">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setIsOpen(false);
                if (item.onClick) item.onClick();
                else if (item.path) navigate(item.path);
              }}
              className="pixel-font text-lg text-[#c084fc] text-left uppercase"
            >
              {item.label}
            </button>
          ))}
          <div className="flex flex-col gap-4 mt-4">
            {!isLoaded ? null : !isSignedIn ? (
              <>
                <SignInButton mode="modal">
                  <Button className="pixel-btn-purple w-full py-4 text-center rounded-none h-auto">
                    LOGIN
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="pixel-btn-white w-full py-4 text-center rounded-none h-auto">
                    SIGN UP
                  </Button>
                </SignUpButton>
              </>
            ) : (
              <Button
                className="pixel-btn-white w-full py-4 text-center rounded-none h-auto"
                onClick={() => {
                  signOut();
                  navigate('/');
                  setIsOpen(false);
                }}
              >
                LOGOUT
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;