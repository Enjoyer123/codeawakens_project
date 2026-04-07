import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as profileService from '../../services/profileService.js';
import * as profileRepo from '../../models/profileModel.js';

vi.mock('../../models/profileModel.js');
vi.mock('../../models/levelModel.js');

describe('Profile Service - Reward & Auth Logic', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkProfile (Onboarding)', () => {
    it('should create a new user if Clerk ID is not found in database', async () => {
      // Mock db returns nothing for this clerkId
      profileRepo.findUserByClerkId.mockResolvedValue(null);
      // Mock db create user returns a new user
      const mockCreatedUser = { user_id: 99, clerk_user_id: 'clerk_new', username: 'newuser', role: 'user' };
      profileRepo.createUser.mockResolvedValue(mockCreatedUser);

      const clerkUser = { 
        id: 'clerk_new', 
        emailAddresses: [{ emailAddress: 'test@test.com' }] 
      };

      const result = await profileService.checkProfile(clerkUser);

      expect(profileRepo.createUser).toHaveBeenCalled();
      expect(result.user_id).toBe(99);
      expect(result.role).toBe('user');
      expect(result.username).toBe('newuser');
    });

    it('should NOT create a new user if Clerk ID already exists', async () => {
      const existingUser = { user_id: 1, clerk_user_id: 'clerk_old', username: 'olduser' };
      profileRepo.findUserByClerkId.mockResolvedValue(existingUser);
      // Return same for update in case it runs an update
      profileRepo.updateUserByClerkId.mockResolvedValue(existingUser);

      const clerkUser = { 
        id: 'clerk_old', 
        emailAddresses: [{ emailAddress: 'test@test.com' }] 
      };

      const result = await profileService.checkProfile(clerkUser);

      expect(profileRepo.createUser).not.toHaveBeenCalled();
      expect(result.user_id).toBe(1);
    });
  });

  describe('checkAndAwardRewards (Reward Security)', () => {
    const mockUser = { user_id: 1 };
    
    beforeEach(() => {
      profileRepo.findUserByClerkIdMinimal.mockResolvedValue(mockUser);
    });

    it('should NOT award rewards if database verified score is below required score', async () => {
      // User only got 60 points in the db
      profileRepo.findUserProgressForLevel.mockResolvedValue({ best_score: 60 });
      // The reward requires 80 points
      const mockRewards = [{ reward_id: 'sword1', required_score: 80 }];
      profileRepo.findRewardsForLevel.mockResolvedValue(mockRewards);
      profileRepo.findUserRewardsForLevel.mockResolvedValue([]);

      // Notice how we don't pass totalScore from frontend because we patched it
      const result = await profileService.checkAndAwardRewards('clerk123', 1);

      expect(result.awardedRewards).toHaveLength(0);
      expect(result.totalAwarded).toBe(0);
      expect(profileRepo.createUserReward).not.toHaveBeenCalled();
    });

    it('should award reward if database verified score meets required score', async () => {
      // User scored 100 points
      profileRepo.findUserProgressForLevel.mockResolvedValue({ best_score: 100 });
      // The reward requires 80 points
      const mockRewards = [{ reward_id: 'sword1', required_score: 80 }];
      profileRepo.findRewardsForLevel.mockResolvedValue(mockRewards);
      profileRepo.findUserRewardsForLevel.mockResolvedValue([]);
      
      profileRepo.createUserReward.mockResolvedValue({ reward_id: 'sword1' });

      // Action
      const result = await profileService.checkAndAwardRewards('clerk123', 1);

      // Asserts
      expect(profileRepo.createUserReward).toHaveBeenCalledWith(1, 'sword1', 1);
      expect(result.awardedRewards).toHaveLength(1);
      expect(result.totalAwarded).toBe(1);
    });

  });

});
