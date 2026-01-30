import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import ErrorAlert from "@/components/shared/alert/ErrorAlert";
import { getImageUrl } from "@/utils/imageUtils";
import {
    createTest,
    updateTest,
    uploadTestImage,
    uploadChoiceImage,
    deleteTestChoice
} from '../../../services/testService';

const TestCreateEditModal = ({
    open,
    onOpenChange,
    testToEdit, // renamed from editingTest for clarity
    activeTab, // to set default type
    onSuccess
}) => {
    const { getToken } = useAuth();
    const [formData, setFormData] = useState({
        question: '',
        description: '',
        test_type: 'PreTest',
        part: 1,
        is_active: true,
        test_image: '',
        choices: []
    });

    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [choiceImages, setChoiceImages] = useState({});
    const [choiceImagePreviews, setChoiceImagePreviews] = useState({});
    const [saveError, setSaveError] = useState(null);
    const [saving, setSaving] = useState(false);

    // Initialize form when opening
    useEffect(() => {
        if (open) {
            setSaveError(null);
            if (testToEdit) {
                setFormData({
                    question: testToEdit.question,
                    description: testToEdit.description || '',
                    test_type: testToEdit.test_type,
                    part: testToEdit.part || 1,
                    is_active: testToEdit.is_active,
                    test_image: testToEdit.test_image || '',
                    choices: testToEdit.choices.map(c => ({
                        test_choice_id: c.test_choice_id,
                        choice_text: c.choice_text,
                        is_correct: c.is_correct,
                        choice_image: c.choice_image || ''
                    }))
                });
                setImagePreview(getImageUrl(testToEdit.test_image));
            } else {
                setFormData({
                    question: '',
                    description: '',
                    test_type: activeTab || 'PreTest',
                    part: 1,
                    is_active: true,
                    test_image: '',
                    choices: [
                        { choice_text: '', is_correct: true, choice_image: '' },
                        { choice_text: '', is_correct: false, choice_image: '' },
                        { choice_text: '', is_correct: false, choice_image: '' },
                        { choice_text: '', is_correct: false, choice_image: '' },
                    ]
                });
                setImagePreview(null);
            }
            setSelectedImage(null);
            setChoiceImages({});
            setChoiceImagePreviews({});
        }
    }, [open, testToEdit, activeTab]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setFormData(prev => ({ ...prev, test_image: '' }));
    };

    const handleChoiceImageChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            setChoiceImages(prev => ({ ...prev, [index]: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setChoiceImagePreviews(prev => ({ ...prev, [index]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeChoiceImage = (index) => {
        const newImages = { ...choiceImages };
        delete newImages[index];
        setChoiceImages(newImages);

        const newPreviews = { ...choiceImagePreviews };
        delete newPreviews[index];
        setChoiceImagePreviews(newPreviews);

        const newChoices = [...formData.choices];
        newChoices[index] = { ...newChoices[index], choice_image: '' };
        setFormData({ ...formData, choices: newChoices });
    };

    const updateChoice = (index, field, value) => {
        const newChoices = [...formData.choices];
        newChoices[index] = { ...newChoices[index], [field]: value };

        if (field === 'is_correct' && value === true) {
            newChoices.forEach((c, i) => {
                if (i !== index) c.is_correct = false;
            });
        }

        setFormData({ ...formData, choices: newChoices });
    };

    const addChoice = () => {
        setFormData({
            ...formData,
            choices: [...formData.choices, { choice_text: '', is_correct: false, choice_image: '' }]
        });
    };

    const removeChoice = async (index) => {
        const choice = formData.choices[index];
        if (choice.test_choice_id) {
            try {
                // If it's an existing one, delete via API
                // Note: Ideally we should batch this or just mark for deletion, 
                // but following existing pattern:
                await deleteTestChoice(getToken, choice.test_choice_id);
            } catch (err) {
                setSaveError("Failed to delete choice: " + err.message);
                return;
            }
        }
        const newChoices = formData.choices.filter((_, i) => i !== index);
        setFormData({ ...formData, choices: newChoices });
    };

    const handleSave = async () => {
        if (!formData.question.trim()) {
            setSaveError("Question is required");
            return;
        }

        const hasCorrect = formData.choices.some(c => c.is_correct);
        if (!hasCorrect) {
            setSaveError("At least one choice must be correct");
            return;
        }

        try {
            setSaving(true);
            setSaveError(null);

            let imagePath = formData.test_image;
            if (selectedImage) {
                const uploadResult = await uploadTestImage(getToken, selectedImage);
                imagePath = uploadResult.path;
            }

            const choicesWithImages = await Promise.all(formData.choices.map(async (choice, idx) => {
                let choiceImagePath = choice.choice_image;
                // If there's a new file selected for this index, upload it
                if (choiceImages[idx]) {
                    const uploadResult = await uploadChoiceImage(getToken, choiceImages[idx]);
                    choiceImagePath = uploadResult.path;
                }
                return {
                    ...choice,
                    choice_image: choiceImagePath
                };
            }));

            const dataToSave = {
                ...formData,
                test_image: imagePath,
                choices: choicesWithImages
            };

            if (testToEdit) {
                await updateTest(getToken, testToEdit.test_id, dataToSave);
            } else {
                await createTest(getToken, dataToSave);
            }

            setSaving(false);
            onOpenChange(false);
            if (onSuccess) onSuccess();

        } catch (err) {
            setSaving(false);
            setSaveError(err.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{testToEdit ? 'Edit Question' : 'New Question'}</DialogTitle>
                </DialogHeader>

                {saveError && <ErrorAlert message={saveError} />}

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Question</Label>
                        <Textarea
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="w-1/2 grid gap-2">
                            <Label>Type</Label>
                            <Select
                                value={formData.test_type}
                                onValueChange={(val) => setFormData({ ...formData, test_type: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PreTest">Pre-Test</SelectItem>
                                    <SelectItem value="PostTest">Post-Test</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.test_type === 'PreTest' && (
                            <div className="w-1/2 grid gap-2">
                                <Label>Level (Part)</Label>
                                <Select
                                    value={formData.part?.toString() || "1"}
                                    onValueChange={(val) => setFormData({ ...formData, part: parseInt(val) })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Basic</SelectItem>
                                        <SelectItem value="2">Logic</SelectItem>
                                        <SelectItem value="3">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="w-1/2 flex items-center gap-2 mt-6">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="isActive">Active</Label>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Test Image (Optional)</Label>
                        <div className="flex items-center gap-4">
                            {imagePreview ? (
                                <div className="relative w-24 h-24 border rounded overflow-hidden group">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={removeImage}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-24 h-24 border-2 border-dashed rounded flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                    <ImageIcon className="h-8 w-8 mb-1" />
                                    <span className="text-xs">No Image</span>
                                </div>
                            )}

                            <div className="flex-1">
                                <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                                    <Upload className="mr-2 h-4 w-4" /> Upload Image
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Supported formats: JPG, PNG, GIF, WebP
                                </p>
                            </div>
                        </div>
                    </div>


                    <div className="space-y-3 mt-4">
                        <Label>Choices (Select correct answer)</Label>
                        {formData.choices.map((choice, idx) => (
                            <div key={idx} className="flex flex-col gap-2 p-3 border rounded-md bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <div className="pt-2">
                                        <input
                                            type="radio"
                                            name="correct_choice"
                                            checked={choice.is_correct}
                                            onChange={() => updateChoice(idx, 'is_correct', true)}
                                            className="h-4 w-4 cursor-pointer"
                                        />
                                    </div>
                                    <Input
                                        value={choice.choice_text}
                                        onChange={(e) => updateChoice(idx, 'choice_text', e.target.value)}
                                        placeholder={`Choice ${idx + 1}`}
                                        className="flex-1"
                                    />

                                    <label className="cursor-pointer p-2 hover:bg-gray-200 rounded-full transition-colors" title="Add Image">
                                        <ImageIcon className="h-4 w-4 text-gray-500" />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleChoiceImageChange(idx, e)}
                                        />
                                    </label>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeChoice(idx)}
                                        disabled={formData.choices.length <= 2}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {(choiceImagePreviews[idx] || choice.choice_image) && (
                                    <div className="ml-8 relative w-20 h-20 group">
                                        <img
                                            src={choiceImagePreviews[idx] || getImageUrl(choice.choice_image)}
                                            alt={`Choice ${idx + 1}`}
                                            className="w-full h-full object-cover rounded border bg-white"
                                        />
                                        <button
                                            onClick={() => removeChoiceImage(idx)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                            title="Remove Image"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addChoice} className="mt-2">
                            <Plus className="h-4 w-4 mr-2" /> Add Choice
                        </Button>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TestCreateEditModal;
