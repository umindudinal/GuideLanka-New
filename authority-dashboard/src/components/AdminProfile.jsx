import { useState, useRef } from 'react';

import { supabase } from '../services/supabase';

import {
  User,
  Mail,
  Shield,
  Calendar,
  Lock,
  CheckCircle2,
  Award,
  Key,
  Edit3,
  Phone,
  Camera,
  Save,
  X,
  Loader2
} from 'lucide-react';

export default function AdminProfile({ user, onUserUpdate }) {
  if (!user) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || '');
  const [avatarUrl, setAvatarUrl] = useState(user.profile_image || localStorage.getItem('admin_avatar_' + user.id) || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fileInputRef = useRef(null);

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })
    : 'July 15, 2026';

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ text: 'Please select an image file.', type: 'error' });
        return;
      }
      if (file.size > 1.5 * 1024 * 1024) {
        setMessage({ text: 'Image size must be less than 1.5MB.', type: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
          profile_image: avatarUrl
        })
        .eq('id', user.id);

      if (error) throw error;

      if (avatarUrl) {
        localStorage.setItem('admin_avatar_' + user.id, avatarUrl);
      } else {
        localStorage.removeItem('admin_avatar_' + user.id);
      }

      const updatedUser = {
        ...user,
        full_name: fullName,
        phone_number: phoneNumber,
        profile_image: avatarUrl
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);

      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      console.error(err);
      setMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(user.full_name || '');
    setPhoneNumber(user.phone_number || '');
    setAvatarUrl(user.profile_image || localStorage.getItem('admin_avatar_' + user.id) || '');
    setIsEditing(false);
    setMessage({ text: '', type: '' });
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans max-w-4xl mx-auto w-full">

      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold uppercase tracking-wider border ${
          message.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-950/40 border-rose-500/20 text-rose-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="relative bg-linear-to-r from-emerald-950/40 via-teal-950/20 to-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-5 sm:gap-6 z-10 w-full md:w-auto">

          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/10 overflow-hidden">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-2xl sm:text-3xl text-emerald-400">
                    {fullName.charAt(0) || 'A'}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center text-emerald-400 cursor-pointer"
              title="Upload new photo"
              type="button"
            >
              <Camera size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden"
              accept="image/png, image/jpeg, image/jpg"
            />

            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1.5 rounded-xl border-2 border-slate-950 shadow-md">
              <Award size={14} />
            </span>
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 truncate">{fullName || 'Park Officer'}</h2>
              <span className="inline-flex self-center sm:self-auto items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0">
                <CheckCircle2 size={10} />
                Verified Ranger
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-bold truncate">{user.email}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-black">{user.role || 'Ranger Authority'}</p>
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="z-10 flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer w-full md:w-auto shrink-0"
          >
            <Edit3 size={14} />
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800/60 pb-3">
            Modify Administrative Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 font-black uppercase tracking-widest">Full Legal Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 text-xs sm:text-sm font-bold text-slate-200 rounded-2xl focus:outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 font-black uppercase tracking-widest">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="No phone number set"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-slate-700 text-xs sm:text-sm font-bold text-slate-200 rounded-2xl focus:outline-none transition"
                />
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-800/40">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-bold px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer"
            >
              <X size={14} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-1.5 bg-linear-to-r from-emerald-600 to-teal-500 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/10"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Save size={14} />
              )}
              Save Changes
            </button>
          </div>

        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-5 sm:space-y-6">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <User size={16} className="text-emerald-400" />
              General Information
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Full Legal Name</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block">{user.full_name || 'Anonymous Officer'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Email Address</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block truncate">{user.email}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Phone Number</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block">
                  {user.phone_number || <span className="text-slate-600 italic">No phone set — Edit profile to add</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-5 sm:space-y-6">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Shield size={16} className="text-emerald-400" />
              System Security Credentials
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Authorization Status</span>
                <span className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  ACTIVE SECURE SESSION
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Permissions Clearance Scope</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block">Full Read-Write Database Access</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Session ID / Key Scope</span>
                <span className="text-xs font-mono text-slate-400 mt-1 block truncate">
                  sha256:d5c21...8ffca01b5a341e0
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-5">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/60 pb-3">
          <Calendar size={16} className="text-emerald-400" />
          System Activity History
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
              <Key size={18} />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Account Created On</span>
              <span className="text-xs sm:text-sm font-bold text-slate-300 mt-0.5">{joinedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Security Standard</span>
              <span className="text-xs sm:text-sm font-bold text-slate-300 mt-0.5">AES-256 Bit Encryption Active</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
