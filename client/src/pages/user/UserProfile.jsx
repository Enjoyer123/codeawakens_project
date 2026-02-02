import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import PageLoader from '../../components/shared/Loading/PageLoader';
import UserDetailsContent from '../../components/shared/userDetailProfile/UserDetailsContent';

const UserProfile = () => {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-[#120a1f] w-full flex justify-center py-8">
      <div className="w-full max-w-5xl px-4">
        <UserDetailsContent
          allowEdit={true}
          useProfileService={true}
        // UserDetailsContent can handle its own refresh on interaction if needed
        />
      </div>
    </div>
  );
};

export default UserProfile;
