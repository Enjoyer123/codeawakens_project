/**
 * Hook for text code validation
 */

import { useEffect } from 'react';
import { validateTextCode } from '../../../gameutils/utils/hintSystem';

/**
 * Hook for text code validation
 */
export function useTextCodeValidation({
  currentLevel,
  textCode,
  workspaceRef,
  blocklyLoaded,
  blocklyJavaScriptReady,
  setCodeValidation
}) {
  // Handle text code changes
  const handleTextCodeChange = (newCode) => {
    // ตรวจสอบ validation เมื่อมีการเปลี่ยนแปลง (เฉพาะเมื่อ Blockly.JavaScript พร้อม)
    if (currentLevel?.textcode && workspaceRef.current && blocklyLoaded && blocklyJavaScriptReady) {
      try {
        const validation = validateTextCode(newCode, workspaceRef.current);
        setCodeValidation(validation);
      } catch (error) {
        console.error("Error in handleTextCodeChange:", error);
        setCodeValidation({
          isValid: false,
          message: "เกิดข้อผิดพลาดในการตรวจสอบโค้ด"
        });
      }
    } else if (currentLevel?.textcode && !blocklyJavaScriptReady) {
      // แสดงข้อความรอเมื่อ Blockly.JavaScript ยังไม่พร้อม
      setCodeValidation({
        isValid: false,
        message: "กำลังรอให้ระบบพร้อมใช้งาน..."
      });
    } else if (currentLevel?.textcode && (!workspaceRef.current || !blocklyLoaded)) {
      // Reset validation เมื่อ workspace ยังไม่พร้อม
      setCodeValidation({
        isValid: false,
        message: "กรุณารอให้ระบบพร้อม..."
      });
    } else if (!currentLevel?.textcode) {
      // ถ้าไม่ใช่ textcode mode ให้ clear validation
      setCodeValidation({ isValid: true, message: "" });
    }
  };

  // ตรวจสอบ code validation เมื่อ blocks เปลี่ยนแปลง (สำหรับด่านที่มี textcode: true)
  useEffect(() => {
    if (currentLevel?.textcode && workspaceRef.current && blocklyLoaded && blocklyJavaScriptReady && textCode) {
      try {
        const validation = validateTextCode(textCode, workspaceRef.current);
        setCodeValidation(validation);
      } catch (error) {
        console.error("Error in useEffect validation:", error);
        setCodeValidation({
          isValid: false,
          message: "เกิดข้อผิดพลาดในการตรวจสอบโค้ด"
        });
      }
    } else if (currentLevel?.textcode && textCode && (!workspaceRef.current || !blocklyLoaded || !blocklyJavaScriptReady)) {
      // Reset validation เมื่อระบบยังไม่พร้อม
      setCodeValidation({
        isValid: false,
        message: "กำลังรอให้ระบบพร้อมใช้งาน..."
      });
    } else if (currentLevel?.textcode && !textCode) {
      // Reset validation เมื่อไม่มี text code
      setCodeValidation({
        isValid: false,
        message: "กรุณาเขียนโค้ด"
      });
    }
  }, [currentLevel?.textcode, textCode, blocklyLoaded, blocklyJavaScriptReady, workspaceRef.current]);

  // ตรวจสอบ code validation เมื่อ blocks เปลี่ยนแปลง (listen to workspace changes)
  useEffect(() => {
    if (!currentLevel?.textcode || !workspaceRef.current || !blocklyLoaded || !blocklyJavaScriptReady || !textCode) {
      return;
    }

    const workspace = workspaceRef.current;
    let timeoutId = null;
    
    const validateOnBlockChange = () => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Debounce validation to avoid too many calls
      timeoutId = setTimeout(() => {
        if (workspaceRef.current && textCode) {
          try {
            const validation = validateTextCode(textCode, workspaceRef.current);
            setCodeValidation(validation);
          } catch (error) {
            console.error("Error validating on block change:", error);
          }
        }
      }, 300);
    };

    workspace.addChangeListener(validateOnBlockChange);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (workspace.removeChangeListener) {
        workspace.removeChangeListener(validateOnBlockChange);
      }
    };
  }, [currentLevel?.textcode, textCode, blocklyLoaded, blocklyJavaScriptReady, workspaceRef.current]);

  return { handleTextCodeChange };
}

