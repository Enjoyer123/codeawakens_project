import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BIG_O_OPTIONS } from '../constants/bigOOptions';

const BigOQuizModal = ({ isOpen, onClose, onSelect, currentPatternName }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-[#1e1b4b]/95 backdrop-blur-md text-white border-purple-500/30 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#c084fc] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                        Big O Complexity Quiz
                    </DialogTitle>
                    <DialogDescription className="text-purple-200/80">
                        Code ของคุณตรงกับรูปแบบ <strong>{currentPatternName || 'รูปแบบที่ไม่รู้จัก'}</strong>!
                        <br />
                        คุณคิดว่า Code นี้มีความซับซ้อน (Time Complexity) เท่าไหร่?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-3 py-4">
                    {BIG_O_OPTIONS.map((option) => (
                        <Button
                            key={option.value}
                            variant="outline"
                            className="justify-start text-left h-auto py-3 px-4 bg-purple-900/40 border-purple-500/30 hover:bg-purple-800/40 hover:text-white hover:border-purple-400 text-purple-100 transition-all duration-300"
                            onClick={() => onSelect(option.value)}
                        >
                            <div className="flex flex-col items-start">
                                <span className="font-mono text-lg font-bold text-[#c084fc] group-hover:text-white transition-colors">{option.label}</span>
                                <span className="text-xs text-purple-300/70 font-normal mt-1">{option.description || ''}</span>
                            </div>
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BigOQuizModal;
