import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    useCreateLevel,
    useUpdateLevel,
    useUploadLevelBackground
} from '../../../../services/hooks/useLevel';

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
        selectedBlocks: [],
        selectedVictoryConditions: [],
        algo_data: null,
    });

    const [backgroundImage, setBackgroundImage] = useState(null);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);

    // TanStack Query Mutations
    const createLevelMutation = useCreateLevel();
    const updateLevelMutation = useUpdateLevel();
    const uploadBackgroundMutation = useUploadLevelBackground();

    // Combined Loading state
    const saving = createLevelMutation.isPending || updateLevelMutation.isPending || uploadBackgroundMutation.isPending;

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
            'vampire_1': { name: '🧛 Vampire', hp: 3, damage: 100, detectionRange: 80 },
            'vampire_2': { name: '🧛 Vampire 2', hp: 3, damage: 100, detectionRange: 80 },
            'vampire_3': { name: '🧛 Vampire 3', hp: 3, damage: 100, detectionRange: 80 },
            'slime_1': { name: '💧 Slime 1', hp: 2, damage: 50, detectionRange: 60 }
        };

        const template = monsterTemplates[type] || monsterTemplates['vampire_1'];

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
            // Validate required fields
            if (!formData.category_id || !formData.level_name || !formData.difficulty) {
                toast.error('Please fill in all required fields: Category, Level Name, Difficulty Level, and Difficulty');
                return;
            }

            // Upload background image logic
            let backgroundImagePath = formData.background_image;

            if (backgroundImage) {
                try {
                    const uploadResult = await uploadBackgroundMutation.mutateAsync(backgroundImage);
                    backgroundImagePath = uploadResult.imageUrl;
                } catch (err) {
                    toast.error('Failed to upload background image. Please try again.');
                    return;
                }
            } else if (!backgroundImagePath && backgroundImageUrl) {
                try {
                    const response = await fetch(backgroundImageUrl);
                    const blob = await response.blob();
                    const file = new File([blob], 'background-image.png', { type: blob.type });
                    const uploadResult = await uploadBackgroundMutation.mutateAsync(file);
                    backgroundImagePath = uploadResult.imageUrl;
                } catch (err) {
                    if (backgroundImageUrl.startsWith('/uploads/')) {
                        backgroundImagePath = backgroundImageUrl;
                    } else {
                        toast.error('Please upload a background image before saving.');
                        return;
                    }
                }
            } else if (!backgroundImagePath || backgroundImagePath === '') {
                toast.error('Please upload a background image before saving.');
                return;
            }

            if (!backgroundImagePath || backgroundImagePath.trim() === '') {
                toast.error('Background image is required. Please upload a background image.');
                return;
            }

            const levelData = {
                category_id: parseInt(formData.category_id),
                level_name: formData.level_name.trim(),
                description: formData.description || null,

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
                character: formData.character || 'main_1',
                nodes: formData.nodes.length > 0 ? JSON.stringify(formData.nodes) : null,
                edges: formData.edges.length > 0 ? JSON.stringify(formData.edges) : null,
                monsters: formData.monsters.length > 0 ? JSON.stringify(formData.monsters) : null,
                obstacles: formData.obstacles.length > 0 ? JSON.stringify(formData.obstacles) : null,
                coin_positions: formData.coin_positions.length > 0 ? JSON.stringify(formData.coin_positions) : null,
                people: formData.people.length > 0 ? JSON.stringify(formData.people) : null,
                algo_data: formData.algo_data ? JSON.stringify(formData.algo_data) : null,
                block_ids: formData.selectedBlocks,
                victory_condition_ids: formData.selectedVictoryConditions,
            };

            if (isEditing) {
                await updateLevelMutation.mutateAsync({ levelId, levelData });
                toast.success('บันทึกข้อมูลด่านสำเร็จ');
            } else {
                await createLevelMutation.mutateAsync(levelData);
                toast.success('สร้างด่านสำเร็จ');
            }

            navigate('/admin/levels');
        } catch (err) {
            toast.error('เกิดข้อผิดพลาดในการบันทึก: ' + (err.message || ''));
        }
    };

    return {
        formData,
        setFormData,
        backgroundImage,
        backgroundImageUrl,
        saving,
        handleJsonFieldChange,
        handleBackgroundImageChange,
        handleDeleteMap,
        handleSave,
        addMonster
    };
};
