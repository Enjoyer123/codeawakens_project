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
            <DialogContent className="sm:max-w-[425px] bg-white border-2 border-[#8B4513] shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-[#5C4033]">Edit Profile</DialogTitle>
                    <DialogDescription className="text-[#8B4513]/80">
                        Update your profile information and avatar here.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Profile Image Section */}
                    <div className="flex flex-col items-center gap-4">
                        <Label className="text-[#5C4033]">Profile Picture</Label>
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
                                    className="border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513]/10"
                                >
                                    {uploadingImage ? 'Uploading...' : 'Choose Image'}
                                </Button>
                                {(userDetails.user.profile_image || userDetails.user.profileImageUrl) &&
                                    !(userDetails.user.profile_image || userDetails.user.profileImageUrl).includes('clerk') && (
                                        <Button
                                            type="button"
                                            onClick={handleDeleteImage}
                                            variant="destructive"
                                            disabled={uploadingImage}
                                        >
                                            Remove
                                        </Button>
                                    )}
                            </div>
                            {imageError && <p className="text-xs text-red-500">{imageError}</p>}
                            {imageSuccess && <p className="text-xs text-green-600">{imageSuccess}</p>}
                        </div>
                    </div>

                    {/* Username Section */}
                    <form id="profile-form" onSubmit={handleUsernameUpdate} className="grid w-full items-center gap-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="username" className="text-[#5C4033]">Username</Label>
                            <Input
                                id="username"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                className="col-span-3 border-[#8B4513]/30 focus-visible:ring-[#8B4513]"
                                placeholder="Enter your username"
                            />
                        </div>
                        {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
                        {usernameSuccess && <p className="text-xs text-green-600">{usernameSuccess}</p>}
                    </form>
                </div>

                <DialogFooter>
                    <Button
                        type="submit"
                        form="profile-form"
                        disabled={savingUsername || uploadingImage}
                        className="bg-[#8B4513] hover:bg-[#5C4033] text-white"
                    >
                        {(savingUsername || uploadingImage) && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileEditDialog;
