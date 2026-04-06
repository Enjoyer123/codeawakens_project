import apiClient from "./apiClient";

export const fetchUserProfile = async (getToken) => {
  try {
    return await apiClient.get(getToken, "/profile/check-profile");
  } catch (error) {
    throw error;
  }
};

export const updateUsername = async (getToken, username) => {
  try {
    return await apiClient.put(getToken, "/profile/username", { username });
  } catch (error) {
    throw error;
  }
};

export const uploadProfileImage = async (getToken, file) => {
  try {
    const formData = new FormData();
    formData.append("profileImage", file);
    return await apiClient.post(getToken, "/profile/image", formData);
  } catch (error) {
    throw error;
  }
};

export const deleteProfileImage = async (getToken) => {
  try {
    return await apiClient.delete(getToken, "/profile/image");
  } catch (error) {
    throw error;
  }
};

export const getUserByClerkId = async (getToken) => {
  try {
    return await apiClient.get(getToken, "/profile/user");
  } catch (error) {
    throw error;
  }
};

export const saveUserProgress = async (getToken, progressData) => {
  try {
    return await apiClient.post(getToken, "/profile/progress", progressData);
  } catch (error) {
    throw error;
  }
};

export const checkAndAwardRewards = async (getToken, levelId, totalScore) => {
  try {
    return await apiClient.post(getToken, "/profile/rewards/check", {
      level_id: levelId,
      total_score: totalScore,
    });
  } catch (error) {
    throw error;
  }
};
