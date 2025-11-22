import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllWeapons,
  createWeapon,
  updateWeapon,
  deleteWeapon,
  addWeaponImage,
  deleteWeaponImage,
} from '../../../services/weaponService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';
import AdminPageHeader from '@/components/shared/AdminPageHeader';
import SearchInput from '@/components/shared/SearchInput';
import ErrorAlert from '@/components/shared/ErrorAlert';
import PaginationControls from '@/components/shared/PaginationControls';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import WeaponImageDialog from './WeaponImageDialog';

const WeaponManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [weapons, setWeapons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  });

  // Weapon form states
  const [weaponDialogOpen, setWeaponDialogOpen] = useState(false);
  const [editingWeapon, setEditingWeapon] = useState(null);
  const [weaponForm, setWeaponForm] = useState({
    weapon_key: '',
    weapon_name: '',
    description: '',
    combat_power: 0,
    emoji: '',
    weapon_type: 'melee',
  });

  // Image management states
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [imageForm, setImageForm] = useState({
    type_file: 'idle',
    type_animation: 'weapon',
    frame: 1,
    imageFile: null,
  });

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [weaponToDelete, setWeaponToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadWeapons();
  }, [page, searchQuery]);

  const loadWeapons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllWeapons(getToken, page, rowsPerPage, searchQuery);
      setWeapons(data.weapons || []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      setError('Failed to load weapons. ' + (err.message || ''));
      setWeapons([]);
      setPagination({
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleOpenWeaponDialog = (weapon = null) => {
    if (weapon) {
      setEditingWeapon(weapon);
      setWeaponForm({
        weapon_key: weapon.weapon_key,
        weapon_name: weapon.weapon_name,
        description: weapon.description || '',
        combat_power: weapon.combat_power || 0,
        emoji: weapon.emoji || '',
        weapon_type: weapon.weapon_type,
      });
    } else {
      setEditingWeapon(null);
      setWeaponForm({
        weapon_key: '',
        weapon_name: '',
        description: '',
        combat_power: 0,
        emoji: '',
        weapon_type: 'melee',
      });
    }
    setWeaponDialogOpen(true);
  };

  const handleCloseWeaponDialog = () => {
    setWeaponDialogOpen(false);
    setEditingWeapon(null);
    setWeaponForm({
      weapon_key: '',
      weapon_name: '',
      description: '',
      combat_power: 0,
      emoji: '',
      weapon_type: 'melee',
    });
  };

  const handleSaveWeapon = async () => {
    try {
      if (editingWeapon) {
        await updateWeapon(getToken, editingWeapon.weapon_id, weaponForm);
      } else {
        await createWeapon(getToken, weaponForm);
      }
      handleCloseWeaponDialog();
      await loadWeapons();
    } catch (err) {
      alert('Failed to save weapon: ' + (err.message || 'Unknown error'));
    }
  };

  const handleOpenImageDialog = (weapon) => {
    setSelectedWeapon(weapon);
    setImageForm({
      type_file: 'idle',
      type_animation: 'weapon',
      frame: 1,
      imageFile: null,
    });
    setImageDialogOpen(true);
  };

  const handleImageDialogChange = (open) => {
    setImageDialogOpen(open);
    if (!open) {
      setSelectedWeapon(null);
      setImageForm({
        type_file: 'idle',
        type_animation: 'weapon',
        frame: 1,
        imageFile: null,
      });
    }
  };

  const handleAddImage = async () => {
    if (!selectedWeapon || !imageForm.imageFile) {
      alert('กรุณาเลือกอาวุธและไฟล์รูปภาพ');
      return;
    }

    if (!imageForm.type_file || !imageForm.type_animation || !imageForm.frame) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน: Type File, Type Animation, และ Frame');
      return;
    }

    if (imageForm.frame < 1) {
      alert('Frame ต้องมากกว่าหรือเท่ากับ 1');
      return;
    }

    try {
      setUploadingImage(true);
      await addWeaponImage(getToken, selectedWeapon.weapon_id, imageForm.imageFile, {
        type_file: imageForm.type_file,
        type_animation: imageForm.type_animation,
        frame: imageForm.frame,
        weapon_key: selectedWeapon.weapon_key,
      });
      
      // Reset form
      setImageForm({
        type_file: 'idle',
        type_animation: 'weapon',
        frame: 1,
        imageFile: null,
      });
      
      // Reload weapons list
      await loadWeapons();
      
      // Update selectedWeapon with fresh data to show new image in modal
      const data = await fetchAllWeapons(getToken, page, rowsPerPage, searchQuery);
      const updatedWeapon = data.weapons?.find(w => w.weapon_id === selectedWeapon.weapon_id);
      if (updatedWeapon) {
        setSelectedWeapon(updatedWeapon);
      }
    } catch (err) {
      const errorMessage = err.message || 'Unknown error';
      alert('ไม่สามารถเพิ่มรูปภาพได้: ' + errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้?')) {
      return;
    }

    try {
      setDeletingImageId(imageId);
      
      await deleteWeaponImage(getToken, imageId);
      
      // Update selectedWeapon by removing the deleted image from the array
      if (selectedWeapon) {
        const updatedImages = selectedWeapon.weapon_images?.filter(
          img => img.file_id !== parseInt(imageId)
        ) || [];
        
        setSelectedWeapon({
          ...selectedWeapon,
          weapon_images: updatedImages
        });
      }
      
      // Reload weapons list to get updated data (without showing loading)
      const data = await fetchAllWeapons(getToken, page, rowsPerPage, searchQuery);
      setWeapons(data.weapons || []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      alert('ไม่สามารถลบรูปภาพได้: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleDeleteClick = (weapon) => {
    setWeaponToDelete(weapon);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!weaponToDelete) return;

    try {
      setDeleting(true);
      await deleteWeapon(getToken, weaponToDelete.weapon_id);
      setDeleteDialogOpen(false);
      setWeaponToDelete(null);
      await loadWeapons();
    } catch (err) {
      alert('Failed to delete weapon: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteDialogChange = (open) => {
    if (!deleting) {
      setDeleteDialogOpen(open);
      if (!open) {
        setWeaponToDelete(null);
      }
    }
  };

  const getImageUrl = (pathFile) => {
    if (!pathFile) return null;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    return `${baseUrl}${pathFile}`;
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminPageHeader
          title="Weapon Management"
          subtitle="จัดการอาวุธและรูปภาพ"
          onAddClick={() => handleOpenWeaponDialog()}
          addButtonText="เพิ่มอาวุธ"
        />

        <ErrorAlert message={error} />

        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="ค้นหาอาวุธ (ชื่อ, key, คำอธิบาย)..."
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingState message="Loading weapons..." />
          ) : weapons.length === 0 ? (
            <EmptyState 
              message="ไม่พบอาวุธที่ค้นหา"
              searchQuery={searchQuery}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weapon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Key
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Power
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Images
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weapons.map((weapon) => (
                      <tr key={weapon.weapon_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{weapon.emoji || '⚔️'}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {weapon.weapon_name}
                              </div>
                              {weapon.description && (
                                <div className="text-sm text-gray-500">{weapon.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {weapon.weapon_key}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{weapon.weapon_type}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{weapon.combat_power}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {weapon.weapon_images && weapon.weapon_images.length > 0 ? (
                              <>
                                <Badge variant="secondary">
                                  {weapon.weapon_images.length} รูป
                                </Badge>
                                <div className="flex gap-1">
                                  {weapon.weapon_images.slice(0, 3).map((img) => (
                                    <img
                                      key={img.file_id}
                                      src={getImageUrl(img.path_file)}
                                      alt=""
                                      className="w-8 h-8 object-cover rounded border"
                                    />
                                  ))}
                                  {weapon.weapon_images.length > 3 && (
                                    <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center text-xs">
                                      +{weapon.weapon_images.length - 3}
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">ไม่มีรูป</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenImageDialog(weapon)}
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              รูปภาพ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenWeaponDialog(weapon)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              แก้ไข
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(weapon)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              ลบ
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                currentPage={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                rowsPerPage={rowsPerPage}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>

      {/* Weapon Add/Edit Dialog */}
      <Dialog open={weaponDialogOpen} onOpenChange={setWeaponDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWeapon ? 'แก้ไขอาวุธ' : 'เพิ่มอาวุธใหม่'}
            </DialogTitle>
            <DialogDescription>
              {editingWeapon ? 'แก้ไขข้อมูลอาวุธ' : 'กรอกข้อมูลอาวุธใหม่'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Weapon Key *</label>
              <Input
                value={weaponForm.weapon_key}
                onChange={(e) => setWeaponForm({ ...weaponForm, weapon_key: e.target.value })}
                placeholder="stick, sword, magic_sword"
                disabled={!!editingWeapon}
              />
              <p className="text-xs text-gray-500 mt-1">ไม่สามารถแก้ไขได้หลังจากสร้างแล้ว</p>
            </div>
            <div>
              <label className="text-sm font-medium">Weapon Name *</label>
              <Input
                value={weaponForm.weapon_name}
                onChange={(e) => setWeaponForm({ ...weaponForm, weapon_name: e.target.value })}
                placeholder="🏭 ไม้เท้าเก่า"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={weaponForm.description}
                onChange={(e) => setWeaponForm({ ...weaponForm, description: e.target.value })}
                placeholder="อาวุธพื้นฐานสำหรับผู้เริ่มต้น"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Combat Power</label>
                <Input
                  type="number"
                  value={weaponForm.combat_power}
                  onChange={(e) => setWeaponForm({ ...weaponForm, combat_power: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Emoji</label>
                <Input
                  value={weaponForm.emoji}
                  onChange={(e) => setWeaponForm({ ...weaponForm, emoji: e.target.value })}
                  placeholder="🏭"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Weapon Type *</label>
              <select
                value={weaponForm.weapon_type}
                onChange={(e) => setWeaponForm({ ...weaponForm, weapon_type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="melee">Melee</option>
                <option value="ranged">Ranged</option>
                <option value="magic">Magic</option>
                <option value="special">Special</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseWeaponDialog}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveWeapon}>
              {editingWeapon ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WeaponImageDialog
        open={imageDialogOpen}
        onOpenChange={handleImageDialogChange}
        selectedWeapon={selectedWeapon}
        imageForm={imageForm}
        onImageFormChange={setImageForm}
        uploadingImage={uploadingImage}
        deletingImageId={deletingImageId}
        onAddImage={handleAddImage}
        onDeleteImage={handleDeleteImage}
        getImageUrl={getImageUrl}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        onConfirm={handleDeleteConfirm}
        itemName={weaponToDelete?.weapon_name}
        title="ยืนยันการลบอาวุธ"
        description={
          <>
            คุณแน่ใจหรือไม่ว่าต้องการลบอาวุธ{' '}
            <strong>{weaponToDelete?.weapon_name}</strong>?
            <br />
            <br />
            การกระทำนี้ไม่สามารถยกเลิกได้ และจะลบข้อมูลอาวุธทั้งหมดรวมถึงรูปภาพที่เกี่ยวข้อง
          </>
        }
        deleting={deleting}
      />
    </div>
  );
};

export default WeaponManagement;

