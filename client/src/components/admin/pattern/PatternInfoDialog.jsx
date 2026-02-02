import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import PatternInfoForm from './PatternInfoForm';
import { usePattern, useUpdatePattern, usePatternTypes } from '../../../services/hooks/usePattern';
import { useWeapons } from '../../../services/hooks/useWeapons';
import ContentLoader from '@/components/shared/Loading/ContentLoader';

const PatternInfoDialog = ({ open, onOpenChange, patternId }) => {
    // Data Hooks
    const { data: patternData, isLoading: isPatternLoading } = usePattern(patternId);
    const { data: weaponsData, isLoading: isWeaponsLoading } = useWeapons(1, 100);
    const { data: patternTypes = [] } = usePatternTypes();

    // Mutation Hook
    const updateMutation = useUpdatePattern();

    // Local Form State
    const [patternName, setPatternName] = useState('');
    const [patternDescription, setPatternDescription] = useState('');
    const [weaponId, setWeaponId] = useState('');
    const [bigO, setBigO] = useState('');

    const weapons = weaponsData?.weapons || [];
    const isLoading = isPatternLoading || isWeaponsLoading;

    // Initialize form when data loads
    useEffect(() => {
        if (patternData && open) {
            setPatternName(patternData.pattern_name || '');
            setPatternDescription(patternData.description || '');
            setWeaponId(patternData.weapon_id ? patternData.weapon_id.toString() : '');
            setBigO(patternData.bigO || '');
        }
    }, [patternData, open]);

    const handleSave = async () => {
        if (!patternName.trim()) {
            alert('กรุณากรอกชื่อ');
            return;
        }

        if (!patternData) return;

        // Construct payload: Merge existing logic with new metadata
        // Ensure we send back the critical logic fields (xml, hints) so they aren't lost
        const payload = {
            ...patternData, // Keep existing fields

            // Overwrite with new metadata
            pattern_name: patternName,
            description: patternDescription,
            weapon_id: weaponId ? parseInt(weaponId) : null,
            bigO: bigO,

            // Explicitly ensure logic fields are present (though ...patternData should cover it)
            // Some backends might need these keys explicitly if they strictly validate
            pattern_xml: patternData.pattern_xml || patternData.xml_pattern || '',
            hints: patternData.hints || [],

            // Maintain relations
            level_id: patternData.level_id,
            pattern_type_id: patternData.pattern_type_id
        };

        try {
            await updateMutation.mutateAsync({ patternId, patternData: payload });
            onOpenChange(false);
        } catch (err) {
            console.error('Failed to update pattern info:', err);
            alert('บันทึกไม่สำเร็จ: ' + err.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>แก้ไขข้อมูลรูปแบบคำตอบ</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <ContentLoader message="Loading pattern info..." />
                ) : (
                    <div className="space-y-6">
                        {/* Reuse the existing dumb form component */}
                        <div className="border rounded-lg overflow-hidden">
                            <PatternInfoForm
                                patternName={patternName} setPatternName={setPatternName}
                                patternDescription={patternDescription} setPatternDescription={setPatternDescription}
                                weaponId={weaponId} setWeaponId={setWeaponId}
                                bigO={bigO} setBigO={setBigO}
                                patternTypes={patternTypes}
                                weapons={weapons}
                                isEditMode={true}
                                patternLoaded={true}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                ยกเลิก
                            </Button>
                            <Button onClick={handleSave} disabled={updateMutation.isPending}>
                                {updateMutation.isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                บันทึก
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PatternInfoDialog;
