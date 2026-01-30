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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <UserDetailsContent
        allowEdit={true}
        useProfileService={true}
      // UserDetailsContent can handle its own refresh on interaction if needed
      />
    </div>
  );
};

export default UserProfile;
