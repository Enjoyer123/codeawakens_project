
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getUserDetails } from '../../../services/adminService';
import { getUserByClerkId } from '../../../services/profileService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileTab from './tabs/ProfileTab';
import QuestLogTab from './tabs/QuestLogTab';
import InventoryTab from './tabs/InventoryTab';

const UserDetailsContent = ({ userId, allowEdit = false, onUpdateSuccess, initialTabValue = 'profile', useProfileService = false }) => {
  const { getToken } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(initialTabValue);
  const [selectedReward, setSelectedReward] = useState(null);

  useEffect(() => {
    if (userId || useProfileService) {
      loadUserDetails();
    }
  }, [userId, useProfileService]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      let details;
      
      // Use profileService for own profile, adminService for viewing other users
      if (useProfileService) {
        details = await getUserByClerkId(getToken);
      } else {
        details = await getUserDetails(getToken, userId);
      }
      
      setUserDetails(details);
      
      // Set first reward as default selected of Quick Inventory
      if (details.user_reward && details.user_reward.length > 0) {
        setSelectedReward(details.user_reward[0]);
      }
    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="p-6">
        <p>ไม่พบข้อมูล</p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 rounded-lg shadow-md p-6" style={{ backgroundImage: "url('/background.png')", backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }}>

    <Tabs value={tabValue} onValueChange={setTabValue} className="flex flex-col h-full" >
      <TabsList className="flex w-full border-b border-slate-200 mb-6 bg-transparent p-0 h-auto gap-6 transition-all" style={{ backgroundImage: "url('/inventory.png')", backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
        <TabsTrigger 
          value="profile" 
          className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-none data-[state=active]:text-slate-900 data-[state=active]:bg-transparent text-slate-500 font-medium uppercase py-3 px-0 tracking-wide transition-all rounded-none hover:text-slate-700"
        >
          Status
        </TabsTrigger>
        <TabsTrigger 
          value="maps" 
          className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-none data-[state=active]:text-slate-900 data-[state=active]:bg-transparent text-slate-500 font-medium uppercase py-3 px-0 tracking-wide transition-all rounded-none hover:text-slate-700"
        >
          Quest Log
        </TabsTrigger>
        <TabsTrigger 
          value="rewards" 
          className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-none data-[state=active]:text-slate-900 data-[state=active]:bg-transparent text-slate-500 font-medium uppercase py-3 px-0 tracking-wide transition-all rounded-none hover:text-slate-700"
        >
          Inventory
        </TabsTrigger>
      </TabsList>

      <div className="rounded-xl p-0 min-h-[500px] relative text-slate-800">
        <TabsContent value="profile" className="mt-0 p-12">
            <ProfileTab 
                userDetails={userDetails}
                setUserDetails={setUserDetails}
                allowEdit={allowEdit}
                onUpdateSuccess={onUpdateSuccess}
                getToken={getToken}
                selectedReward={selectedReward}
                setSelectedReward={setSelectedReward}
            />
        </TabsContent>

        <TabsContent value="maps" className="mt-0 p-12">
            <QuestLogTab userDetails={userDetails} />
        </TabsContent>

        <TabsContent value="rewards" className="mt-0 p-12">
            <InventoryTab 
                userDetails={userDetails} 
                setSelectedReward={setSelectedReward}
                setTabValue={setTabValue}
            />
        </TabsContent>
      </div>
    </Tabs>
    </div>
  );
};

export default UserDetailsContent;
