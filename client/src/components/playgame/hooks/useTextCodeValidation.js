/**
 * Hook for text code validation
 * ตรวจสอบว่า text code ที่ user เขียนตรงกับ blocks หรือไม่
 */

import { useEffect, useCallback } from 'react';
import { validateTextCode } from '../../../gameutils/shared/hint';

export function useTextCodeValidation({
  currentLevel,
  textCode,
  workspaceRef,
  blocklyLoaded,
  blocklyJavaScriptReady,
  setCodeValidation
}) {
  // ฟังก์ชัน validation กลาง — ใช้ร่วมกันทุกจุด
  const runValidation = useCallback((code) => {
    if (!currentLevel?.textcode) {
      return setCodeValidation({ isValid: true, message: "" });
    }
    if (!code) {
      return setCodeValidation({ isValid: false, message: "กรุณาเขียนโค้ด" });
    }
    if (!workspaceRef.current || !blocklyLoaded || !blocklyJavaScriptReady) {
      return setCodeValidation({ isValid: false, message: "กำลังรอให้ระบบพร้อมใช้งาน..." });
    }
    try {
      setCodeValidation(validateTextCode(code, workspaceRef.current));
    } catch (error) {
      console.error("Error validating text code:", error);
      setCodeValidation({ isValid: false, message: "เกิดข้อผิดพลาดในการตรวจสอบโค้ด" });
    }
  }, [currentLevel?.textcode, workspaceRef, blocklyLoaded, blocklyJavaScriptReady, setCodeValidation]);

  // Handle text code changes (เรียกจาก onChange ของ editor)
  const handleTextCodeChange = (newCode) => runValidation(newCode);

  // Auto-validate เมื่อ dependencies เปลี่ยน
  useEffect(() => {
    runValidation(textCode);
  }, [currentLevel?.textcode, textCode, blocklyLoaded, blocklyJavaScriptReady, runValidation]);

  // Listen to workspace block changes (debounced)
  useEffect(() => {
    if (!currentLevel?.textcode || !workspaceRef.current || !blocklyLoaded || !blocklyJavaScriptReady) {
      return;
    }

    const workspace = workspaceRef.current;
    let timeoutId = null;

    const onBlockChange = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => runValidation(textCode), 300);
    };

    workspace.addChangeListener(onBlockChange);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (workspace.removeChangeListener) {
        workspace.removeChangeListener(onBlockChange);
      }
    };
  }, [currentLevel?.textcode, textCode, blocklyLoaded, blocklyJavaScriptReady, workspaceRef, runValidation]);

  return { handleTextCodeChange };
}
