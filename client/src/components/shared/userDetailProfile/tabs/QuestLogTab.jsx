
import { cn } from "@/lib/utils";

const QuestLogTab = ({ userDetails }) => {
  return (
    <div className="space-y-4">
      {userDetails.user_progress.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-xl font-bold">NO QUESTS FOUND</p>
          <p>Go forth and adventure!</p>
        </div>
      ) : (
        <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {userDetails.user_progress.map((progress) => (
            <div
              key={progress.progress_id}
              className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row gap-4 justify-between items-center hover:border-slate-300 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl border-2",
                    progress.status === "completed"
                      ? "bg-green-50 border-green-500 text-green-600"
                      : "bg-slate-50 border-slate-300 text-slate-400"
                  )}
                >
                  {progress.status === "completed" ? "✓" : "!"}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">
                    Level ID: {progress.level_id}
                  </h4>
                  <p className="text-xs text-slate-500 uppercase">
                    {progress.status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Stars
                  </p>
                  <p className="font-bold text-yellow-500">
                    {progress.stars_earned} ⭐
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Score
                  </p>
                  <p className="font-bold text-blue-500">
                    {progress.best_score}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Tries
                  </p>
                  <p className="font-bold text-slate-600">
                    {progress.attempts_count}
                  </p>
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
