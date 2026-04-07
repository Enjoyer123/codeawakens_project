import { useState, useEffect } from 'react';
import {
    useCreateLevel,
    useUpdateLevel,
    useUploadLevelBackground
} from '../../../../services/hooks/useLevel';
import { toast } from 'sonner';
export const useLevelForm = ({
    initialData,
    levelId,
    isEditing,
    getToken,
    navigate,
    initialBackgroundImageUrl = null,
    showAlert
}) => {
    const [formData, setFormData] = useState({
        category_id: '',
        level_name: '',
        description: '',

        is_unlocked: false,
        required_level_id: '',
        required_skill_level: null,
        required_for_post_test: false,
        textcode: false,
        background_image: '',
        start_node_id: null,
        goal_node_id: null,
        nodes: [],
        edges: [],
        map_entities: [],
        selectedBlocks: [],
        selectedVictoryConditions: [],
        algo_data: null,
        dificulty: 'easy',
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
        showAlert?.('ยืนยันการล้างข้อมูล', 'Are you sure you want to delete the entire map?', () => {
            setFormData(prev => ({
                ...prev,
                nodes: [],
                edges: [],
                map_entities: [],
            }));
        }, { showCancel: true });
    };

    const addMonster = (type, x, y, startNodeId) => {
        const monsters = formData.map_entities.filter(e => e.entity_type === 'MONSTER');
        const newMonsterId = monsters.length > 0
            ? Math.max(...monsters.map(m => m.id)) + 1
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
            'vampire_1': { name: 'Vampire', hp: 3, damage: 100, detectionRange: 80 },
            'vampire_2': { name: 'Vampire 2', hp: 3, damage: 100, detectionRange: 80 },
            'vampire_3': { name: 'Vampire 3', hp: 3, damage: 100, detectionRange: 80 },
        };

        const template = monsterTemplates[type] || monsterTemplates['vampire_1'];

        const baseMonsterData = {
            ...template,
            type: type,
            entity_type: 'MONSTER',
            x: centerX,
            y: centerY,
            startNode: startNodeId,
            patrol: patrol,
            defeated: false,
        };

        setFormData(prev => ({
            ...prev,
            map_entities: [...prev.map_entities, { id: newMonsterId, ...baseMonsterData }],
        }));
    };

    const handleSave = async () => {
        try {
            // Validate required fields
            if (!formData.category_id || !formData.level_name) {
                toast.error('Please fill in all required fields: Category and Level Name');
                return;
            }

            // Upload background image logic
            let backgroundImagePath = formData.background_image;

            if (backgroundImage) {
                // We have a new File object to upload
                try {
                    const uploadResult = await uploadBackgroundMutation.mutateAsync(backgroundImage);
                    backgroundImagePath = uploadResult.imageUrl;
                } catch (err) {
                    console.error('Failed to upload background image:', err);
                    return;
                }
            } else if (backgroundImageUrl && backgroundImageUrl.startsWith('/uploads/')) {
                // We already have a valid local URL from before
                backgroundImagePath = backgroundImageUrl;
            } else if (!backgroundImagePath || backgroundImagePath.trim() === '') {
                toast.error('Please upload a background image before saving.');
                return;
            }

            const levelData = {
                category_id: parseInt(formData.category_id),
                level_name: formData.level_name.trim(),
                description: formData.description || null,

                is_unlocked: formData.is_unlocked,
                required_level_id: formData.required_level_id ? parseInt(formData.required_level_id) : null,
                required_skill_level: formData.required_skill_level || null,
                required_for_post_test: formData.required_for_post_test,
                textcode: formData.textcode,
                background_image: backgroundImagePath,
                start_node_id: formData.start_node_id !== null && formData.start_node_id !== undefined ? formData.start_node_id : null,
                goal_node_id: formData.goal_node_id !== null && formData.goal_node_id !== undefined ? formData.goal_node_id : null,
                character: formData.character || 'main_1',
                nodes: formData.nodes.length > 0 ? JSON.stringify(formData.nodes) : null,
                edges: formData.edges.length > 0 ? JSON.stringify(formData.edges) : null,
                map_entities: formData.map_entities.length > 0 ? JSON.stringify(formData.map_entities) : null,
                algo_data: formData.algo_data ? JSON.stringify(formData.algo_data) : null,
                dificulty: formData.dificulty || 'easy',
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
            console.error('Level save error:', err);
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
