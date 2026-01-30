import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfileTab } from './hooks/useProfileTab';
import { API_BASE_URL } from '../../../../config/apiConfig';

const ProfileTab = ({
    userDetails,
    setUserDetails,
    allowEdit,
    onUpdateSuccess,
    getToken
}) => {
    const {
        isEditing,
        usernameInput,
        setUsernameInput,
        usernameError,
        usernameSuccess,
        savingUsername,
        uploadingImage,
        imageError,
        imageSuccess,
        fileInputRef,
        toggleEditMode,
        handleUsernameUpdate,
        handleImageUpload,
        handleDeleteImage
    } = useProfileTab({ userDetails, setUserDetails, getToken, onUpdateSuccess });

    return (
        <div className="h-full flex flex-col items-center gap-4 py-2 relative">
            {/* Edit Trigger - Float top right */}
            {allowEdit && (
                <div className="absolute top-0 right-0 z-10">
                    {!isEditing ? (
                        <Button onClick={toggleEditMode} variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white/50 hover:bg-white text-slate-600">
                            <span>✏️</span>
                        </Button>
                    ) : (
                        <Button onClick={toggleEditMode} variant="ghost" size="xs" className="text-red-500 hover:text-red-600 bg-white/80 text-[10px]">
                            Cancel
                        </Button>
                    )}
                </div>
            )}

            {/* Profile Picture */}
            <div className="relative group">
                <div className={`relative w-40 h-40 bg-slate-100 rounded-xl overflow-hidden shadow-md border-4 border-[#F5DEB3] ${isEditing ? 'ring-4 ring-blue-200' : ''}`}>
                    {userDetails.user.profile_image || userDetails.user.profileImageUrl ? (
                        <img
                            src={
                                (userDetails.user.profile_image || userDetails.user.profileImageUrl).startsWith('http')
                                    ? (userDetails.user.profile_image || userDetails.user.profileImageUrl)
                                    : `${API_BASE_URL}${userDetails.user.profile_image || userDetails.user.profileImageUrl}`
                            }
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                            <span className="text-slate-400 text-5xl font-bold">
                                {userDetails.user.username?.[0] || userDetails.user.email?.[0] || 'U'}
                            </span>
                        </div>
                    )}
                </div>

                {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/50 backdrop-blur-sm rounded-xl">
                        <span className="text-slate-800 font-bold text-xs animate-pulse">Summoning...</span>
                    </div>
                )}


                {/* Upload Controls */}
                {allowEdit && isEditing && (
                    <div className="relative mt-2 w-full flex flex-col gap-1 bg-white p-2 rounded shadow-lg">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full text-[10px] h-6"
                            disabled={uploadingImage}
                            size="sm"
                            variant="outline"
                        >
                            Change
                        </Button>
                        {(userDetails.user.profile_image || userDetails.user.profileImageUrl) &&
                            !(userDetails.user.profile_image || userDetails.user.profileImageUrl).includes('clerk') && (
                                <Button
                                    onClick={handleDeleteImage}
                                    variant="ghost"
                                    className="w-full text-red-500 text-[10px] h-6"
                                    disabled={uploadingImage}
                                    size="sm"
                                >
                                    Remove
                                </Button>
                            )}
                        {imageError && <p className="text-[10px] text-red-500 leading-tight">{imageError}</p>}
                    </div>
                )}

            </div>

            {/* Name and Stats */}
            <div className="text-center w-full">
                {!isEditing ? (
                    <h3 className="text-xl font-black text-[#5C4033] uppercase tracking-tight truncate px-2">
                        {userDetails.user.first_name && userDetails.user.last_name
                            ? `${userDetails.user.first_name} ${userDetails.user.last_name}`
                            : userDetails.user.username || userDetails.user.email}
                    </h3>
                ) : (
                    <form onSubmit={handleUsernameUpdate} className="flex flex-col items-center gap-1">
                        <Input
                            type="text"
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            placeholder="Name"
                            className="h-8 text-center bg-white/80"
                        />
                        <Button type="submit" size="sm" className="h-6 text-xs w-full">Save</Button>
                    </form>
                )}

                <div className="flex flex-col justify-center gap-4 mt-4">
                    <div className="flex flex-col items-center">
                        <div className="text-2xl drop-shadow-sm">⭐</div>
                        <span className="font-bold text-[#5C4033]">
                            {userDetails.user_progress?.reduce((sum, p) => sum + (p.stars_earned || 0), 0) || 0}
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <p>Pre-Test Score: {userDetails.user.pre_score}</p>
                        <p>Post-Test Score: {userDetails.user.post_score}</p>
                        <p>Skill Level: {userDetails.user.skill_level}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileTab;

