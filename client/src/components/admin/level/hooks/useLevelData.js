import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '../../../../config/apiConfig';

// Hooks
import { useLevel, usePrerequisiteLevels, useLevelCategoryOptions } from '../../../../services/hooks/useLevel';
import { useBlocks } from '../../../../services/hooks/useBlocks';
import { useVictoryConditions } from '../../../../services/hooks/useVictoryConditions';

export const useLevelData = (levelId) => {
    // 1. Fetch Master Data
    const {
        data: categoriesData,
        isLoading: loadingCategories,
        error: errorCategories,
        refetch: refetchCategories
    } = useLevelCategoryOptions();

    const {
        data: prerequisiteData,
        isLoading: loadingPrerequisites,
        error: errorPrerequisites,
        refetch: refetchPrerequisites
    } = usePrerequisiteLevels();

    // Fetch all blocks (matches original limit=1000)
    const {
        data: blocksData,
        isLoading: loadingBlocks,
        error: errorBlocks,
        refetch: refetchBlocks
    } = useBlocks(1, 1000, '');

    // Fetch all victory conditions (matches original limit=1000)
    const {
        data: victoryData,
        isLoading: loadingVictory,
        error: errorVictory,
        refetch: refetchVictory
    } = useVictoryConditions(1, 1000, '');

    // 2. Fetch Level Data (if levelId exists)
    const {
        data: level,
        isLoading: loadingLevel,
        error: errorLevel,
        refetch: refetchLevel
    } = useLevel(levelId);

    // Combine Loading & Error States
    const loading = loadingCategories || loadingPrerequisites || loadingBlocks || loadingVictory || (!!levelId && loadingLevel);

    // Construct error message if any
    const error = errorCategories?.message || errorPrerequisites?.message || errorBlocks?.message || errorVictory?.message || errorLevel?.message || null;

    // Derived Data
    const categories = categoriesData || [];
    const prerequisiteLevels = prerequisiteData || [];
    const allBlocks = blocksData?.blocks || [];
    const allVictoryConditions = victoryData?.victoryConditions || [];

    // Process Level Data
    const { initialLevelData, initialSelectedCategory, initialBackgroundImageUrl } = useMemo(() => {
        if (!level) return {
            initialLevelData: null,
            initialSelectedCategory: null,
            initialBackgroundImageUrl: null
        };

        try {
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

            // Prepare Form Data structure
            const parsedData = {
                category_id: level.category_id?.toString() || '',
                level_name: level.level_name,
                description: level.description || '',
                difficulty_level: level.difficulty_level,
                difficulty: level.difficulty, // Assuming this exists on level object
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
                // Extra JSON fields
                knapsack_data: typeof level.knapsack_data === 'string' ? JSON.parse(level.knapsack_data) : level.knapsack_data,
                subset_sum_data: typeof level.subset_sum_data === 'string' ? JSON.parse(level.subset_sum_data) : level.subset_sum_data,
                coin_change_data: typeof level.coin_change_data === 'string' ? JSON.parse(level.coin_change_data) : level.coin_change_data,
                applied_data: typeof level.applied_data === 'string' ? JSON.parse(level.applied_data) : level.applied_data,
                nqueen_data: typeof level.nqueen_data === 'string' ? JSON.parse(level.nqueen_data) : level.nqueen_data,

                // Mapped selections
                selectedBlocks: level.level_blocks?.map(lb => lb.block_id) || [],
                selectedVictoryConditions: level.level_victory_conditions?.map(lvc => lvc.victory_condition_id) || [],
            };

            let selectedCategory = null;
            if (level.category) {
                selectedCategory = level.category;
            } else if (level.category_id) {
                selectedCategory = categories.find(cat => cat.category_id === level.category_id) || null;
            }

            let bgUrl = null;
            if (level.background_image) {
                if (level.background_image.startsWith('http') || level.background_image.startsWith('data:')) {
                    bgUrl = level.background_image;
                } else {
                    bgUrl = `${API_BASE_URL}${level.background_image}`;
                }
            }

            return {
                initialLevelData: parsedData,
                initialSelectedCategory: selectedCategory,
                initialBackgroundImageUrl: bgUrl
            };

        } catch (err) {
            console.error("Error parsing level data:", err);
            return { initialLevelData: null, initialSelectedCategory: null, initialBackgroundImageUrl: null };
        }
    }, [level, categories]);

    const refreshData = () => {
        refetchCategories();
        refetchPrerequisites();
        refetchBlocks();
        refetchVictory();
        if (levelId) refetchLevel();
    };

    return {
        loading,
        error, // Now a string or null
        categories,
        prerequisiteLevels,
        allBlocks,
        allVictoryConditions,
        initialLevelData,
        initialSelectedCategory,
        initialBackgroundImageUrl,
        refreshData
    };
};
