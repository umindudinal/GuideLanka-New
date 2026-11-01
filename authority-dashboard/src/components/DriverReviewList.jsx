import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { API_BASE_URL } from '../services/apiConfig';

import {
  User,
  Phone,
  CheckCircle,
  Award,
  Star,
  MessageSquare,
  Plus,
  X,
  Mail,
  Lock,
  Car,
  Check,
  Trash2,
  Camera,
  Eye,
  EyeOff,
  ShieldCheck,
  Edit3
} from 'lucide-react';

function DriverCard({ driver, onDriverDeleted, onDriverUpdated }) {
  const [avatarError, setAvatarError] = useState(false);

  const profile = driver.driver_profile
    ? (Array.isArray(driver.driver_profile) ? driver.driver_profile[0] : driver.driver_profile)
    : (driver.driver_profiles ? (Array.isArray(driver.driver_profiles) ? driver.driver_profiles[0] : driver.driver_profiles) : null);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);



  // Edit Driver States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(driver.full_name || '');
  const [editPhone, setEditPhone] = useState(driver.phone_number || '');
  const [editModel, setEditModel] = useState(
    profile?.vehicle_model ||
    (profile?.vehicle_id?.includes('•') ? profile.vehicle_id.split('•')[1].trim() : 'Toyota Hilux 4x4 (6 Seats)')
  );
  const [editPlate, setEditPlate] = useState(
    profile?.vehicle_id?.includes('•') ? profile.vehicle_id.split('•')[0].trim() : (profile?.vehicle_id || '')
  );
  const [editPrice, setEditPrice] = useState(profile?.price_per_safari || 12500);
  const [editExp, setEditExp] = useState(profile?.experience_years || 5);
  const [editActive, setEditActive] = useState(profile?.is_active !== false);

  // Profile Image Edit States
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editImageBase64, setEditImageBase64] = useState('');
  const [imageChanged, setImageChanged] = useState(false);

  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const handleOpenEdit = () => {
    setEditName(driver.full_name || '');
    setEditPhone(driver.phone_number || '');
    setEditModel(
      profile?.vehicle_model ||
      (profile?.vehicle_id?.includes('•') ? profile.vehicle_id.split('•')[1].trim() : 'Toyota Hilux 4x4 (6 Seats)')
    );
    setEditPlate(
      profile?.vehicle_id?.includes('•') ? profile.vehicle_id.split('•')[0].trim() : (profile?.vehicle_id || '')
    );
    setEditPrice(profile?.price_per_safari || 12500);
    setEditExp(profile?.experience_years || 5);
    setEditActive(profile?.is_active !== false);

    // Initial image state
    const currentAvatar = driver.profile_image || (avatarError ? '' : avatarUrl);
    setEditImagePreview(currentAvatar || '');
    setEditImageBase64(driver.profile_image || '');
    setImageChanged(false);

    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setEditError('Profile image size must be less than 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
        setEditImageBase64(reader.result);
        setImageChanged(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveEditImage = () => {
    setEditImagePreview('');
    setEditImageBase64('');
    setImageChanged(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Driver full name is required.');
      return;
    }
    if (!editPlate.trim()) {
      setEditError('Vehicle Plate / Permit is required.');
      return;
    }

    setSavingEdit(true);
    setEditError('');
    setEditSuccess('');

    try {
      let formattedPhone = editPhone.trim();
      if (formattedPhone) {
        let cleaned = formattedPhone.replace(/\D/g, '');
        if (cleaned.startsWith('0')) cleaned = '94' + cleaned.substring(1);
        else if (!cleaned.startsWith('94')) cleaned = '94' + cleaned;
        formattedPhone = '+' + cleaned;
      }

      const combinedVehicleId = `${editPlate.trim()} • ${editModel.trim()}`;

      // 1. Backend API call
      try {
        const apiPayload = {
          full_name: editName.trim(),
          phone_number: formattedPhone,
          vehicle_id: combinedVehicleId,
          vehicle_model: editModel.trim(),
          price_per_safari: Number(editPrice),
          experience_years: Number(editExp),
          is_active: editActive
        };
        if (imageChanged) {
          apiPayload.profile_image = editImageBase64;
        }

        await fetch(`${API_BASE_URL}/api/driver/${driver.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPayload)
        });
      } catch (apiErr) {
        console.warn('Backend API update warning:', apiErr.message);
      }

      // 2. Direct Supabase update
      const userUpdates = {
        full_name: editName.trim(),
        phone_number: formattedPhone
      };
      if (imageChanged) {
        userUpdates.profile_image = editImageBase64 ? (
          editImageBase64.startsWith('data:') ? editImageBase64 : `data:image/jpeg;base64,${editImageBase64}`
        ) : null;
      }

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', driver.id);

      if (userError) throw userError;

      const profilePayload = {
        id: driver.id,
        vehicle_id: combinedVehicleId,
        vehicle_model: editModel.trim(),
        price_per_safari: Number(editPrice),
        experience_years: Number(editExp),
        is_active: editActive
      };

      const { error: profileError } = await supabase
        .from('driver_profiles')
        .upsert(profilePayload);

      if (profileError) throw profileError;

      if (imageChanged) {
        setAvatarError(false);
      }
      setEditSuccess('Driver details and profile photo updated successfully!');
      if (onDriverUpdated) {
        onDriverUpdated();
      }

      setTimeout(() => {
        setShowEditModal(false);
        setEditSuccess('');
      }, 1000);

    } catch (err) {
      console.error('Error saving driver edits:', err);
      setEditError(err.message || 'Failed to update driver details.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/driver/${driver.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete driver.');

      setShowDeleteConfirm(false);
      if (onDriverDeleted) {
        onDriverDeleted();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error occurred while deleting driver.');
    } finally {
      setDeleting(false);
    }
  };


  const avatarUrl = driver.profile_image || `${API_BASE_URL}/uploads/avatars/${driver.id}.jpg`;

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/driver/${driver.id}/reviews`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error("Failed to fetch reviews for driver:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (showReviews) {
      fetchReviews();
    }
  }, [showReviews]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8';

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition flex flex-col justify-between">
      <div className="absolute top-0 right-0 p-6 text-slate-850 pointer-events-none">
        <Award size={36} />
      </div>

      <div>
        <div className="flex items-center gap-4">
          {!avatarError ? (
            <img
              src={avatarUrl}
              alt={driver.full_name}
              onError={() => setAvatarError(true)}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-800 bg-slate-950 shadow-inner shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 text-emerald-400 font-extrabold text-xl flex items-center justify-center shrink-0">
              {driver.full_name?.charAt(0) || 'D'}
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-slate-200 text-base group-hover:text-emerald-400 transition-colors">
                {driver.full_name}
              </h3>
              <CheckCircle size={14} className="text-emerald-500 shrink-0" />
            </div>
            <div className="flex flex-col mt-0.5">
              <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase">
                {profile?.vehicle_model || (profile?.vehicle_id?.includes('•') ? profile.vehicle_id.split('•')[1].trim() : 'Toyota Hilux 4x4 (6 Seats)')}
              </span>
              <span className="text-[10px] text-slate-500 font-black tracking-wider uppercase">
                PLATE: {profile?.vehicle_id?.includes('•') ? profile.vehicle_id.split('•')[0].trim() : (profile?.vehicle_id || 'Not Assigned')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2 border-t border-slate-800/60 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-slate-500 shrink-0" />
            <span>{driver.phone_number || 'No Contact Listed'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={13} className="text-amber-500 shrink-0 fill-amber-500" />
            <span>Rating: <span className="font-bold text-slate-200">{avgRating}</span> ({reviews.length || 0} reviews)</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/40 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="flex-1 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageSquare size={12} />
            {showReviews ? 'Hide' : 'User Feedback'}
          </button>

          <button
            onClick={handleOpenEdit}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-3.5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Edit Driver Details"
          >
            <Edit3 size={12} />
            <span>Edit</span>
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 font-bold px-3 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
            title="Delete Driver"
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>

        {showReviews && (
          <div className="mt-2 space-y-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-900 max-h-45 overflow-y-auto">
            {loadingReviews ? (
              <p className="text-[10px] text-slate-500 text-center py-2">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-2">No feedback reports found.</p>
            ) : (
              reviews.map((r, i) => (
                <div key={i} className="text-[10px] leading-relaxed border-b border-slate-900 pb-2 last:border-b-0">
                  <div className="flex justify-between font-bold text-slate-300">
                    <span>{r.tourist_name || 'Anonymous'}</span>
                    <span className="flex items-center gap-0.5 text-amber-500">
                      ★ {r.rating}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

            {/* Edit Driver Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 relative shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar">

            <button
              onClick={() => {
                setShowEditModal(false);
                setEditError('');
                setEditSuccess('');
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition cursor-pointer p-1"
            >
              <X size={20} />
            </button>

            <div className="border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base sm:text-lg font-black text-slate-200 flex items-center gap-2">
                <Edit3 className="text-emerald-400" size={18} />
                Edit Driver Details
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Updating profile for <span className="text-emerald-400 font-bold">{driver.full_name}</span>
              </p>
            </div>

            {editError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3.5 py-2.5 rounded-xl text-xs mb-4">
                {editError}
              </div>
            )}

            {editSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 mb-4">
                <Check size={14} />
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-left">
              {/* Profile Photo Edit Section */}
              <div className="space-y-1.5 pb-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl">
                  {editImagePreview ? (
                    <div className="relative w-16 h-16 shrink-0 group">
                      <img
                        src={editImagePreview}
                        alt="Profile Preview"
                        className="w-full h-full rounded-2xl object-cover border-2 border-emerald-500/30 shadow-md bg-slate-900"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-dashed border-slate-700 flex items-center justify-center shrink-0 text-slate-500">
                      <Camera size={22} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <label className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5">
                        <Camera size={13} />
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageChange}
                          className="hidden"
                        />
                      </label>

                      {editImagePreview && (
                        <button
                          type="button"
                          onClick={handleRemoveEditImage}
                          className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">Supported: JPG, PNG, WEBP (Max 3MB)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+94771234567"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Vehicle Model
                  </label>
                  <select
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-emerald-500 focus:outline-none transition"
                  >
                    <option value="Toyota Hilux 4x4 (6 Seats)">Toyota Hilux 4x4 (6 Seats)</option>
                    <option value="Toyota Land Cruiser 70 (8 Seats)">Toyota Land Cruiser 70 (8 Seats)</option>
                    <option value="Toyota Hilux Revo Custom (6 Seats)">Toyota Hilux Revo Custom (6 Seats)</option>
                    <option value="Land Rover Defender 110 (7 Seats)">Land Rover Defender 110 (7 Seats)</option>
                    <option value="Mitsubishi L200 Safari Spec (6 Seats)">Mitsubishi L200 Safari Spec (6 Seats)</option>
                    <option value="Mahindra Scorpio 4WD (6 Seats)">Mahindra Scorpio 4WD (6 Seats)</option>
                    <option value="Isuzu D-Max Safari (6 Seats)">Isuzu D-Max Safari (6 Seats)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Vehicle Plate / Permit
                  </label>
                  <input
                    type="text"
                    required
                    value={editPlate}
                    onChange={(e) => setEditPlate(e.target.value)}
                    placeholder="e.g. SP-NC-4821"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Safari Rate (LKR)
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="500"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editExp}
                    onChange={(e) => setEditExp(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl max-w-sm w-full p-6 relative shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-2">
              <Trash2 size={22} className="animate-pulse" />
            </div>

            <h4 className="text-base font-black text-slate-200">Delete Safari Guide</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Are you sure you want to delete driver <span className="font-bold text-slate-200">{driver.full_name}</span>?<br />
              This action cannot be undone.
            </p>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer text-center"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DriverReviewList({ drivers, onDriverAdded, onDriverUpdated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleModel, setVehicleModel] = useState('Toyota Hilux 4x4 (6 Seats)');
  const [phone, setPhone] = useState('+94');

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);

  const passwordCriteria = [
    { label: '8+ Chars', met: hasMinLength },
    { label: 'A-Z', met: hasUpper },
    { label: 'a-z', met: hasLower },
    { label: '0-9', met: hasNumber },
    { label: 'Symbol (!@#)', met: hasSpecial },
  ];

  const passedCriteriaCount = passwordCriteria.filter((c) => c.met).length;
  const isPasswordStrong = passedCriteriaCount === 5;

  const getStrengthMeta = () => {
    if (!password) return { label: '', color: '', width: '0%', textClass: '' };
    if (passedCriteriaCount <= 2) {
      return { label: 'Weak', color: 'bg-red-500', width: '33%', textClass: 'text-red-400' };
    }
    if (passedCriteriaCount <= 4) {
      return { label: 'Moderate', color: 'bg-amber-400', width: '66%', textClass: 'text-amber-400' };
    }
    return { label: 'Strong (Secure)', color: 'bg-emerald-400', width: '100%', textClass: 'text-emerald-400' };
  };

  const strengthMeta = getStrengthMeta();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const [profileImage, setProfileImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const formatPhoneWithPlus94 = (rawPhone) => {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = '94' + digits.substring(1);
    } else if (!digits.startsWith('94')) {
      digits = '94' + digits;
    }
    return '+' + digits;
  };

  const handlePhoneChange = (e) => {
    let input = e.target.value;
    if (!input || input === '+' || input === '+9') {
      setPhone('+94');
      return;
    }
    if (!input.startsWith('+94')) {
      const digits = input.replace(/\D/g, '');
      if (digits.startsWith('0')) {
        input = '+94' + digits.substring(1);
      } else if (digits.startsWith('94')) {
        input = '+' + digits;
      } else {
        input = '+94' + digits;
      }
    }
    setPhone(input);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setProfileImage('');
  };

  const handleRegisterDriver = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !vehicleId || !phone) {
      setError('Please fill in all required fields.');
      return;
    }

    const isStrongPassword = (pwd) => {
      return (
        pwd.length >= 8 &&
        /[A-Z]/.test(pwd) &&
        /[a-z]/.test(pwd) &&
        /[0-9]/.test(pwd) &&
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd)
      );
    };

    if (!isStrongPassword(password)) {
      setError('Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters (!@#$...).');
      return;
    }

    setError('');
    setSuccessMsg('');

    if (!otpSent) {
      setLoading(true);
      try {
        const otpRes = await fetch(`${API_BASE_URL}/api/auth/send-email-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, roleTitle: 'Safari Driver' })
        });

        const otpData = await otpRes.json();

        if (!otpRes.ok) {
          throw new Error(otpData.error || 'Failed to send verification code.');
        }

        setOtpSent(true);
        const msg = otpData.message || `Verification code sent to ${email}!`;
        setSuccessMsg(msg);

        if (otpData.otp) {
          console.log(`[DEV HELPER] Email Verification Code: ${otpData.otp}`);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error occurred while sending verification code.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!verificationCode) {
      setError('Please enter the verification code.');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneWithPlus94(phone);

      const registerRes = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          password: password,
          role: 'DRIVER',
          phone_number: formattedPhone,
          vehicle_id: vehicleId.trim(),
          vehicle_model: vehicleModel.trim(),
          verification_code: verificationCode,
          profile_image: profileImage
        })
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(registerData.error || 'Failed to register driver.');
      }

      const driverUserId = registerData.user.id;

      if (formattedPhone) {
        await supabase
          .from('users')
          .update({ phone_number: formattedPhone })
          .eq('id', driverUserId);
      }

      setSuccessMsg('Driver registered successfully!');

      setFullName('');
      setEmail('');
      setPassword('');
      setVehicleId('');
      setVehicleModel('Toyota Hilux 4x4 (6 Seats)');
      setPhone('+94');
      setVerificationCode('');
      setProfileImage('');
      setImagePreview('');
      setOtpSent(false);

      if (onDriverAdded) {
        onDriverAdded();
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg('');
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while saving registry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Safari Guides Directory</h3>
          <p className="text-xs text-slate-500">Monitor active guide registries, vehicle permits, and tourist feedback.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold px-4 sm:px-5 py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-500/5 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Plus size={16} />
          <span>Register New Driver</span>
        </button>
      </div>

      {drivers.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 rounded-3xl text-center">
          <div className="w-14 h-14 rounded-full bg-slate-855 text-slate-500 flex items-center justify-center mb-3 mx-auto">
            <User size={24} />
          </div>
          <h4 className="text-base font-bold text-slate-200">No Guides Found</h4>
          <p className="text-xs text-slate-500 mt-1">There are no drivers registered on the system database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {drivers.map((driver) => (
            <DriverCard key={driver.id} driver={driver} onDriverDeleted={onDriverAdded} onDriverUpdated={onDriverUpdated || onDriverAdded} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl max-w-md w-full p-5 sm:p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">

            <button
              onClick={() => {
                setIsModalOpen(false);
                setError('');
                setSuccessMsg('');
                setOtpSent(false);
                setVerificationCode('');
                setProfileImage('');
                setImagePreview('');
                setPhone('+94');
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition cursor-pointer p-1"
            >
              <X size={20} />
            </button>

            <h3 className="text-base sm:text-lg font-black text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="text-emerald-400" size={20} />
              Register Safari Guide
            </h3>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3.5 py-2.5 rounded-xl text-xs mb-4">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 mb-4">
                <Check size={14} />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleRegisterDriver} className="space-y-3.5 text-left">

              {!otpSent ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <User size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sunil Perera"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-slate-100 placeholder-slate-500 rounded-xl py-2.5 pl-9 pr-4 text-xs transition outline-none shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Mail size={14} />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="sunil@driver.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-slate-100 placeholder-slate-500 rounded-xl py-2.5 pl-9 pr-4 text-xs transition outline-none shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driver Login Password *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Lock size={14} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 8 chars with Aa, 0-9, !@#"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-slate-100 placeholder-slate-500 rounded-xl py-2.5 pl-9 pr-10 text-xs transition outline-none shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {password.length > 0 && (
                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 space-y-2 mt-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                            <ShieldCheck size={13} className={isPasswordStrong ? 'text-emerald-400' : 'text-slate-400'} />
                            Strength:
                          </span>
                          <span className={`font-bold uppercase tracking-wider text-[10px] ${strengthMeta.textClass}`}>
                            {strengthMeta.label}
                          </span>
                        </div>

                        <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${strengthMeta.color}`}
                            style={{ width: strengthMeta.width }}
                          ></div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 pt-0.5">
                          {passwordCriteria.map((crit, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-all justify-center ${
                                crit.met
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-900/60 text-slate-500 border border-slate-800/60'
                              }`}
                            >
                              {crit.met ? (
                                <Check size={10} className="stroke-3 text-emerald-400 shrink-0" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full border border-slate-600 shrink-0"></div>
                              )}
                              <span className="truncate">{crit.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Plate Number *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                          <Car size={14} />
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. WP-LH-8822"
                          value={vehicleId}
                          onChange={(e) => setVehicleId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-slate-100 placeholder-slate-500 rounded-xl py-2.5 pl-9 pr-4 text-xs transition outline-none shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Model / Type *</label>
                      <select
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-slate-100 rounded-xl py-2.5 px-3 text-xs transition outline-none shadow-xs cursor-pointer"
                      >
                        <option value="Toyota Hilux 4x4 (6 Seats)">Toyota Hilux 4x4 (6 Seats)</option>
                        <option value="Toyota Land Cruiser 4x4 (6-8 Seats)">Toyota Land Cruiser 4x4 (6-8 Seats)</option>
                        <option value="Toyota Prado 4x4 (6 Seats)">Toyota Prado 4x4 (6 Seats)</option>
                        <option value="Mahindra Scorpio 4x4 (6 Seats)">Mahindra Scorpio 4x4 (6 Seats)</option>
                        <option value="Mitsubishi Pajero 4x4 (6 Seats)">Mitsubishi Pajero 4x4 (6 Seats)</option>
                        <option value="ISUZU D-Max 4x4 (6 Seats)">ISUZU D-Max 4x4 (6 Seats)</option>
                        <option value="Tata Xenon 4x4 (6 Seats)">Tata Xenon 4x4 (6 Seats)</option>
                        <option value="Custom 4x4 Safari Jeep (6 Seats)">Custom 4x4 Safari Jeep (6 Seats)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Phone size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +94771234567"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-slate-100 placeholder-slate-500 rounded-xl py-2.5 pl-9 pr-4 text-xs transition outline-none shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profile Photo</label>

                    {imagePreview ? (
                      <div className="relative w-20 h-20 mx-auto group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full rounded-2xl object-cover border-2 border-emerald-500/30 shadow-md bg-slate-950"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition shadow-md cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-20 bg-slate-950 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl cursor-pointer transition group">
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <Camera size={18} className="text-slate-500 group-hover:text-emerald-400 transition mb-1" />
                          <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition font-bold uppercase tracking-wider">Upload Profile Photo</p>
                          <p className="text-[8px] text-slate-600 mt-0.5">Max 2MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-950 border border-slate-700 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="text-slate-200 font-bold">{fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-200 font-mono truncate max-w-45">{email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vehicle:</span>
                      <span className="text-slate-200 font-mono truncate max-w-50">{vehicleId} ({vehicleModel})</span>
                    </div>
                    {phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span className="text-slate-200 font-mono">{phone}</span>
                      </div>
                    )}
                    {imagePreview && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-900">
                        <span className="text-slate-500">Photo:</span>
                        <img src={imagePreview} alt="Driver" className="w-8 h-8 rounded-lg object-cover border border-slate-800" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Enter Verification Code *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Lock size={14} className="text-emerald-400" />
                      </span>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full bg-slate-950 border-2 border-emerald-500/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-slate-100 placeholder-slate-500 rounded-xl py-2.5 pl-9 pr-4 text-xs tracking-widest text-center font-bold transition outline-none shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] px-1 text-slate-500 font-bold uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="hover:text-slate-300 transition cursor-pointer"
                    >
                      ← Edit Details
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setLoading(true);
                        setError('');
                        setSuccessMsg('');
                        try {
                          const otpRes = await fetch(`${API_BASE_URL}/api/auth/send-email-otp`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, roleTitle: 'Safari Driver' })
                          });
                          const otpData = await otpRes.json();
                          if (!otpRes.ok) throw new Error(otpData.error || 'Failed to resend code.');
                          setSuccessMsg(otpData.message || `Verification code resent to ${email}!`);
                          if (otpData.otp) {
                            console.log(`[DEV HELPER] Email Verification Code: ${otpData.otp}`);
                          }
                        } catch (err) {
                          setError(err.message || 'Failed to resend code.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                    >
                      Resend Code
                    </button>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold py-3 rounded-2xl text-xs transition shadow-md shadow-emerald-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer mt-5"
              >
                {loading
                  ? (otpSent ? 'Verifying & Registering...' : 'Sending Code...')
                  : (otpSent ? 'Verify & Complete Registration' : 'Send Verification Code')}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
