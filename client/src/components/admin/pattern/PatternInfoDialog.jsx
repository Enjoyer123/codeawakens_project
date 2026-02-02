import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Puzzle } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import PatternInfoForm from './PatternInfoForm';
import { usePattern, useUpdatePattern, useCreatePattern, usePatternTypes } from '../../../services/hooks/usePattern';
import { useWeapons } from '../../../services/hooks/useWeapons';
import ContentLoader from '@/components/shared/Loading/ContentLoader';

const PatternInfoDialog = ({ open, onOpenChange, patternId, levelId }) => {
    const navigate = useNavigate();
    const isCreateMode = !patternId;

    // Data Hooks
    const { data: patternData, isLoading: isPatternLoading } = usePattern(patternId);
    const { data: weaponsData, isLoading: isWeaponsLoading } = useWeapons(1, 100);
    const { data: patternTypes = [] } = usePatternTypes();

    // Mutation Hooks
    const updateMutation = useUpdatePattern();
    const createMutation = useCreatePattern();

    // Local Form State
    const [patternName, setPatternName] = useState('');
    const [patternDescription, setPatternDescription] = useState('');
    const [weaponId, setWeaponId] = useState('');
    const [bigO, setBigO] = useState('');

    const weapons = weaponsData?.weapons || [];
    const isLoading = (!isCreateMode && isPatternLoading) || isWeaponsLoading;

    // Initialize form when data loads or resets
    useEffect(() => {
        if (open) {
            if (isCreateMode) {
                // Reset form for create mode
                setPatternName('');
                setPatternDescription('');
                setWeaponId('');
                setBigO('');
            } else if (patternData) {
                // Fill form for edit mode
                setPatternName(patternData.pattern_name || '');
                setPatternDescription(patternData.description || '');
                setWeaponId(patternData.weapon_id ? patternData.weapon_id.toString() : '');
                setBigO(patternData.bigO || '');
            }
        }
    }, [patternData, open, isCreateMode]);

    const handleSave = async (shouldEditLogic = false) => {
        if (!patternName.trim()) {
            alert('กรุณากรอกชื่อ');
            return;
        }

        const payload = {
            pattern_name: patternName,
            description: patternDescription,
            weapon_id: weaponId ? parseInt(weaponId) : null,
            bigO: bigO,
            // Send both keys to be safe, as backend error mentioned 'xmlpattern'
            pattern_xml: isCreateMode ? '<xml xmlns="https://developers.google.com/blockly/xml"></xml>' : (patternData?.pattern_xml || patternData?.xml_pattern || ''),
            xmlpattern: isCreateMode ? '<xml xmlns="https://developers.google.com/blockly/xml"></xml>' : (patternData?.pattern_xml || patternData?.xml_pattern || ''),
            hints: isCreateMode ? [] : (patternData?.hints || []),
            level_id: isCreateMode ? parseInt(levelId) : patternData?.level_id,

            // Auto-assign first type if creating, to avoid "Missing required field" error
            // Backend should re-evaluate later when real XML is saved
            pattern_type_id: isCreateMode && patternTypes.length > 0 ? patternTypes[0].pattern_type_id : (patternData?.pattern_type_id || null)
        };

        try {
            if (isCreateMode) {
                const response = await createMutation.mutateAsync({ levelId, patternData: payload });
                if (shouldEditLogic && response.pattern_id) {
                    navigate(`/admin/levels/${levelId}/patterns/${response.pattern_id}/edit`);
                }
                onOpenChange(false);
            } else {
                await updateMutation.mutateAsync({ patternId, patternData: payload });
                if (shouldEditLogic) {
                    navigate(`/admin/levels/${patternData.level_id}/patterns/${patternId}/edit`);
                } else {
                    onOpenChange(false);
                }
            }
        } catch (err) {
            console.error('Failed to save pattern info:', err);
            alert('บันทึกไม่สำเร็จ: ' + err.message);
        }
    };

    const isPending = updateMutation.isPending || createMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isCreateMode ? 'สร้างรูปแบบคำตอบใหม่' : 'แก้ไขข้อมูลรูปแบบคำตอบ'}</DialogTitle>
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
                                isEditMode={!isCreateMode}
                                patternLoaded={!isCreateMode} // Just hide loading text if create mode
                            />
                        </div>

                        <div className="flex justify-between gap-3">
                            {/* Create Mode: Show "Create & Edit Logic" prominent */}
                            {isCreateMode ? (
                                <>
                                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                                        ยกเลิก
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => handleSave(false)} disabled={isPending}>
                                            {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                            สร้าง (ร่าง)
                                        </Button>
                                        <Button onClick={() => handleSave(true)} disabled={isPending}>
                                            {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                            สร้างและแก้ไข Logic
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                /* Edit Mode: Show Save and separate Edit Logic */
                                <>
                                    <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => handleSave(true)} disabled={isPending}>
                                        <Puzzle className="mr-2 h-4 w-4" /> ไปที่ Logic Editor
                                    </Button>

                                    <div className="flex gap-2">
                                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                                            ยกเลิก
                                        </Button>
                                        <Button onClick={() => handleSave(false)} disabled={isPending}>
                                            {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                            บันทึกข้อมูล
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PatternInfoDialog;
