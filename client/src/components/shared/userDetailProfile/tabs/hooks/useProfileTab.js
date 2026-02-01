import { useState, useRef } from 'react';
import { useUpdateUsername, useUploadProfileImage, useDeleteProfileImage } from '../../../../../services/hooks/useProfile';

export const useProfileTab = ({ userDetails, getToken, onUpdateSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState(userDetails.user.username || '');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const fileInputRef = useRef(null);

  // TanStack Query Mutations
  const {
    mutateAsync: updateUsernameAsync,
    isPending: savingUsername,
    error: updateUsernameError
  } = useUpdateUsername();

  const {
    mutateAsync: uploadImageAsync,
    isPending: uploadingImage,
    error: uploadImageError
  } = useUploadProfileImage();

  const {
    mutateAsync: deleteImageAsync,
    isPending: deletingImage, // We can reuse uploadingImage state or use this
    error: deleteImageError
  } = useDeleteProfileImage();

  // Unified error states derived from mutations
  const usernameError = updateUsernameError?.message || '';
  const imageError = uploadImageError?.message || deleteImageError?.message || '';
  const [imageSuccess, setImageSuccess] = useState('');

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    // Reset inputs on cancel
    if (isEditing) {
      setUsernameInput(userDetails.user.username || '');
    }
  };

  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    setUsernameSuccess('');

    if (!usernameInput || usernameInput.trim().length < 3) {
      // We can manage local validation error if we want, or rely on backend
      // But keeping local simple validation is good UX
      alert('Username must be at least 3 characters');
      return;
    }

    try {
      await updateUsernameAsync(usernameInput.trim());
      setUsernameSuccess('Username updated successfully');
      setTimeout(() => setUsernameSuccess(''), 3000);
      setIsEditing(false); // Exit edit mode on success
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      // Error handled by query hook state
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setImageSuccess('');

    try {
      await uploadImageAsync(file);
      setImageSuccess('Profile image updated successfully');
      setTimeout(() => setImageSuccess(''), 3000);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      // Error handled by query hook state
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm('Are you sure you want to delete your profile image?')) {
      return;
    }

    setImageSuccess('');

    try {
      await deleteImageAsync();
      setImageSuccess('Profile image deleted successfully');
      setTimeout(() => setImageSuccess(''), 3000);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      // Error handled by query hook state
    }
  };

  return {
    isEditing,
    usernameInput,
    setUsernameInput,
    usernameError,
    usernameSuccess,
    savingUsername,
    uploadingImage: uploadingImage || deletingImage,
    imageError,
    imageSuccess,
    fileInputRef,
    toggleEditMode,
    handleUsernameUpdate,
    handleImageUpload,
    handleDeleteImage
  };
};
