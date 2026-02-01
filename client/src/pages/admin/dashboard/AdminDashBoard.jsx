import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Map, Award, Sword, Bell, BarChart3, PieChart, Book, Blocks, Star, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';
import {
  useDashboardStats,
  useLevelStats,
  useUserStats,
  useTestStats
} from '../../../services/hooks/useDashboard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminDashBoard = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // TanStack Query Hooks
  const { data: statsData, isLoading: loadingOverview } = useDashboardStats();
  const { data: levelsData, isLoading: loadingLevels } = useLevelStats();
  const { data: usersData, isLoading: loadingUsers } = useUserStats();
  const { data: testsData, isLoading: loadingTests } = useTestStats();

  const loading = loadingOverview || loadingLevels || loadingUsers || loadingTests;

  // Defaults
  const stats = statsData || {
    totalUsers: 0,
    totalLevels: 0,
    totalCompletions: 0,
    totalStars: 0
  };

  const levelStats = levelsData || [];
  const userStats = usersData || { skillDistribution: [] };
  const testStats = testsData || [];

  const adminNavItems = [
    { label: 'USER MANAGEMENT', path: '/admin/users', icon: Users },
    { label: 'LEVEL MANAGEMENT', path: '/admin/levels', icon: Map },
    { label: 'WEAPONS MANAGEMENT', path: '/admin/weapons', icon: Sword },
    { label: 'REWARD MANAGEMENT', path: '/admin/rewards', icon: Award },
    { label: 'GUIDE MANAGEMENT', path: '/admin/guides', icon: Book },
    { label: 'BLOCK MANAGEMENT', path: '/admin/blocks', icon: Blocks },
    { label: 'NOTIFICATION MANAGEMENT', path: '/admin/notifications', icon: Bell },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Users className="w-8 h-8 text-blue-500 mb-2" />
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Map className="w-8 h-8 text-green-500 mb-2" />
              <div className="text-2xl font-bold">{stats.totalLevels}</div>
              <p className="text-xs text-muted-foreground">Total Levels</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <CheckCircle className="w-8 h-8 text-purple-500 mb-2" />
              <div className="text-2xl font-bold">{stats.totalCompletions}</div>
              <p className="text-xs text-muted-foreground">Levels Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Star className="w-8 h-8 text-yellow-500 mb-2" />
              <div className="text-2xl font-bold">{stats.totalStars}</div>
              <p className="text-xs text-muted-foreground">Stars Earned</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Main Content Area */}
          <div className="space-y-6">

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Level Categories Donut Chart */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <PieChart className="w-5 h-5" /> Level Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={levelStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {levelStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Pre/Post Test Comparison Bar Chart */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" /> Test Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={testStats}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="pre_test" fill="#8884d8" name="Pre-Test" />
                        <Bar dataKey="post_test" fill="#82ca9d" name="Post-Test" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Skill Distribution (Optional / Extra) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">User Skill Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={userStats.skillDistribution}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ffc658" name="Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashBoard;
