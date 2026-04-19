/**
 * Algo level execution path.
 * Execute → Test → Score → Save → Animate → Complete
 */

import * as Blockly from 'blockly/core';
import { getCurrentGameState } from '@/gameutils/shared/game/gameState';
import { extractFunctionName } from '@/gameutils/algo/codeParser';
import { executeAlgoCode } from '@/gameutils/algo/algoExecutor';
import { checkAlgoTestCases } from '@/gameutils/algo/algoTestRunner';
import { playAlgoAnimation } from '@/gameutils/algo/algoPlayback';
import { detectAlgoType } from '@/gameutils/shared/levelType';
import { calculateLevelScore } from '@/gameutils/shared/execution/executionScoring';
import { resetGameExecutionState } from '@/gameutils/shared/execution/executionReset';
import { handleLevelCompletion } from '@/gameutils/shared/execution/levelCompletionHandler';
import { saveUserProgress } from '@/services/api/profileService';
import { mapRuntimeErrorToMessage } from './codeValidator';
import { animationController } from '@/gameutils/algo/playback/AnimationController';

/**
 * Run the Algo execution path.
 * @param {string} code - Generated code from Blockly
 * @param {Object} params - All required params
 */
export async function runAlgoPath(code, {
    workspaceRef,
    currentLevel,
    isPreview,
    getToken,
    textCode,
    scoring,
    setters,
    patternId,
    onUnlockPattern,
    onUnlockLevel,
    setExecutionError
}) {
    const { patternData, goodPatterns, userBigO } = scoring;
    const {
        setIsRunning, setGameState, setFinalScore,
        setGameResult, setIsCompleted, setTestCaseResult,
        setPlayerHp, setPlayerNodeId, setPlayerDirection,
        setIsGameOver, setShowProgressModal
    } = setters;

    await new Promise(r => setTimeout(r, 300));

    // รีเซตตัวจัดการ Animation Controller (เอาสถานะ Pause จากรอบการรันครั้งก่อนออกให้หมด)
    animationController.reset();

    // หน้าที่รับผิดชอบเฟส 1: รันตรรกะแบบเพรียวๆ ล้วนๆ (ยังไม่ต้องวาดกราฟิกโชว์)
    const { result, trace, error } = await executeAlgoCode(code, currentLevel);



    if (error) {
        const friendlyMsg = mapRuntimeErrorToMessage(error);
        setExecutionError({ title: 'เกิดข้อผิดพลาดขณะทำงาน', message: friendlyMsg });
        setGameState('ready');
        setIsRunning(false);
        return;
    }

    // หน้าที่รับผิดชอบเฟส 2: ตรวจคู่เคสสอบตรรกะทั้งหมด (Check Test Cases)
    const functionName = extractFunctionName(code);
    const testCaseResult = await checkAlgoTestCases(
        result, currentLevel.test_cases || [], functionName, code, currentLevel
    );

    if (setTestCaseResult) setTestCaseResult(testCaseResult);


    // หน้าที่รับผิดชอบเฟส 3: ถ้าโค้ดผ่าน Test Case หมด → ตัดเกรด Score แล้วบันทึกลง Database ทันที (เซฟก่อนค่อยฉาย Animation เดี่ยวเน็ตหลุด)
    if (testCaseResult.passed && testCaseResult.failedTests.length === 0) {

        // ลำดับ 3a. ทำการวิเคราะห์แล้วคำนวณเกรด Score ของโค้ด
        const execState = getCurrentGameState();
        const scoreData = calculateLevelScore(execState, userBigO);
        setFinalScore(scoreData);
        setGameResult('victory');
        setIsCompleted(true);

        // 3b. Save progress early (before animation) — if user leaves during
        //     animation, progress is already saved. Uses profileService directly
        //     because this fires before control returns to useCodeExecution.
        if (!isPreview && getToken) {
            let blocklyXml = null;
            try {
                if (workspaceRef.current) {
                    blocklyXml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current));
                }
            } catch (e) { /* ignore */ }

            saveUserProgress(getToken, {
                level_id: currentLevel.level_id,
                status: 'completed',
                blockly_code: blocklyXml,
                text_code: currentLevel?.textcode ? (textCode || '') : null,
                pattern_type_id: scoring.patternId || 0, // ตามแบบฉบับ API Contract ล่าสุด
                is_correct: true,
                hp_remaining: execState.playerHp ?? 100,
                user_big_o: userBigO || null,
            }).catch(err => console.warn('⚠️ [Early Save] Failed:', err.message));
        }

        // หน้าที่รับผิดชอบเฟส 4: ฉาย Animation ประกอบด่าน (เป็น Option — ถึงดูไม่จบแต่ Database โดนเซฟไปแล้ว)
        const scene = getCurrentGameState().currentScene;
        const algoType = detectAlgoType(currentLevel);

        if (Array.isArray(result) && result.length > 0 && ['DFS', 'BFS', 'DIJKSTRA'].includes(algoType)) {
            trace.push({ action: 'move_along_path', path: [...result] });
        }

        if (scene && trace.length > 0) {


            await resetGameExecutionState({
                setPlayerHp,
                setPlayerNodeId,
                setPlayerDirection,
                currentLevel
            });

            try {
                // ตั้งค่าเป็นแบบรอทีละสเต็ป (Step Mode คือสั่ง Pause ทันที) ก่อนจะเริ่มเล่นแอนิเมชัน
                animationController.pause();
                await playAlgoAnimation(scene, algoType, trace, { result });
            } catch (animError) {
                console.warn('⚠️ [Algo Animation] Interrupted:', animError.message);
            }
        }
    }

    // หน้าที่รับผิดชอบเฟส 5: รับมือกับฉากจบ (Victory Modal เด้งโชว์ดาว / จัดการสถานะตอนตอบผิดรันไม่ผ่าน)
    // ถ้า animation ถูก abort (ออกจากด่านกลางคัน) → ข้ามส่วนนี้ทั้งหมด
    if (animationController.isAborted) {

        return;
    }
    await handleLevelCompletion({
        currentLevel,
        testCaseResult,
        isPreview,
        patternData,
        goodPatterns,
        userBigO,
        patternId,
        onUnlockPattern,
        onUnlockLevel,
        setters: {
            setIsGameOver, setGameState, setIsRunning,
            setGameResult, setFinalScore, setShowProgressModal, setIsCompleted
        }
    });
}
