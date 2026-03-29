import { useState, useRef } from 'react';
import { useUpdateUsername, useUploadProfileImage, useDeleteProfileImage } from '../../../../../services/hooks/useProfile';
import { toast } from 'sonner';

export const useProfileTab = ({ userDetails, getToken, onUpdateSuccess, showAlert }) => {
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
      toast.error('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    try {
      await updateUsernameAsync(usernameInput.trim());
      setUsernameSuccess('อัปเดตชื่อผู้ใช้เรียบร้อยแล้ว');
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
      toast.error('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }


    setImageSuccess('');

    try {
      await uploadImageAsync(file);
      setImageSuccess('อัปเดตรูปโปรไฟล์เรียบร้อยแล้ว');
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

  const handleDeleteImage = () => {
    showAlert?.('ยืนยันการลบรูป', 'คุณแน่ใจหรือไม่ว่าต้องการลบรูปโปรไฟล์นี้?', async () => {
      setImageSuccess('');
      try {
        await deleteImageAsync();
        setImageSuccess('ลบรูปโปรไฟล์เรียบร้อยแล้ว');
        setTimeout(() => setImageSuccess(''), 3000);
        if (onUpdateSuccess) onUpdateSuccess();
      } catch (error) {
        // Error handled by query hook state
      }
    }, { showCancel: true });
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
