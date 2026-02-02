import { Button } from "@/components/ui/button";
import { useProfileTab } from './hooks/useProfileTab';
import { API_BASE_URL } from '../../../../config/apiConfig';
import { Pencil } from 'lucide-react';
import ProfileEditDialog from './ProfileEditDialog'; // Import the new dialog
import { Badge } from "@/components/ui/badge";

const ProfileTab = ({
    userDetails,
    allowEdit,
    onUpdateSuccess,
    getToken
}) => {
    // We pass the whole returned object to the dialog
    const profileData = useProfileTab({ userDetails, getToken, onUpdateSuccess });

    // Destructure what we need for the main view
    const {
        isEditing,
        toggleEditMode,
        uploadingImage,
    } = profileData;

    const totalStars = userDetails.user_progress?.reduce((sum, p) => sum + (p.stars_earned || 0), 0) || 0;
    const userImage = userDetails.user.profile_image || userDetails.user.profileImageUrl;
    const displayName = userDetails.user.first_name && userDetails.user.last_name
        ? `${userDetails.user.first_name} ${userDetails.user.last_name}`
        : userDetails.user.username || userDetails.user.email;

    return (
        <div className="h-full flex flex-col items-center py-2 relative w-full max-w-sm mx-auto justify-center">
            {/* Edit Trigger - Float top right */}
            {allowEdit && (
                <div className="absolute top-0 right-0 z-10">
                    <Button
                        onClick={toggleEditMode}
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full bg-white/60 hover:bg-white text-[#5C4033] hover:text-[#8B4513] shadow-sm backdrop-blur-[2px] transition-all hover:scale-110"
                        title="Edit Profile"
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Profile Picture */}
            <div className="relative group mb-3">
                <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-xl border-white ring-2 ring-[#8B4513]/20">
                    {userImage ? (
                        <img
                            src={userImage.startsWith('http') ? userImage : `${API_BASE_URL}${userImage}`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-black text-4xl font-bold">
                                {String(displayName).charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}

                    {/* Loading Overlay */}
                    {uploadingImage && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-[1px]">
                            <div className="w-full h-full border-t-4 border-white rounded-full animate-spin absolute"></div>
                        </div>
                    )}
                </div>

                {/* Level Badge (Cosmetic) */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#5C4033] text-white px-3 py-0.5 rounded-full shadow-md border border-amber-400 font-bold text-[10px] tracking-widest whitespace-nowrap">
                    PLAYER
                </div>
            </div>

            {/* Content Container */}
            <div className="text-center w-full space-y-3 px-2">
                {/* Name */}
                <div>
                    <h3 className="text-lg font-black text-black uppercase font-sans ">
                        {displayName}
                    </h3>
                    <div className="flex justify-center gap-2 mt-1">
                        <Badge variant="outline" className="border-[#8B4513]/50 text-[#5C4033] bg-white/50 text-[10px] h-5 px-2">
                            ID: {String(userDetails.user.id || userDetails.user.user_id).substring(0, 8)}
                        </Badge>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                    {/* Stars */}
                    <div className="bg-[#e5d6a1] p-2 rounded-lg border border-[#8B4513]/20 flex flex-col items-center gap-0.5 shadow-sm hover:shadow-md transition-all">
                        <span className="text-lg font-bold text-[#5C4033]">{totalStars}</span>
                        <span className="text-[9px] font-bold text-[#8B4513]/70 uppercase tracking-widest">Stars</span>
                    </div>

                    {/* Skill Level */}
                    <div className="bg-[#e5d6a1] p-2 rounded-lg border border-[#8B4513]/20 flex flex-col items-center gap-0.5 shadow-sm hover:shadow-md transition-all">
                        <span className="text-lg font-bold text-[#5C4033]">{userDetails.user.skill_level || '-'}</span>
                        <span className="text-[9px] font-bold text-[#8B4513]/70 uppercase tracking-widest">Global Rank</span>
                    </div>

                    {/* Pre-core */}
                    <div className="bg-[#e5d6a1] p-2 rounded-lg border border-[#8B4513]/20 flex flex-col items-center gap-0.5 shadow-sm hover:shadow-md transition-all">
                        <span className="text-base font-bold text-[#5C4033]">{userDetails.user.pre_score !== null ? userDetails.user.pre_score : 'N/A'}</span>
                        <span className="text-[9px] font-bold text-[#8B4513]/70 uppercase tracking-widest">Pre-Test</span>
                    </div>

                    {/* Post-Score */}
                    <div className="bg-[#e5d6a1] p-2 rounded-lg border border-[#8B4513]/20 flex flex-col items-center gap-0.5 shadow-sm hover:shadow-md transition-all">
                        <span className="text-base font-bold text-[#5C4033]">{userDetails.user.post_score !== null ? userDetails.user.post_score : 'N/A'}</span>
                        <span className="text-[9px] font-bold text-[#8B4513]/70 uppercase tracking-widest">Post-Test</span>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <ProfileEditDialog
                open={isEditing}
                onOpenChange={toggleEditMode}
                profileData={{ ...profileData, userDetails }}
            />
        </div>
    );
};

export default ProfileTab;
