import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Map, BarChart3, PieChart } from "lucide-react";
import Chart from "react-apexcharts";

import {
  useDashboardStats,
  useLevelStats,
  useUserStats,
  useTestStats,
} from "../../../services/hooks/useDashboard";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];


const AdminDashBoard = () => {
  // TanStack Query Hooks
  const { data: statsData, isLoading: loadingOverview } = useDashboardStats();
  const { data: levelsData, isLoading: loadingLevels } = useLevelStats();
  const { data: usersData, isLoading: loadingUsers } = useUserStats();
  const { data: testsData, isLoading: loadingTests } = useTestStats();

  const loading =
    loadingOverview || loadingLevels || loadingUsers || loadingTests;

  // Defaults
  const stats = statsData || {
    totalUsers: 0,
    totalLevels: 0,
  };

  const levelStats = levelsData || [];
  const userStats = usersData || { skillDistribution: [] };
  const testStats = testsData || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <PieChart className="w-5 h-5" /> Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <Chart
                      type="donut"
                      height={250}
                      options={{
                        labels: levelStats.map((s) => s.name || s.category || "Unknown"),
                        colors: COLORS,
                        dataLabels: { enabled: false },
                        legend: { position: "bottom" },
                      }}
                      series={levelStats.map((s) => s.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pre/Post Test Comparison Area Chart */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" /> Test Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <Chart
                      type="bar"
                      height={250}
                      options={{
                        chart: { toolbar: { show: false } },
                        colors: ["#000080", "#00C49F"], // สีกรมท่า (Navy Blue) ที่ทดสอบรอบที่แล้ว!
                        plotOptions: { bar: { distributed: true } }, //
                        xaxis: { categories: testStats.map((d) => d.name) },
                        dataLabels: { enabled: false },
                        stroke: { curve: "smooth", width: 2 },
                      }}
                      series={[
                        {
                          name: "Score",
                          data: testStats.map((d) => d.uv),
                        },
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Skill Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  User Skill Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <Chart
                    type="bar"
                    height={200}
                    options={{
                      chart: { toolbar: { show: false } },
                      colors: ["#ffc658"],
                      plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                      xaxis: {
                        categories: userStats.skillDistribution?.map(
                          (s) => s.name
                        ) || [],
                      },
                      dataLabels: { enabled: false },
                    }}
                    series={[
                      {
                        name: "Users",
                        data: userStats.skillDistribution?.map((s) => s.value) || [],
                      },
                    ]}
                  />
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
