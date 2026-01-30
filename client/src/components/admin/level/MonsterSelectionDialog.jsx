import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const MonsterSelectionDialog = ({ open, onOpenChange, onSelectMonster }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>เลือกประเภทมอนสเตอร์</DialogTitle>
                    <DialogDescription>
                        เลือกมอนสเตอร์ที่คุณต้องการวางที่ตำแหน่งนี้
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <Button
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-auto py-6 border-2 hover:border-blue-500 hover:bg-blue-50"
                        onClick={() => onSelectMonster('enemy')}
                    >
                        <span className="text-4xl">👹</span>
                        <span className="font-bold">Goblin</span>
                        <span className="text-xs text-gray-500">HP: 3 | ATK: 100</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-auto py-6 border-2 hover:border-blue-500 hover:bg-blue-50"
                        onClick={() => onSelectMonster('vampire_1')}
                    >
                        <span className="text-4xl">🧛</span>
                        <span className="font-bold">Vampire</span>
                        <span className="text-xs text-gray-500">HP: 3 | ATK: 100</span>
                    </Button>
                </div>
                <DialogFooter className="sm:justify-start">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                    >
                        ยกเลิก
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MonsterSelectionDialog;
