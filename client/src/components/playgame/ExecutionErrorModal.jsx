import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

/**
 * Modal to display code execution errors (infinite loops, validation errors, etc.)
 * Now uses shadcn Dialog with very high z-index to ensure visibility over Phaser canvas.
 */
const ExecutionErrorModal = ({ open, error, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="z-[9999] max-w-md p-0 bg-white border-2 border-red-100"
        hideCloseButton
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center text-center p-6">
          {/* Icon */}
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {error?.title || "เกิดข้อผิดพลาด"}
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {error?.message}
          </p>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-red-100"
          >
            ตกลง, ฉันจะแก้ไข
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExecutionErrorModal;

