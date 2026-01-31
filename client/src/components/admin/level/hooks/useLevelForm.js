import { useState, useEffect } from 'react';
import {
    createLevel,
    updateLevel,
    uploadLevelBackgroundImage,
} from '../../../../services/levelService';

export const useLevelForm = ({
    initialData,
    levelId,
    isEditing,
    getToken,
    navigate,
    initialBackgroundImageUrl = null
}) => {
    const [formData, setFormData] = useState({
        category_id: '',
        level_name: '',
        description: '',
        difficulty_level: 1,
        difficulty: 'easy',
        is_unlocked: false,
        required_level_id: '',
        required_skill_level: null,
        required_for_post_test: false,
        textcode: false,
        background_image: '',
        start_node_id: null,
        goal_node_id: null,
        goal_type: '',
        nodes: [],
        edges: [],
        monsters: [],
        obstacles: [],
        coin_positions: [],
        people: [],
        treasures: [],
        selectedBlocks: [],
        selectedVictoryConditions: [],
        knapsack_data: null,
        subset_sum_data: null,
        coin_change_data: null,
        applied_data: null,
        nqueen_data: null,
    });

    const [backgroundImage, setBackgroundImage] = useState(null);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Load initial data when available
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
        if (initialBackgroundImageUrl) {
            setBackgroundImageUrl(initialBackgroundImageUrl);
        }
    }, [initialData, initialBackgroundImageUrl]);

    const handleJsonFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleBackgroundImageChange = (file, url) => {
        setBackgroundImage(file);
        setBackgroundImageUrl(url);
    };

    const handleDeleteMap = () => {
        if (confirm('Are you sure you want to delete the entire map?')) {
            setFormData(prev => ({
                ...prev,
                nodes: [],
                edges: [],
                monsters: [],
                obstacles: [],
                coin_positions: [],
                people: [],
                treasures: [],
            }));
        }
    };

    const addMonster = (type, x, y, startNodeId) => {
        const newMonsterId = formData.monsters.length > 0
            ? Math.max(...formData.monsters.map(m => m.id)) + 1
            : 1;

        const patrolWidth = 40;
        const patrolHeight = 45;
        const centerX = Math.round(x);
        const centerY = Math.round(y);

        const patrol = [
            { x: centerX - patrolWidth / 2, y: centerY - patrolHeight / 2 },
            { x: centerX + patrolWidth / 2, y: centerY - patrolHeight / 2 },
            { x: centerX + patrolWidth / 2, y: centerY + patrolHeight / 2 },
            { x: centerX - patrolWidth / 2, y: centerY + patrolHeight / 2 }
        ];

        const monsterTemplates = {
            'enemy': {
                name: '👹 Goblin',
                hp: 3,
                damage: 100,
                detectionRange: 60
            },
            'vampire_1': {
                name: '🧛 Vampire',
                hp: 3,
                damage: 100,
                detectionRange: 80
            }
        };

        const template = monsterTemplates[type] || monsterTemplates['enemy'];

        const baseMonsterData = {
            ...template,
            type: type,
            x: centerX,
            y: centerY,
            startNode: startNodeId,
            patrol: patrol,
            defeated: false,
        };

        setFormData(prev => ({
            ...prev,
            monsters: [...prev.monsters, { id: newMonsterId, ...baseMonsterData }],
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            // Validate required fields
            if (!formData.category_id || !formData.level_name || !formData.difficulty_level || !formData.difficulty) {
                setError('Please fill in all required fields: Category, Level Name, Difficulty Level, and Difficulty');
                setSaving(false);
                return;
            }

            // Upload background image logic
            let backgroundImagePath = formData.background_image;

            if (backgroundImage) {
                try {
                    const uploadResult = await uploadLevelBackgroundImage(getToken, backgroundImage);
                    backgroundImagePath = uploadResult.imagePath;
                } catch (err) {
                    setError('Failed to upload background image. Please try again.');
                    setSaving(false);
                    return;
                }
            } else if (!backgroundImagePath && backgroundImageUrl) {
                try {
                    const response = await fetch(backgroundImageUrl);
                    const blob = await response.blob();
                    const file = new File([blob], 'background-image.png', { type: blob.type });
                    const uploadResult = await uploadLevelBackgroundImage(getToken, file);
                    backgroundImagePath = uploadResult.imagePath;
                } catch (err) {
                    if (backgroundImageUrl.startsWith('/uploads/')) {
                        backgroundImagePath = backgroundImageUrl;
                    } else {
                        setError('Please upload a background image before saving.');
                        setSaving(false);
                        return;
                    }
                }
            } else if (!backgroundImagePath || backgroundImagePath === '') {
                setError('Please upload a background image before saving.');
                setSaving(false);
                return;
            }

            if (!backgroundImagePath || backgroundImagePath.trim() === '') {
                setError('Background image is required. Please upload a background image.');
                setSaving(false);
                return;
            }

            const levelData = {
                category_id: parseInt(formData.category_id),
                level_name: formData.level_name.trim(),
                description: formData.description || null,
                difficulty_level: parseInt(formData.difficulty_level),
                difficulty: formData.difficulty,
                is_unlocked: formData.is_unlocked,
                required_level_id: formData.required_level_id ? parseInt(formData.required_level_id) : null,
                required_skill_level: formData.required_skill_level || null,
                required_for_post_test: formData.required_for_post_test,
                textcode: formData.textcode,
                background_image: backgroundImagePath,
                start_node_id: formData.start_node_id !== null && formData.start_node_id !== undefined ? formData.start_node_id : null,
                goal_node_id: formData.goal_node_id !== null && formData.goal_node_id !== undefined ? formData.goal_node_id : null,
                goal_type: formData.goal_type || null,
                character: formData.character || 'player',
                nodes: formData.nodes.length > 0 ? JSON.stringify(formData.nodes) : null,
                edges: formData.edges.length > 0 ? JSON.stringify(formData.edges) : null,
                monsters: formData.monsters.length > 0 ? JSON.stringify(formData.monsters) : null,
                obstacles: formData.obstacles.length > 0 ? JSON.stringify(formData.obstacles) : null,
                coin_positions: formData.coin_positions.length > 0 ? JSON.stringify(formData.coin_positions) : null,
                people: formData.people.length > 0 ? JSON.stringify(formData.people) : null,
                treasures: formData.treasures.length > 0 ? JSON.stringify(formData.treasures) : null,
                knapsack_data: formData.knapsack_data ? JSON.stringify(formData.knapsack_data) : null,
                subset_sum_data: formData.subset_sum_data ? JSON.stringify(formData.subset_sum_data) : null,
                coin_change_data: formData.coin_change_data ? JSON.stringify(formData.coin_change_data) : null,
                applied_data: formData.applied_data ? JSON.stringify(formData.applied_data) : null,
                nqueen_data: formData.nqueen_data ? JSON.stringify(formData.nqueen_data) : null,
                block_ids: formData.selectedBlocks,
                victory_condition_ids: formData.selectedVictoryConditions,
            };

            if (isEditing) {
                await updateLevel(getToken, levelId, levelData);
            } else {
                await createLevel(getToken, levelData);
            }

            navigate('/admin/levels');
        } catch (err) {
            setError('Failed to save level: ' + (err.message || ''));
        } finally {
            setSaving(false);
        }
    };

    return {
        formData,
        setFormData,
        backgroundImage,
        backgroundImageUrl,
        saving,
        error,
        handleJsonFieldChange,
        handleBackgroundImageChange,
        handleDeleteMap,
        handleSave,
        addMonster
    };
};
