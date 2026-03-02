import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const LoadXmlModal = ({ isOpen, onClose, options }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 bg-stone-900 border-stone-700">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-stone-800 bg-stone-900/50">
          <DialogTitle className="text-xl font-bold text-stone-100 flex items-center gap-2">
            📂 โหลดตัวอย่างโค้ด XML
          </DialogTitle>
        </DialogHeader>

        {/* Content (Scrollable Grid) */}
        <ScrollArea className="max-h-[60vh]">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    option.onClick();
                    onClose();
                  }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 text-left
                    ${option.className || 'bg-stone-800 border-stone-700 hover:bg-stone-700 hover:border-stone-500 text-stone-200'}
                    hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                  `}
                  title={option.title}
                >
                  <div className="text-2xl shrink-0">{option.icon || '📦'}</div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate w-full">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-stone-400 truncate w-full">{option.description}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="px-6 py-3 bg-stone-950/50 border-t border-stone-800">
          <Button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-sm transition-colors"
            variant="ghost"
          >
            ยกเลิก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoadXmlModal;

