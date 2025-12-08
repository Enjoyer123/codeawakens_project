
const InventoryTab = ({ userDetails, setSelectedReward, setTabValue }) => {
  return (
    <div>
      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 min-h-[400px]">
        {userDetails.user_reward.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <span className="text-4xl mb-4 opacity-50">🎒</span>
            <p>Inventory is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {userDetails.user_reward.map((userReward) => {
               const item = userReward.reward;
               const itemImage = item.frame5 || item.frame1;
               const imageUrl = itemImage ? (
                 itemImage.startsWith('http') ? itemImage : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}${itemImage}`
               ) : null;

               return (
                <div
                    key={userReward.user_reward_id}
                    className="aspect-square bg-white border border-slate-200 rounded-lg p-2 flex flex-col items-center justify-between hover:border-slate-400 hover:shadow-md cursor-pointer transition-all group relative"
                    onClick={() => {
                    setSelectedReward(userReward);
                    setTabValue("profile");
                    }}
                >
                    <div className="flex-1 flex items-center justify-center w-full h-full overflow-hidden">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={item.reward_name} 
                            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" 
                        />
                    ) : item.reward_type === "sword" || item.reward_type === "weapon" ? (
                        <span className="text-4xl drop-shadow-sm text-slate-300">⚔️</span>
                    ) : (
                        <span className="text-xs font-bold text-center text-slate-400 group-hover:text-slate-600 transition-colors">
                        {item.reward_name}
                        </span>
                    )}
                    </div>
                    <div className="w-full text-center mt-1">
                    <span className="text-[10px] text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 uppercase tracking-wide">
                        {item.reward_type}
                    </span>
                    </div>
                </div>
               );
            })}
            {/* Fill with empty slots to look like a grid */}
            {[
              ...Array(Math.max(0, 20 - userDetails.user_reward.length)),
            ].map((_, i) => (
              <div
                key={`empty-inv-${i}`}
                className="aspect-square bg-slate-50 border border-slate-100 rounded-lg"
              ></div>
            ))}
          </div>
        )}
      </div>

      {/* Mini description panel at bottom of inventory too */}
      <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
        <p className="text-xs text-slate-500 text-center font-light">
          Click an item to inspect. Items are automatically equipped where
          applicable.
        </p>
      </div>
    </div>
  );
};

export default InventoryTab;
