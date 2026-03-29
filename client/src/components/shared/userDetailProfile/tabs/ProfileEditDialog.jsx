import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader } from 'lucide-react';

const ProfileEditDialog = ({
    open,
    onOpenChange,
    profileData
}) => {
    const {
        usernameInput,
        setUsernameInput,
        usernameError,
        usernameSuccess,
        savingUsername,
        uploadingImage,
        imageError,
        imageSuccess,
        fileInputRef,
        handleUsernameUpdate,
        handleImageUpload,
        handleDeleteImage,
        userDetails
    } = profileData;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white shadow-xl rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900">แก้ไขข้อมูลส่วนตัว</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        อัปเดตข้อมูลส่วนตัวและรูปโปรไฟล์ของคุณได้ที่นี่
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Profile Image Section */}
                    <div className="flex flex-col items-center gap-4">
                        <Label className="text-gray-700 font-semibold text-base">Profile Picture</Label>
                        <div className="flex flex-col items-center gap-2 w-full">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploadingImage}
                            />
                            <div className="flex gap-2 w-full justify-center">
                                <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                    variant="outline"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-200"
                                >
                                    {uploadingImage ? 'กำลังอัปโหลด...' : 'เลือกรูปภาพ'}
                                </Button>
                                {(userDetails.user.profile_image || userDetails.user.profileImageUrl) &&
                                    !(userDetails.user.profile_image || userDetails.user.profileImageUrl).includes('clerk') && (
                                        <Button
                                            type="button"
                                            onClick={handleDeleteImage}
                                            variant="destructive"
                                            disabled={uploadingImage}
                                            className="shadow-sm"
                                        >
                                            ลบรูปภาพ
                                        </Button>
                                    )}
                            </div>
                            {imageError && <p className="text-xs text-red-500 font-medium">{imageError}</p>}
                            {imageSuccess && <p className="text-xs text-green-600 font-medium">{imageSuccess}</p>}
                        </div>
                    </div>

                    {/* Username Section */}
                    <form id="profile-form" onSubmit={handleUsernameUpdate} className="grid w-full items-center gap-2">
                        <div className="flex flex-col gap-2 relative">
                            <Label htmlFor="username" className="text-gray-700 font-semibold mb-1">Username</Label>
                            <Input
                                id="username"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                className="col-span-3 border-gray-300 focus-visible:ring-[#7048e8] shadow-sm"
                                placeholder="กรอกชื่อผู้ใช้ของคุณ"
                            />
                        </div>
                        {usernameError && <p className="text-xs text-red-500 font-medium mt-1">{usernameError}</p>}
                        {usernameSuccess && <p className="text-xs text-green-600 font-medium mt-1">{usernameSuccess}</p>}
                    </form>
                </div>

                <DialogFooter>
                    <Button
                        type="submit"
                        form="profile-form"
                        disabled={savingUsername || uploadingImage}
                        className="bg-[#7048e8] hover:bg-[#5b37cc] text-white shadow-md transition-all active:scale-95 px-6"
                    >
                        {(savingUsername || uploadingImage) && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                        บันทึกการเปลี่ยนแปลง
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileEditDialog;
