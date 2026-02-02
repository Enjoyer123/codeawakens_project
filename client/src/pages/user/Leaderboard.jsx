import React from 'react';
import { useLeaderboard } from '../../services/hooks/useLeaderboard';
import PageLoader from '../../components/shared/Loading/PageLoader';
import { getImageUrl } from '@/utils/imageUtils';
import PageError from '../../components/shared/Error/PageError';

const Leaderboard = () => {
    const { data: leaderboard, isLoading, isError, error } = useLeaderboard();

    if (isLoading) {
        return <PageLoader message="Loading Rankings..." />;
    }

    if (isError) {
        return <PageError message={error?.message} title="Failed to load leaderboard" />;
    }

    return (
        <div className="min-h-screen bg-[#120a1f] p-6 pt-24 text-white font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-black text-[#deb73e] uppercase tracking-wider mb-2 drop-shadow-lg">
                        Leaderboard
                    </h1>
                    <p className="text-gray-400 text-lg">Top Commanders</p>
                </div>

                <div className="bg-[#1e1430] border-2 border-[#a855f7] rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#a855f7]/20 text-[#c084fc] border-b border-[#a855f7]/50">
                                    <th className="p-4 text-center w-20 font-bold tracking-wider">Rank</th>
                                    <th className="p-4 font-bold tracking-wider">Player</th>
                                    <th className="p-4 text-right font-bold tracking-wider">Total Stars</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((player, index) => {
                                    const rank = index + 1;
                                    let rankColor = "text-gray-300";
                                    let rowBg = "hover:bg-[#a855f7]/10 transition-colors";

                                    if (rank === 1) {
                                        rankColor = "text-[#ffd700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]";
                                        rowBg = "bg-[#ffd700]/10 hover:bg-[#ffd700]/20 transition-colors";
                                    } else if (rank === 2) {
                                        rankColor = "text-[#c0c0c0]";
                                        rowBg = "bg-[#c0c0c0]/5 hover:bg-[#c0c0c0]/15 transition-colors";
                                    } else if (rank === 3) {
                                        rankColor = "text-[#cd7f32]";
                                        rowBg = "bg-[#cd7f32]/5 hover:bg-[#cd7f32]/15 transition-colors";
                                    }

                                    return (
                                        <tr key={player.user_id} className={`border-b border-[#a855f7]/20 last:border-0 ${rowBg}`}>
                                            <td className="p-4 text-center">
                                                <span className={`text-2xl font-black ${rankColor}`}>#{rank}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${rank <= 3 ? 'border-white' : 'border-[#a855f7]/50'}`}>
                                                        {player.profile_image ? (
                                                            <img
                                                                src={getImageUrl(player.profile_image)}
                                                                alt={player.username}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-[#2d1b4e] flex items-center justify-center text-[#a855f7] font-bold text-xl">
                                                                {player.username?.[0]?.toUpperCase() || 'U'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className={`font-bold text-lg ${rank === 1 ? 'text-[#ffd700]' : 'text-white'}`}>
                                                            {player.displayName}
                                                        </div>
                                                        <div className="text-xs text-gray-500">@{player.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="inline-flex items-center gap-2 bg-[#120a1f] px-3 py-1 rounded-full border border-[#deb73e]/30">
                                                    <span className="text-xl">⭐</span>
                                                    <span className="text-xl font-black text-[#deb73e]">{player.total_stars}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {leaderboard.length === 0 && (
                            <div className="p-10 text-center text-gray-500">
                                No records found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
