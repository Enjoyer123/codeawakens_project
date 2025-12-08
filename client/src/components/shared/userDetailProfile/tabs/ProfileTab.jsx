
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { updateUsername, uploadProfileImage, deleteProfileImage } from '../../../../services/profileService';

const ProfileTab = ({ 
    userDetails, 
    setUserDetails, 
    allowEdit, 
    onUpdateSuccess, 
    getToken,
    selectedReward,
    setSelectedReward
}) => {
  // Edit state (Managed locally in ProfileTab to simplify parent)
  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState(userDetails.user.username || '');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageSuccess, setImageSuccess] = useState('');
  const fileInputRef = useRef(null);

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    // Reset inputs on cancel
    if (isEditing) {
      setUsernameInput(userDetails.user.username || '');
      setUsernameError('');
      setImageError('');
    }
  };

  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');

    if (!usernameInput || usernameInput.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    try {
      setSavingUsername(true);
      const response = await updateUsername(getToken, usernameInput.trim());
      setUserDetails((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          username: response.user.username,
        },
      }));
      setUsernameSuccess('Username updated successfully');
      setTimeout(() => setUsernameSuccess(''), 3000);
      setIsEditing(false); // Exit edit mode on success
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      setUsernameError(error.message || 'Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size must be less than 5MB');
      return;
    }

    setImageError('');
    setImageSuccess('');
    setUploadingImage(true);

    try {
      const response = await uploadProfileImage(getToken, file);
      setUserDetails((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          profileImageUrl: response.profileImageUrl,
          profile_image: response.profileImageUrl,
        },
      }));
      setImageSuccess('Profile image updated successfully');
      setTimeout(() => setImageSuccess(''), 3000);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      setImageError(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm('Are you sure you want to delete your profile image?')) {
      return;
    }

    setImageError('');
    setImageSuccess('');
    setUploadingImage(true);

    try {
      const response = await deleteProfileImage(getToken);
      setUserDetails((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          profileImageUrl: response.profileImageUrl,
          profile_image: response.profileImageUrl,
        },
      }));
      setImageSuccess('Profile image deleted successfully');
      setTimeout(() => setImageSuccess(''), 3000);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      setImageError(error.message || 'Failed to delete image');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="mt-0 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-6">
      {allowEdit && (
        <div className="flex justify-end">
           {!isEditing ? (
             <Button onClick={toggleEditMode} variant="outline" size="sm" className="gap-2">
               <span>✏️</span> Edit Profile
             </Button>
           ) : (
             <Button onClick={toggleEditMode} variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
               Cancel Editing
             </Button>
           )}
        </div>
      )}

      {/* Top Row: Profile Info & Inventory */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Panel - Character Visuals & Stats (merged) */}
        <div className="flex-1 flex flex-col md:flex-row gap-6">
            {/* Profile Picture Frame */}
            <div className="relative group mx-auto md:mx-0 w-fit shrink-0">
                <div className={`relative w-48 h-48 bg-slate-100 rounded-xl overflow-hidden shadow-sm transition-all ${isEditing ? 'ring-4 ring-blue-100' : ''}`}>
                {userDetails.user.profile_image || userDetails.user.profileImageUrl ? (
                    <img
                    src={
                        (userDetails.user.profile_image || userDetails.user.profileImageUrl).startsWith('http')
                        ? (userDetails.user.profile_image || userDetails.user.profileImageUrl)
                        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}${userDetails.user.profile_image || userDetails.user.profileImageUrl}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <span className="text-slate-400 text-5xl font-light">
                        {userDetails.user.username?.[0] || userDetails.user.email?.[0] || 'U'}
                    </span>
                    </div>
                )}
                </div>

                {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/50 backdrop-blur-sm rounded-xl">
                    <span className="text-slate-800 font-medium animate-pulse">Summoning...</span>
                </div>
                )}

                {/* Upload Controls - Only Visible in Edit Mode */}
                {allowEdit && isEditing && (
                <div className="mt-3 space-y-2 w-48 animate-in slide-in-from-top-2 fade-in duration-300">
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
                    className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs h-8"
                    disabled={uploadingImage}
                    size="sm"
                    variant="outline"
                    >
                    {uploadingImage ? 'Uploading...' : 'Change Avatar'}
                    </Button>

                    {(userDetails.user.profile_image || userDetails.user.profileImageUrl) && 
                    !(userDetails.user.profile_image || userDetails.user.profileImageUrl).includes('clerk') && (
                    <Button
                        onClick={handleDeleteImage}
                        variant="ghost"
                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-8"
                        disabled={uploadingImage}
                        size="sm"
                    >
                        Remove Avatar
                    </Button>
                    )}

                    {imageError && (
                    <p className="text-xs text-red-500 text-center">{imageError}</p>
                    )}
                    {imageSuccess && (
                    <p className="text-xs text-green-500 text-center">{imageSuccess}</p>
                    )}
                </div>
                )}
            </div>

            {/* Character Details & Stats */}
            <div className="flex-1 flex flex-col justify-start pt-2 gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
                    {userDetails.user.first_name && userDetails.user.last_name
                        ? `${userDetails.user.first_name} ${userDetails.user.last_name}`
                        : userDetails.user.username || userDetails.user.email}
                    </h3>
                    
                    {/* Edit Username */}
                    {allowEdit && (
                    <div className="mt-2">
                        {isEditing ? (
                        <form onSubmit={handleUsernameUpdate} className="space-y-2 animate-in fade-in duration-300 max-w-xs">
                            <div className="flex gap-2">
                            <Input
                                type="text"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                placeholder="New Alias"
                                className="bg-white border-slate-200 text-slate-800 focus:ring-slate-400 h-8 text-sm"
                                disabled={savingUsername}
                            />
                            <Button
                                type="submit"
                                disabled={savingUsername}
                                size="sm"
                                className="h-8 px-3 bg-slate-800 text-white hover:bg-slate-700"
                            >
                                {savingUsername ? '...' : 'Save'}
                            </Button>
                            </div>
                            {usernameError && (
                            <p className="text-xs text-red-500">{usernameError}</p>
                            )}
                            {usernameSuccess && (
                            <p className="text-xs text-green-500">{usernameSuccess}</p>
                            )}
                        </form>
                        ) : null}
                    </div>
                    )}
                </div>

                {/* Stats List */}
                <div className="space-y-3 mt-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded text-yellow-400 text-lg shadow-sm">
                            ⭐
                        </div>
                        <span className="font-bold text-lg text-slate-700">
                             {userDetails.user_progress?.reduce((sum, p) => sum + (p.stars_earned || 0), 0) || 0}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded text-blue-400 text-lg shadow-sm">
                             🏆
                        </div>
                        <span className="font-bold text-lg text-slate-700 uppercase">
                             PASSED {userDetails.user_progress?.filter(p => p.status === 'completed').length || 0}
                        </span>
                    </div>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded text-purple-400 text-lg shadow-sm">
                             Rank
                        </div>
                         <span className="font-bold text-lg text-slate-700 uppercase">
                             #{Math.floor(Math.random() * 1000) + 1}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Panel - Inventory Grid */}
        <div className="flex-1 lg:max-w-[45%]">
             <div className="bg-slate-100/50 p-4 rounded-xl">
                 <div className="grid grid-cols-4 gap-2">
                    {userDetails.user_reward && userDetails.user_reward.slice(0, 12).map((reward, i) => {
                        const item = reward.reward;
                        const itemImage = item.frame5 || item.frame1;
                        const imageUrl = itemImage ? (
                        itemImage.startsWith('http') ? itemImage : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}${itemImage}`
                        ) : null;

                        return (
                        <div
                            key={i}
                            className="aspect-square flex items-center justify-center cursor-help transition-transform hover:scale-105 relative bg-center bg-contain bg-no-repeat bg-slate-200 rounded-sm"
                            style={{ backgroundImage: "url('/grid-item.png')" }}
                            title={item.reward_name}
                            onMouseEnter={() => setSelectedReward(reward)}
                        >
                            {imageUrl ? (
                            <img src={imageUrl} alt={item.reward_name} className="w-4/5 h-4/5 object-contain drop-shadow-md" />
                            ) : item.reward_type === 'sword' || item.reward_type === 'weapon' ? (
                            <span className="text-xl drop-shadow-md">⚔️</span>
                            ) : (
                            <span className="text-[10px] text-center font-bold text-slate-300 drop-shadow-md px-1 truncate">
                                {item.reward_name}
                            </span>
                            )}
                        </div>
                        );
                    })}
                    {/* Empty Slots Filler (Total 12 slots for 3x4 grid look) */}
                    {[...Array(Math.max(0, 12 - (userDetails.user_reward?.length || 0)))].map((_, i) => (
                        <div
                        key={`empty-${i}`}
                        className="aspect-square opacity-30 bg-center bg-contain bg-no-repeat grayscale bg-slate-200 rounded-sm"
                        style={{ backgroundImage: "url('/grid-item.png')" }}
                        ></div>
                    ))}
                </div>
             </div>
        </div>
      </div>

      {/* Bottom Row: Detailed Item View */}
      <div 
        className="w-full min-h-[140px] rounded-lg bg-center bg-no-repeat p-6 relative flex items-center"
        style={{ backgroundImage: "url('/desrciption.png')", backgroundSize: '100% 100%' }}
      >
        {selectedReward?.reward ? (
            (() => {
            const item = selectedReward.reward;
            const itemImage = item.frame5 || item.frame1;
            const imageUrl = itemImage ? (
                itemImage.startsWith('http') ? itemImage : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}${itemImage}`
            ) : null;

            return (
                <div className="flex gap-6 items-center px-4 w-full h-full">
                    {/* Item Image Box */}
                    <div className="w-20 h-20 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                        {imageUrl ? (
                        <img src={imageUrl} alt={item.reward_name} className="w-full h-full object-contain p-2" />
                        ) : (
                        <span className="text-3xl">⚔️</span>
                        )}
                    </div>
                    
                    {/* Text Content */}
                    <div className="flex-1 text-left">
                        <div className="font-bold text-slate-800 text-lg uppercase tracking-wide mb-1">
                            {item.reward_name}
                        </div>
                        <div className="text-slate-600 font-medium text-sm leading-relaxed max-w-2xl">
                             " {item.description || "A mysterious artifact found in the depths."} "
                        </div>
                    </div>
                </div>
            );
            })()
        ) : (
            <div className="w-full text-center text-slate-400 font-medium italic">
                Select an item from your inventory to view details
            </div>
        )}
      </div>
    </div>
  );
};


export default ProfileTab;
