import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as levelService from '../../services/levelService.js';
import * as levelRepo from '../../models/levelModel.js';

vi.mock('../../models/levelModel.js');

describe('Level Service - Admin Level Management', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully prepare and call updateLevelTransaction with nested arrays', async () => {
    const mockData = {
      level_name: 'Boss Level',
      category_id: 2,
      block_ids: ['10', '15'],
      victory_condition_ids: ['5']
    };

    const mockUpdatedLevel = { level_id: 1, level_name: 'Boss Level' };
    levelRepo.findLevelById.mockResolvedValue({ level_id: 1, level_name: 'Old Name' });
    levelRepo.findLevelCategoryById.mockResolvedValue({ category_id: 2 });
    levelRepo.updateLevelTransaction.mockResolvedValue(mockUpdatedLevel);

    const result = await levelService.updateLevel(1, mockData);

    expect(levelRepo.updateLevelTransaction).toHaveBeenCalledWith(
       1,
       expect.objectContaining({ level_name: 'Boss Level', category_id: 2 }),
       ['10', '15'],
       ['5'],
       expect.any(Object) // include args
    );
    expect(result.level_name).toBe('Boss Level');
  });

  it('should still call updateLevelTransaction even if arrays are missing', async () => {
    const mockData = {
      level_name: 'New Standard Level'
    };

    const mockUpdatedLevel = { level_id: 1, level_name: 'New Standard Level' };
    levelRepo.findLevelById.mockResolvedValue({ level_id: 1 });
    levelRepo.updateLevelTransaction.mockResolvedValue(mockUpdatedLevel);

    const result = await levelService.updateLevel(1, mockData);

    expect(levelRepo.updateLevelTransaction).toHaveBeenCalledWith(
       1,
       expect.objectContaining({ level_name: 'New Standard Level' }),
       undefined,
       undefined,
       expect.any(Object)
    );
    expect(result.level_name).toBe('New Standard Level');
  });

});
