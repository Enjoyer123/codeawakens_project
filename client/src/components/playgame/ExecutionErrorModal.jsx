import React from 'react';
import ReactDOM from 'react-dom';
import { AlertCircle, X } from 'lucide-react';

/**
 * Modal to display code execution errors (infinite loops, validation errors, etc.)
 * Uses React Portal to render at body level, ensuring visibility over Phaser and avoiding clipping.
 */
const ExecutionErrorModal = ({ open, error, onClose }) => {
    if (!open || !error) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border-2 border-red-100">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {error.title || "เกิดข้อผิดพลาด"}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        {error.message}
                    </p>

                    {/* Action Button */}
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-red-100"
                    >
                        ตกลง, ฉันจะแก้ไข
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ExecutionErrorModal;
