import { useState, useEffect, useCallback } from 'react';
import {
    fetchLevelById,
    fetchAllCategories,
    fetchLevelsForPrerequisite,
} from '../../../../services/levelService';
import { fetchAllBlocks } from '../../../../services/blockService';
import { fetchAllVictoryConditions } from '../../../../services/victoryConditionService';

import { API_BASE_URL } from '../../../../config/apiConfig';

export const useLevelData = (levelId, getToken) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Master Data
    const [categories, setCategories] = useState([]);
    const [prerequisiteLevels, setPrerequisiteLevels] = useState([]);
    const [allBlocks, setAllBlocks] = useState([]);
    const [allVictoryConditions, setAllVictoryConditions] = useState([]);

    // Level Data (for editing)
    const [initialLevelData, setInitialLevelData] = useState(null);
    const [initialSelectedCategory, setInitialSelectedCategory] = useState(null);
    const [initialBackgroundImageUrl, setInitialBackgroundImageUrl] = useState(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Load Master Data
            const [categoriesData, prerequisiteData, blocksData, victoryData] = await Promise.all([
                fetchAllCategories(getToken),
                fetchLevelsForPrerequisite(getToken),
                fetchAllBlocks(getToken, 1, 1000, ''),
                fetchAllVictoryConditions(getToken, 1, 1000, ''),
            ]);

            setCategories(categoriesData || []);
            setPrerequisiteLevels(prerequisiteData || []);
            setAllBlocks(blocksData?.blocks || []);
            setAllVictoryConditions(victoryData?.victoryConditions || []);

            // 2. Load Level Data (if editing)
            if (levelId) {
                const level = await fetchLevelById(getToken, levelId);

                // Parse JSON fields
                const nodes = level.nodes ? (typeof level.nodes === 'string' ? JSON.parse(level.nodes) : level.nodes) : [];
                let edges = level.edges ? (typeof level.edges === 'string' ? JSON.parse(level.edges) : level.edges) : [];
                edges = edges.map(edge => ({
                    ...edge,
                    value: edge.value !== undefined && edge.value !== null ? edge.value : undefined,
                }));

                const monsters = level.monsters ? (typeof level.monsters === 'string' ? JSON.parse(level.monsters) : level.monsters) : [];
                const obstacles = level.obstacles ? (typeof level.obstacles === 'string' ? JSON.parse(level.obstacles) : level.obstacles) : [];

                let coin_positions = level.coin_positions ? (typeof level.coin_positions === 'string' ? JSON.parse(level.coin_positions) : level.coin_positions) : [];
                coin_positions = coin_positions.map(coin => ({
                    ...coin,
                    value: coin.value !== undefined && coin.value !== null ? coin.value : 10,
                }));

                const people = level.people ? (typeof level.people === 'string' ? JSON.parse(level.people) : level.people) : [];
                const treasures = level.treasures ? (typeof level.treasures === 'string' ? JSON.parse(level.treasures) : level.treasures) : [];

                // Prepare Form Data
                const parsedData = {
                    category_id: level.category_id.toString(),
                    level_name: level.level_name,
                    description: level.description || '',
                    difficulty_level: level.difficulty_level,
                    difficulty: level.difficulty,
                    is_unlocked: level.is_unlocked,
                    required_level_id: level.required_level_id ? level.required_level_id.toString() : '',
                    required_skill_level: level.required_skill_level || null,
                    required_for_post_test: level.required_for_post_test || false,
                    textcode: level.textcode,
                    background_image: level.background_image,
                    start_node_id: level.start_node_id,
                    goal_node_id: level.goal_node_id,
                    goal_type: level.goal_type || '',
                    character: level.character || 'player',
                    nodes,
                    edges,
                    monsters,
                    obstacles,
                    coin_positions,
                    people,
                    treasures,
                    // Extra JSON fields (if any)
                    knapsack_data: typeof level.knapsack_data === 'string' ? JSON.parse(level.knapsack_data) : level.knapsack_data,
                    subset_sum_data: typeof level.subset_sum_data === 'string' ? JSON.parse(level.subset_sum_data) : level.subset_sum_data,
                    coin_change_data: typeof level.coin_change_data === 'string' ? JSON.parse(level.coin_change_data) : level.coin_change_data,
                    nqueen_data: typeof level.nqueen_data === 'string' ? JSON.parse(level.nqueen_data) : level.nqueen_data,

                    selectedBlocks: level.level_blocks?.map(lb => lb.block_id) || [],
                    selectedVictoryConditions: level.level_victory_conditions?.map(lvc => lvc.victory_condition_id) || [],
                };

                setInitialLevelData(parsedData);

                // Prepare Selected Category
                if (level.category) {
                    setInitialSelectedCategory(level.category);
                } else if (level.category_id) {
                    const category = categoriesData?.find(cat => cat.category_id === level.category_id);
                    setInitialSelectedCategory(category || null);
                }

                // Prepare Background Image URL
                if (level.background_image) {
                    if (level.background_image.startsWith('http') || level.background_image.startsWith('data:')) {
                        setInitialBackgroundImageUrl(level.background_image);
                    } else {
                        setInitialBackgroundImageUrl(`${API_BASE_URL}${level.background_image}`);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to load data:", err);
            setError('Failed to load data: ' + (err.message || ''));
        } finally {
            setLoading(false);
        }
    }, [levelId, getToken]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        loading,
        error,
        categories,
        prerequisiteLevels,
        allBlocks,
        allVictoryConditions,
        initialLevelData,
        initialSelectedCategory,
        initialBackgroundImageUrl,
        refreshData: loadData
    };
};
