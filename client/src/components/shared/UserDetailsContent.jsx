import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getUserDetails } from '../../services/adminService';
import { updateUsername, uploadProfileImage, deleteProfileImage } from '../../services/profileService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

const UserDetailsContent = ({ userId, allowEdit = false, onUpdateSuccess, initialTabValue = 'profile' }) => {
  const { getToken } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(initialTabValue);
  const [selectedReward, setSelectedReward] = useState(null);
  
  // Edit state
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageSuccess, setImageSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userId) {
      loadUserDetails();
    }
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const details = await getUserDetails(getToken, userId);
      setUserDetails(details);
      setUsernameInput(details.user.username || '');
      // Set first reward as default selected
      if (details.user_reward && details.user_reward.length > 0) {
        setSelectedReward(details.user_reward[0]);
      }
    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-lg">Loading...</div>
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
    <Tabs value={tabValue} onValueChange={setTabValue} className="flex flex-col">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="profile" className="font-bold">PROFILE</TabsTrigger>
        <TabsTrigger value="maps" className="font-bold">MAPP PASS</TabsTrigger>
        <TabsTrigger value="rewards" className="font-bold">BADGE</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-0">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left Panel - Profile Info */}
          <div className="space-y-4">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-full aspect-square max-w-[200px] bg-gray-200 flex items-center justify-center border-2 border-gray-300 rounded-lg overflow-hidden">
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
                  <span className="text-gray-400 text-5xl">
                    {userDetails.user.username?.[0] || userDetails.user.email?.[0] || 'U'}
                  </span>
                )}
              </div>
              
              {uploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">Uploading...</span>
                </div>
              )}

              {/* Image Upload Controls - Only show if allowEdit */}
              {allowEdit && (
                <div className="mt-4 space-y-2">
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
                    className="w-full"
                    disabled={uploadingImage}
                    size="sm"
                  >
                    {uploadingImage ? 'Uploading...' : 'Change Photo'}
                  </Button>
                  
                  {(userDetails.user.profile_image || userDetails.user.profileImageUrl) && 
                   !(userDetails.user.profile_image || userDetails.user.profileImageUrl).includes('clerk') && (
                    <Button
                      onClick={handleDeleteImage}
                      variant="destructive"
                      className="w-full"
                      disabled={uploadingImage}
                      size="sm"
                    >
                      Delete Photo
                    </Button>
                  )}
                  
                  {imageError && (
                    <p className="text-xs text-red-600 text-center">{imageError}</p>
                  )}
                  {imageSuccess && (
                    <p className="text-xs text-green-600 text-center">{imageSuccess}</p>
                  )}
                  <p className="text-xs text-gray-500 text-center">Max size: 5MB</p>
                </div>
              )}
            </div>
            
            {/* Name and Stats */}
            <div className="space-y-3">
              <h3 className="text-gray-900 font-bold text-2xl">
                {userDetails.user.first_name && userDetails.user.last_name
                  ? `${userDetails.user.first_name} ${userDetails.user.last_name}`
                  : userDetails.user.username || userDetails.user.email}
              </h3>
              
              {/* Stats with Star Icons */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-blue-100 px-4 py-3 rounded-lg border border-blue-200">
                  <span className="text-yellow-500 text-2xl">⭐</span>
                  <span className="text-gray-900 font-bold text-lg">
                    {userDetails.user_progress?.reduce((sum, p) => sum + (p.stars_earned || 0), 0) || 0}
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-blue-100 px-4 py-3 rounded-lg border border-blue-200">
                  <span className="text-yellow-500 text-2xl">⭐</span>
                  <span className="text-gray-900 font-bold text-lg">
                    PASSED {userDetails.user_progress?.filter(p => p.status === 'completed').length || 0}
                  </span>
                </div>
              </div>

              {/* Username Edit Section - Only show if allowEdit */}
              {allowEdit && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Update Username</h4>
                  <form onSubmit={handleUsernameUpdate} className="space-y-3">
                    <Input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Enter new username"
                      disabled={savingUsername}
                    />
                    {usernameError && (
                      <p className="text-sm text-red-600">{usernameError}</p>
                    )}
                    {usernameSuccess && (
                      <p className="text-sm text-green-600">{usernameSuccess}</p>
                    )}
                    <Button
                      type="submit"
                      disabled={savingUsername}
                      className="w-full"
                      size="sm"
                    >
                      {savingUsername ? 'Saving...' : 'Save Username'}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Badges Grid with Scroll */}
          <div>
            <div className="max-h-[400px] overflow-y-auto pr-2">
              <div className="grid grid-cols-3 border-2 border-gray-400 rounded-lg overflow-hidden bg-gray-200">
                {userDetails.user_reward && userDetails.user_reward.length > 0 ? (
                  userDetails.user_reward.map((reward, index) => {
                    const row = Math.floor(index / 3);
                    const col = index % 3;
                    const totalRows = Math.ceil(userDetails.user_reward.length / 3);
                    const isLastRow = row === totalRows - 1;
                    const isLastCol = col === 2;
                    
                    return (
                      <div
                        key={reward.user_reward_id || index}
                        className="aspect-square bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer"
                        style={{
                          borderRight: !isLastCol ? '1px solid #6b7280' : 'none',
                          borderBottom: !isLastRow ? '1px solid #6b7280' : 'none'
                        }}
                        onMouseEnter={() => setSelectedReward(reward)}
                      >
                        {reward?.reward?.reward_name ? (
                          <div className="w-full h-full flex items-center justify-center p-2">
                            {reward.reward.reward_type === 'sword' || reward.reward.reward_type === 'weapon' ? (
                              <span className="text-3xl">⚔️</span>
                            ) : (
                              <span className="text-xs text-center font-semibold text-gray-700">{reward.reward.reward_name}</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  Array.from({ length: 9 }).map((_, index) => {
                    const row = Math.floor(index / 3);
                    const col = index % 3;
                    const isLastRow = row === 2;
                    const isLastCol = col === 2;
                    
                    return (
                      <div
                        key={index}
                        className="aspect-square bg-gray-200 flex items-center justify-center"
                        style={{
                          borderRight: !isLastCol ? '1px solid #6b7280' : 'none',
                          borderBottom: !isLastRow ? '1px solid #6b7280' : 'none'
                        }}
                      >
                        <div className="w-3 h-3 bg-gray-400 rounded"></div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {userDetails.user_reward && userDetails.user_reward.length > 9 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                มีทั้งหมด {userDetails.user_reward.length} รายการ (เลื่อนดูเพิ่มเติม)
              </p>
            )}
          </div>
        </div>

        {/* Bottom Section - Item Detail */}
        <div className="mt-6 bg-gray-50 p-5 rounded-lg border-2 border-gray-200">
          <div className="flex gap-5">
            <div className="w-28 h-28 bg-gray-200 border-2 border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
              {selectedReward?.reward ? (
                selectedReward.reward.reward_type === 'sword' || selectedReward.reward.reward_type === 'weapon' ? (
                  <span className="text-5xl">⚔️</span>
                ) : (
                  <span className="text-3xl">🏆</span>
                )
              ) : userDetails.user_reward?.[0]?.reward ? (
                userDetails.user_reward[0].reward.reward_type === 'sword' || userDetails.user_reward[0].reward.reward_type === 'weapon' ? (
                  <span className="text-5xl">⚔️</span>
                ) : (
                  <span className="text-3xl">🏆</span>
                )
              ) : (
                <span className="text-gray-400 text-2xl">?</span>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg text-gray-900 mb-2">
                {selectedReward?.reward?.reward_name || userDetails.user_reward?.[0]?.reward?.reward_name || 'ไม่มีรายการ'}
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {selectedReward?.reward?.description || 
                 userDetails.user_reward?.[0]?.reward?.description || 
                 'Lorem Ipsum is a simple simulation of content.\nthat are used in the printing or typesetting\nbusiness It has been the standard simulation of\nthis business since the 16th'}
              </p>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="maps" className="mt-0">
        <h3 className="text-lg font-semibold mb-4">
          User Progress ({userDetails.user_progress.length})
        </h3>
        {userDetails.user_progress.length === 0 ? (
          <p className="text-muted-foreground">ยังไม่มี progress</p>
        ) : (
          <div className="flex flex-col gap-4">
            {userDetails.user_progress.map((progress) => (
              <Card key={progress.progress_id}>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">Level ID: {progress.level_id}</h4>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p>{progress.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stars</p>
                      <p>{progress.stars_earned} ⭐</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Best Score</p>
                      <p>{progress.best_score}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Attempts</p>
                      <p>{progress.attempts_count}</p>
                    </div>
                    {progress.completed_at && (
                      <div className="col-span-2 sm:col-span-4">
                        <p className="text-xs text-muted-foreground">
                          เสร็จเมื่อ: {new Date(progress.completed_at).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="rewards" className="mt-0">
        <h3 className="text-lg font-semibold mb-4">
          Rewards ({userDetails.user_reward.length})
        </h3>
        {userDetails.user_reward.length === 0 ? (
          <p className="text-muted-foreground">ยังไม่มี rewards</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userDetails.user_reward.map((userReward) => (
              <Card key={userReward.user_reward_id}>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">{userReward.reward.reward_name}</h4>
                  <Badge variant="default" className="mb-2">
                    {userReward.reward.reward_type}
                  </Badge>
                  {userReward.reward.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {userReward.reward.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    ได้รับเมื่อ: {new Date(userReward.earned_at).toLocaleDateString('th-TH')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default UserDetailsContent;

