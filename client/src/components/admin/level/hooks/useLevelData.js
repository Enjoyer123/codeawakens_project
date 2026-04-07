import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '../../../../config/apiConfig';

// Hooks
import { useLevel, usePrerequisiteLevels, useLevelCategoryOptions } from '../../../../services/hooks/useLevel';
import { useBlocks } from '../../../../services/hooks/useBlocks';
import { useVictoryConditions } from '../../../../services/hooks/useVictoryConditions';

const EMPTY_ARRAY = [];

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
    const categories = categoriesData || EMPTY_ARRAY;
    const prerequisiteLevels = prerequisiteData || EMPTY_ARRAY;
    const allBlocks = blocksData?.blocks || EMPTY_ARRAY;
    const allVictoryConditions = victoryData?.victoryConditions || EMPTY_ARRAY;

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

            let map_entities = level.map_entities ? (typeof level.map_entities === 'string' ? JSON.parse(level.map_entities) : level.map_entities) : [];
            map_entities = map_entities.map(entity => {
                if (entity.entity_type === 'COIN') {
                    return {
                        ...entity,
                        value: entity.value !== undefined && entity.value !== null ? entity.value : 10,
                    };
                }
                return entity;
            });


            // Prepare Form Data structure
            const parsedData = {
                category_id: level.category_id?.toString() || '',
                level_name: level.level_name,
                description: level.description || '',
                is_unlocked: level.is_unlocked,
                required_level_id: level.required_level_id ? level.required_level_id.toString() : '',
                required_skill_level: level.required_skill_level || null,
                required_for_post_test: level.required_for_post_test || false,
                textcode: level.textcode,
                background_image: level.background_image,
                start_node_id: level.start_node_id,
                goal_node_id: level.goal_node_id,
                character: level.character || 'player',
                nodes,
                edges,
                map_entities,
                // Extra JSON fields — ใช้ algo_data เท่านั้น (ไม่ migrate ด่านเก่า)
                algo_data: typeof level.algo_data === 'string' ? JSON.parse(level.algo_data) : (level.algo_data || null),

                // Mapped selections
                selectedBlocks: level.level_blocks?.map(lb => lb.block_id) || [],
                selectedVictoryConditions: level.level_victory_conditions?.map(lvc => lvc.victory_condition_id) || [],
                dificulty: level.dificulty || 'easy',
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
