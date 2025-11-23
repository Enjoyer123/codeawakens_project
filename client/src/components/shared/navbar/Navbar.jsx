import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignInButton, SignUpButton, useAuth, useClerk } from '@clerk/clerk-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function Navbar({ navItems = [], isLoading = false }) {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useAuth();
  const { signOut } = useClerk();

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="text-xl font-bold cursor-pointer hover:text-gray-300 transition-colors"
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
              <TooltipProvider>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={user?.imageUrl}
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
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
