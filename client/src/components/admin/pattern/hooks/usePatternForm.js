import { useState, useEffect } from 'react';
import { useCreatePattern, useUpdatePattern } from '../../../../services/hooks/usePattern';

export const usePatternForm = ({
    levelId,
    patternId,
    patternData,
    patternTypes,
    onSaveSuccess,
    isEditMode
}) => {
    // Form State
    const [patternName, setPatternName] = useState('');
    const [patternDescription, setPatternDescription] = useState('');
    const [weaponId, setWeaponId] = useState('');
    const [bigO, setBigO] = useState('');

    const createMutation = useCreatePattern();
    const updateMutation = useUpdatePattern();

    // Initialize Form Data
    useEffect(() => {
        if (patternData) {
            setPatternName(patternData.pattern_name || '');
            setPatternDescription(patternData.description || '');
            setWeaponId(patternData.weapon_id ? patternData.weapon_id.toString() : '');
            setBigO(patternData.bigO || '');
        }
    }, [patternData]);

    const handleSave = async (finalSteps, workspaceXml) => {
        if (!patternName.trim()) {
            alert('กรุณากรอกชื่อ');
            return;
        }

        if (finalSteps.length === 0) {
            alert('ต้องมีอย่างน้อย 1 Step');
            return;
        }

        // Logic from original: Use last step as "Master XML" fallback
        const lastStep = finalSteps[finalSteps.length - 1];
        const finalPatternXml = workspaceXml || lastStep.xml || '';

        // Determine Pattern Type ID (Fallback logic)
        let targetTypeId = 1;
        if (patternTypes && patternTypes.length > 0) {
            const fixedType = patternTypes.find(t => t.type_name === 'fixed_steps' || t.type_name === 'step_based');
            if (fixedType) {
                targetTypeId = fixedType.pattern_type_id;
            } else {
                targetTypeId = patternTypes[0].pattern_type_id;
            }
        }

        const payload = {
            level_id: parseInt(levelId),
            pattern_name: patternName,
            description: patternDescription,
            weapon_id: weaponId ? parseInt(weaponId) : null,
            bigO: bigO,
            pattern_type_id: parseInt(targetTypeId),
            pattern_type: "fixed_steps",

            // Send XML with multiple keys to ensure backend compatibility
            pattern_xml: finalPatternXml,
            xml_pattern: finalPatternXml,
            xmlpattern: finalPatternXml,

            hints: finalSteps.map(s => ({
                step: s.step,
                trigger: "onXmlMatch",
                xmlCheck: s.xml,
                effect: s.effect || undefined
            }))
        };

        try {
            if (isEditMode) {
                await updateMutation.mutateAsync({ patternId, patternData: payload });
            } else {
                await createMutation.mutateAsync({ levelId, patternData: payload });
            }

            if (onSaveSuccess) onSaveSuccess();

        } catch (err) {
            console.error("Save failed", err);
            alert('บันทึกไม่สำเร็จ: ' + err.message);
        }
    };

    return {
        // State
        patternName, setPatternName,
        patternDescription, setPatternDescription,
        weaponId, setWeaponId,
        bigO, setBigO,

        // Actions
        handleSave,

        // Status
        isSaving: createMutation.isPending || updateMutation.isPending
    };
};
