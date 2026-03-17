import { useState, useCallback } from 'react';

/**
 * Hook to manage AlertDialog state.
 *
 * Usage:
 *   const { alertDialog, showAlert } = useAlertDialog();
 *   showAlert('ชื่อหัวข้อ', 'ข้อความ');
 *   <AlertDialog {...alertDialog} />
 */
export const useAlertDialog = () => {
    const [alertDialog, setAlertDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
        showCancel: false,
    });

    const showAlert = useCallback((title, message, onConfirm = null, options = {}) => {
        setAlertDialog({
            open: true,
            title,
            message,
            onConfirm,
            showCancel: options.showCancel || false,
            onCancel: options.onCancel || null,
            confirmLabel: options.confirmLabel || 'ตกลง',
            cancelLabel: options.cancelLabel || 'ยกเลิก',
        });
    }, []);

    const closeAlert = useCallback(() => {
        setAlertDialog(prev => ({ ...prev, open: false }));
    }, []);

    return {
        alertDialog: {
            ...alertDialog,
            onOpenChange: (open) => {
                if (!open) closeAlert();
            },
        },
        showAlert,
    };
};
