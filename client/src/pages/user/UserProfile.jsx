import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { getUserByClerkId } from '../../services/profileService';
import { Loader } from '@/components/ui/loader';
import UserDetailsContent from '../../components/shared/UserDetailsContent';

const UserProfile = () => {
  const { user, isLoaded, getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      loadProfile();
    }
  }, [isLoaded, getToken]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await getUserByClerkId(getToken);
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSuccess = () => {
    // Reload profile data after update
    loadProfile();
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!profile || !profile.user || !profile.user.user_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">ไม่พบข้อมูลผู้ใช้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
            <UserButton afterSignOutUrl="/login" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg shadow-md p-6">
          <UserDetailsContent
            userId={profile.user.user_id}
            allowEdit={true}
            onUpdateSuccess={handleUpdateSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
