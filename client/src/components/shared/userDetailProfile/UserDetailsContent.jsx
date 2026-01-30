
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

import { getUserDetails } from '../../../services/adminService';
import { getUserByClerkId } from '../../../services/profileService';
import ProfileTab from './tabs/ProfileTab';
import QuestLogTab from './tabs/QuestLogTab';
import InventoryTab from './tabs/InventoryTab';
import PageLoader from '../Loading/PageLoader';
import { API_BASE_URL } from '../../../config/apiConfig';


const UserDetailsContent = ({ userId, allowEdit = false, onUpdateSuccess, initialTabValue = 'profile', useProfileService = false }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hoveredContent, setHoveredContent] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
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

      // Default hover content to first item if available, or just null
      if (details.user_reward && details.user_reward.length > 0) {
        setHoveredContent({ type: 'reward', data: details.user_reward[0] });
      } else if (details.user_progress && details.user_progress.length > 0) {
        setHoveredContent({ type: 'level', data: details.user_progress[0] });
      }

    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLoader message="Loading details..." />
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
              setUserDetails={setUserDetails}
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
              <div className="flex-1 flex flex-col items-center justify-start gap-3 animate-in fade-in duration-200 w-full pt-2">

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
                <h4 className="font-bold text-[#5C4033] text-sm uppercase text-center leading-tight px-1">
                  {hoveredContent.data.reward ? hoveredContent.data.reward.reward_name : (hoveredContent.data.reward_name || "")}
                </h4>

                {/* 3. Description */}
                <div className="text-[10px] text-[#8B4513] leading-relaxed text-center opacity-80 px-2 w-full break-words">
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
