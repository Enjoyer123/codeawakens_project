
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

import { useUserDetails } from '../../../services/hooks/useAdmin';
import { useProfile } from '../../../services/hooks/useProfile';
import ProfileTab from './tabs/ProfileTab';
import QuestLogTab from './tabs/QuestLogTab';
import InventoryTab from './tabs/InventoryTab';
import { Loader } from '@/components/ui/loader';

import { API_BASE_URL } from '../../../config/apiConfig';

const UserDetailsContent = ({ userId, allowEdit = false, onUpdateSuccess, initialTabValue = 'profile', useProfileService = false }) => {
  const { getToken } = useAuth();
  const [hoveredContent, setHoveredContent] = useState(null);

  // Use hooks conditionally based on useProfileService prop
  const currentUserId = userId; // User ID is passed for admin view

  // Hook for User Profile (Current User)
  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError
  } = useProfile({
    enabled: useProfileService
  });

  // Hook for Admin View (Other User)
  // We need to pass options to useUserDetails to control 'enabled', but my hook doesn't accept options.
  // I should update useUserDetails hook to accept options OR just handle it here if I modify the hook.
  // But wait, useQuery hook returns 'refetch', but I need 'enabled'.
  // My hook wrapper `useUserDetails` hardcodes `enabled: !!userId && !!getToken`.
  // If I use `useUserDetails` here, it will trigger if `userId` is present.
  // We only want it if `!useProfileService`.
  // So I need to modify `useUserDetails` or use a conditional standard query here.
  // Best practice: Update `useUserDetails` to accept options.
  // BUT I can't update hook file in this turn easily without another tool call.
  // LIMITATION: 'useUserDetails' forces enabled.
  // Workaround: Pass userId as null if useProfileService is true.

  const adminQueryUserId = !useProfileService ? userId : null;
  const {
    data: adminDetailsData,
    isLoading: adminLoading,
    isError: adminError
  } = useUserDetails(adminQueryUserId); // If null, hook sets enabled: false

  const userDetails = useProfileService ? profileData : adminDetailsData;
  const loading = useProfileService ? profileLoading : adminLoading;

  // Effect to set initial hovered content
  useEffect(() => {
    if (userDetails) {
      if (userDetails.user_reward && userDetails.user_reward.length > 0) {
        setHoveredContent({ type: 'reward', data: userDetails.user_reward[0] });
      } else if (userDetails.user_progress && userDetails.user_progress.length > 0) {
        setHoveredContent({ type: 'level', data: userDetails.user_progress[0] });
      }
    }
  }, [userDetails]);

  if (loading) {
    return (
      <div className="w-full min-h-[600px] flex flex-col items-center justify-center">
        <Loader size="lg" className="mb-4 text-primary" />
        <p className="text-gray-500 font-medium">Loading details...</p>
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
    <div
      className="relative w-full min-h-[600px] p-[6%] flex flex-col"
      style={{
        backgroundImage: "url('/profile.png')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated'
      }}
    >


      {/* Main 3-Column Layout */}
      <div className="flex flex-col flex-row gap-4 h-[500px]">

        {/* Left Panel: History/Levels */}
        <div
          className="flex-1 min-w-[200px] h-full p-2 relative"
          style={{
            backgroundImage: "url('/paper-brown.png')",
            backgroundSize: '100% 100%',
            imageRendering: 'pixelated'
          }}
        >
          <QuestLogTab userDetails={userDetails} onHover={setHoveredContent} />
        </div>

        {/* Middle Panel: Profile */}
        <div className="flex-[0.8] min-w-[250px] h-full shadow-2xl flex flex-col items-center justify-center relative">
          {/* Door/Panel Effect */}
          <div
            className="w-full h-full p-2 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]"
            style={{
              backgroundImage: "url('/paper-brown.png')",
              backgroundSize: '100% 100%',
              imageRendering: 'pixelated'
            }}
          >
            <ProfileTab
              userDetails={userDetails}
              allowEdit={allowEdit}
              onUpdateSuccess={onUpdateSuccess}
              getToken={getToken}
            />
          </div>
        </div>

        {/* Right Panel: Inventory & Details */}
        <div
          className="flex-1 min-w-[200px] h-full p-2 shadow-inner relative flex flex-col gap-2"
          style={{
            backgroundImage: "url('/paper-brown.png')",
            backgroundSize: '100% 100%',
            imageRendering: 'pixelated'
          }}
        >
          <div className="flex-[0.6] overflow-hidden">
            <InventoryTab
              userDetails={userDetails}
              onHover={setHoveredContent}
            />
          </div>

          {/* Minimal Detail View in Right Column */}
          <div className="flex-[0.4] rounded-lg p-2 flex flex-col">
            {!hoveredContent ? (
              <div className="flex-1 flex items-center justify-center text-xs text-[#8B4513]/50 italic text-center px-4">
                Hover item to view
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-start animate-in fade-in duration-200 w-full pt-2">

                {/* 1. Image (Larger & Proportional) */}
                <div
                  className="w-24 h-24 p-2 flex items-center justify-center shrink-0 relative"
                >
                  {(() => {
                    // Safety check: ensure we have reward data
                    const item = hoveredContent.data.reward || hoveredContent.data;
                    const imgUrl = item.frame5 || item.frame1;
                    return imgUrl ? (
                      <img
                        src={imgUrl.startsWith('http') ? imgUrl : `${API_BASE_URL}${imgUrl}`}
                        alt={item.reward_name || 'Item'}
                        className="w-full h-full object-contain"
                      />
                    ) : <span className="text-3xl"></span>
                  })()}
                </div>

                {/* 2. Name */}
                <h4 className="font-bold text-black text-xl uppercase text-center leading-tight px-1">
                  {hoveredContent.data.reward ? hoveredContent.data.reward.reward_name : (hoveredContent.data.reward_name || "")}
                </h4>

                {/* 3. Description */}
                <div className="text-[20px] text-white leading-relaxed text-center opacity-80 px-2 w-full break-words">
                  {hoveredContent.data.reward ? hoveredContent.data.reward.description : (hoveredContent.data.description || "No description.")}
                </div>
              </div>


            )}
          </div>
        </div>
      </div>

    </div>
  );
};



export default UserDetailsContent;
