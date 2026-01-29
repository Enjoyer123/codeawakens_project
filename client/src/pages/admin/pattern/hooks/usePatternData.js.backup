import { useState, useEffect, useRef } from 'react';
import { fetchLevelById } from '../../../../services/levelService';
import { fetchPatternById } from '../../../../services/patternService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const usePatternData = (levelId, patternId, isEditMode, getToken) => {
    // State definitions from PatternCreateEdit.jsx
    const [levelData, setLevelData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enabledBlocks, setEnabledBlocks] = useState({});
    const [patternData, setPatternData] = useState(null); // Store loaded pattern data
    const [patternLoaded, setPatternLoaded] = useState(false); // Track if pattern data has been loaded

    // Pattern form states
    const [patternName, setPatternName] = useState('');
    const [patternDescription, setPatternDescription] = useState('');
    const [weaponId, setWeaponId] = useState('');
    const [bigO, setBigO] = useState(''); // Big-O complexity (enum BigO)
    const [patternTypes, setPatternTypes] = useState([]);

    // Step management
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Refs relevant to data/state
    const stepsRef = useRef([]);
    // stepsXmlCacheRef is conceptually part of data state, though not used in loading logic directly
    const stepsXmlCacheRef = useRef({});

    // Load pattern types
    useEffect(() => {
        const loadPatternTypes = async () => {
            try {
                const token = await getToken();
                const response = await fetch(`${API_BASE_URL}/api/patterns/types`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setPatternTypes(data || []);
                }
            } catch (err) {
            }
        };

        loadPatternTypes();
    }, [getToken]);

    // Load level data
    useEffect(() => {
        const loadLevelData = async () => {
            try {
                setLoading(true);
                setError(null);
                const levelResponse = await fetchLevelById(getToken, levelId);

                if (!levelResponse || !levelResponse.level_id) {
                    throw new Error('ไม่พบข้อมูลด่าน');
                }

                setLevelData(levelResponse);

                // Get enabled blocks
                const enabledBlocksObj = {};
                (levelResponse.level_blocks || []).forEach((blockInfo) => {
                    if (blockInfo?.block?.block_key) {
                        enabledBlocksObj[blockInfo.block.block_key] = true;
                    }
                });

                if (Object.keys(enabledBlocksObj).length === 0) {
                    // Use default blocks
                    enabledBlocksObj.move_forward = true;
                    enabledBlocksObj.turn_left = true;
                    enabledBlocksObj.turn_right = true;
                    enabledBlocksObj.hit = true;
                }

                setEnabledBlocks(enabledBlocksObj);

                // Only set loading to false if not in edit mode (edit mode will set it to false after loading pattern)
                if (!isEditMode) {
                    setLoading(false);
                }
            } catch (err) {
                setError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (err?.message || 'ไม่ทราบสาเหตุ'));
                setLoading(false);
            }
        };

        if (levelId) {
            loadLevelData();
        }
    }, [levelId, getToken, isEditMode]);

    // Load pattern data if in edit mode (load immediately, don't wait for workspace)
    useEffect(() => {
        const loadPatternData = async () => {
            if (!isEditMode || !patternId || patternLoaded) {
                return;
            }

            try {
                setLoading(true);
                const fetchedPatternData = await fetchPatternById(getToken, patternId);
                // Backend returns pattern directly, not wrapped in { pattern: ... }
                const pattern = fetchedPatternData?.pattern || fetchedPatternData;

                if (pattern && pattern.pattern_id) {
                    // Store pattern data
                    setPatternData(pattern);
                    setPatternLoaded(true);

                    // Set form fields
                    setPatternName(pattern.pattern_name || '');
                    setPatternDescription(pattern.description || '');
                    setWeaponId(pattern.weapon_id ? pattern.weapon_id.toString() : '');
                    setBigO(pattern.bigO || '');


                    // Parse hints if it's a string
                    let hintsArray = pattern.hints;
                    if (typeof pattern.hints === 'string') {
                        try {
                            hintsArray = JSON.parse(pattern.hints);
                        } catch (e) {
                            hintsArray = [];
                        }
                    }

                    // Load steps from hints - ถ้า xmlCheck ว่างให้ใส่ starter_xml
                    if (hintsArray && Array.isArray(hintsArray) && hintsArray.length > 0) {
                        const loadedSteps = hintsArray.slice(0, 3).map((hint, index) => {
                            // ใช้ xmlCheck ถ้ามี ไม่งั้น fallback เป็น starter_xml เพื่อไม่ให้ workspace ว่างเปล่า
                            const xml = (hint.xmlCheck && hint.xmlCheck.trim())
                                ? hint.xmlCheck
                                : (pattern.starter_xml || '<xml xmlns="https://developers.google.com/blockly/xml"></xml>');

                            return {
                                step: index,
                                xml: xml
                            };
                        });
                        setSteps(loadedSteps);
                        stepsRef.current = loadedSteps;
                        setCurrentStepIndex(0);
                    } else {
                        setSteps([]);
                        setCurrentStepIndex(0);
                    }
                } else {
                }
            } catch (err) {
                setError('เกิดข้อผิดพลาดในการโหลดข้อมูลรูปแบบคำตอบ: ' + (err?.message || 'ไม่ทราบสาเหตุ'));
            } finally {
                setLoading(false);
            }
        };

        loadPatternData();
    }, [isEditMode, patternId, getToken, patternLoaded]);

    // Ensure currentStepIndex is valid when steps change
    useEffect(() => {
        if (steps.length > 0 && currentStepIndex >= steps.length) {
            // ถ้า index เกินขอบเขต ให้ไปที่ index ใหม่ (Step ใหม่) หรือ Step สุดท้ายที่บันทึกไว้
            // ในกรณีนี้ เราอนุญาตให้ไปที่ index = steps.length เพื่อสร้าง Step ใหม่
            if (currentStepIndex > steps.length) {
                setCurrentStepIndex(steps.length > 0 ? steps.length - 1 : 0);
            }
        }
    }, [steps, currentStepIndex]);

    return {
        // Data States
        levelData, setLevelData,
        loading, setLoading,
        error, setError,
        enabledBlocks, setEnabledBlocks,
        patternData, setPatternData,
        patternLoaded, setPatternLoaded,
        patternTypes, setPatternTypes,

        // Form States
        patternName, setPatternName,
        patternDescription, setPatternDescription,
        weaponId, setWeaponId,
        bigO, setBigO,

        // Step States & Refs
        steps, setSteps,
        currentStepIndex, setCurrentStepIndex,
        stepsRef,
        stepsXmlCacheRef
    };
};
