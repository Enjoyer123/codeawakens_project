import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Map, Award, Sword, Bell, BarChart3, PieChart } from 'lucide-react';

const AdminDashBoard = () => {
  const navigate = useNavigate();

  // ข้อมูลตัวอย่างสำหรับกราฟ
  const donutData = [
    { name: 'Category 1', value: 400, color: '#3b82f6' },
    { name: 'Category 2', value: 300, color: '#10b981' },
    { name: 'Category 3', value: 200, color: '#8b5cf6' },
    { name: 'Category 4', value: 150, color: '#ec4899' },
    { name: 'Category 5', value: 100, color: '#f59e0b' },
  ];

  const barData = [
    { name: 'Figma', '2020': 120, '2021': 150, '2022': 180 },
    { name: 'Sketch', '2020': 100, '2021': 130, '2022': 160 },
    { name: 'XD', '2020': 80, '2021': 110, '2022': 140 },
    { name: 'PS', '2020': 90, '2021': 100, '2022': 120 },
    { name: 'AI', '2020': 70, '2021': 90, '2022': 110 },
  ];

  const totalValue = donutData.reduce((sum, item) => sum + item.value, 0);

  // คำนวณมุมสำหรับ Donut Chart
  const calculateDonutPath = (data, index) => {
    let currentAngle = 0;
    for (let i = 0; i < index; i++) {
      currentAngle += (data[i].value / totalValue) * 360;
    }
    const angle = (data[index].value / totalValue) * 360;
    const startAngle = (currentAngle - 90) * (Math.PI / 180);
    const endAngle = ((currentAngle + angle - 90) * Math.PI) / 180;
    
    const radius = 80;
    const innerRadius = 50;
    const centerX = 120;
    const centerY = 120;
    
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    const x3 = centerX + innerRadius * Math.cos(endAngle);
    const y3 = centerY + innerRadius * Math.sin(endAngle);
    const x4 = centerX + innerRadius * Math.cos(startAngle);
    const y4 = centerY + innerRadius * Math.sin(startAngle);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  const maxBarValue = Math.max(...barData.flatMap(d => [d['2020'], d['2021'], d['2022']]));

  const adminNavItems = [
    {
      label: 'USER MANAGEMENT',
      path: '/admin/users',
      icon: Users,
    },
    {
      label: 'LEVEL MANAGEMENT',
      path: '/admin/levels',
      icon: Map,
    },
    {
      label: 'WEAPONS MANAGEMENT',
      path: '/admin/weapons',
      icon: Sword,
    },
    {
      label: 'REWARD MANAGEMENT',
      path: '/admin/rewards',
      icon: Award,
    },
    {
      label: 'NOTIFICATION MANAGEMENT',
      path: '/admin/notifications',
      icon: Bell,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ซ้าย: กราฟและข้อมูล */}
          <div className="lg:col-span-2 space-y-6">
            {/* DASHBOARD - กราฟ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">DASHBOARD</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Donut Chart */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-64 h-64">
                      <svg width="240" height="240" viewBox="0 0 240 240">
                        {donutData.map((item, index) => (
                          <path
                            key={index}
                            d={calculateDonutPath(donutData, index)}
                            fill={item.color}
                            stroke="white"
                            strokeWidth="2"
                            transform="rotate(-90 120 120)"
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                          <div className="text-3xl font-bold">{totalValue.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500"></div>
                        <span className="text-sm">2020</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500"></div>
                        <span className="text-sm">2021</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-cyan-400"></div>
                        <span className="text-sm">2022</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {barData.map((item, index) => (
                        <div key={index} className="space-y-1">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 flex gap-1 h-6">
                              <div
                                className="bg-blue-500"
                                style={{ width: `${(item['2020'] / maxBarValue) * 100}%` }}
                              ></div>
                              <div
                                className="bg-red-500"
                                style={{ width: `${(item['2021'] / maxBarValue) * 100}%` }}
                              ></div>
                              <div
                                className="bg-cyan-400"
                                style={{ width: `${(item['2022'] / maxBarValue) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* INFORMATION - กล่องข้อมูล */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">INFORMATION</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6 min-h-[150px] flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">ข้อมูลสถิติ</p>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6 min-h-[150px] flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">ข้อมูลกราฟ</p>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6 min-h-[150px] flex items-center justify-center">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">ข้อมูลผู้ใช้</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ขวา: Admin Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-600">ADMIN NAVIGATION</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adminNavItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto py-4 px-4 text-left hover:bg-gray-50"
                        onClick={() => navigate(item.path)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                      </Button>
                    );
                  })}
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
