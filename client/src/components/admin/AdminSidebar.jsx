import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Map, Award, Sword, Bell, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const adminNavItems = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'User Management',
      path: '/admin/users',
      icon: Users,
    },
    {
      label: 'Level Management',
      path: '/admin/levels',
      icon: Map,
    },
    {
      label: 'Weapons Management',
      path: '/admin/weapons',
      icon: Sword,
    },
    {
      label: 'Reward Management',
      path: '/admin/rewards',
      icon: Award,
    },
    {
      label: 'Notification Management',
      path: '/admin/notifications',
      icon: Bell,
    },
  ];

  // ตรวจสอบว่าอยู่ใน admin route หรือไม่
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (!isAdminRoute) {
    return null;
  }

  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>
        <nav className="space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full transition-all',
                  isCollapsed ? 'justify-center px-2' : 'justify-start',
                  isActive && 'bg-primary text-primary-foreground'
                )}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn("w-5 h-5", !isCollapsed && "mr-3")} />
                {!isCollapsed && <span>{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;

