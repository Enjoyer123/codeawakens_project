import { useState, useRef } from 'react';
import { updateUsername, uploadProfileImage, deleteProfileImage } from '../../../../../services/profileService';

export const useProfileTab = ({ userDetails, setUserDetails, getToken, onUpdateSuccess }) => {
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

  return {
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
  };
};
