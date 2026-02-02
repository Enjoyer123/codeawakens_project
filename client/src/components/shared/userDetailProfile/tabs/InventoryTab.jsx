

import { API_BASE_URL } from '../../../../config/apiConfig';

const InventoryTab = ({ userDetails, onHover }) => {
  return (
    <div className="h-full flex flex-col p-2">
      <h3 className="text-center font-bold text-black mb-2 uppercase tracking-widest text-sm">inventory</h3>
      <div className="flex-1 p-2 overflow-y-auto profile-custom-scrollbar">
        <div className="grid grid-cols-3 gap-2">
          {userDetails.user_reward.map((userReward) => {
            const item = userReward.reward;
            const itemImage = item.frame5 || item.frame1;
            const imageUrl = itemImage ? (
              itemImage.startsWith('http') ? itemImage : `${API_BASE_URL}${itemImage}`
            ) : null;

            return (
              <div
                key={userReward.user_reward_id}
                className="aspect-square p-1 flex items-center justify-center cursor-help hover:brightness-110 transition-all relative"
                style={{
                  backgroundImage: "url('/cell.png')",
                  backgroundSize: '100% 100%',
                  imageRendering: 'pixelated',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={() => onHover && onHover({ type: 'reward', data: userReward })}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.reward_name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <span className="text-xl font-bold text-center text-white leading-tight">
                    {item.reward_name}
                  </span>
                )}
              </div>
            );
          })}
          {/* Fill with empty slots to look like the image grid */}
          {[
            ...Array(Math.max(0, 9 - userDetails.user_reward.length)),
          ].map((_, i) => (
            <div
              key={`empty-inv-${i}`}
              className="aspect-square rounded-sm"
              style={{
                backgroundImage: "url('/cell.png')",
                backgroundSize: '100% 100%',
                imageRendering: 'pixelated'
              }}
            ></div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default InventoryTab;

