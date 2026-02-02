import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";

const QuestLogTab = ({ userDetails, onHover }) => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col p-2">
      <h3 className="text-center font-bold text-black mb-2 uppercase tracking-widest text-sm">Adventure Log</h3>
      {userDetails.user_progress.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm italic">
          No adventures yet.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto profile-custom-scrollbar space-y-2 px-2 pb-2">
          {userDetails.user_progress.map((progress) => (

            <div
              key={progress.progress_id}
              onClick={() => navigate(`/user/mapselection/${progress.level_id}`)}
              className="p-4 rounded cursor-pointer relative group hover:scale-[1.02] active:scale-95 transition-transform"
              style={{
                backgroundImage: "url('/profile-lisst.png')",
                backgroundSize: '100% 100%',
                imageRendering: 'pixelated'
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-[#5C4033] text-sm">
                  Level {progress.level_id}
                </div>
                <div className="flex items-center justify-center">
                  <img
                    src={progress.status === 'completed' ? `/star${progress.stars_earned || 0}.png` : '/star0.png'}
                    alt={`${progress.stars_earned || 0} Stars`}
                    className="h-6 object-contain drop-shadow-sm"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              </div>
            </div>


          ))}
        </div>
      )}
    </div>
  );
};

export default QuestLogTab;
